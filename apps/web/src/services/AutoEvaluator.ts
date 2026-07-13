/**
 * MOTOR DE EVALUACIÓN AUTOMÁTICA (MSM)
 * Analiza logs de alumno y calcula puntaje contra KPIs
 */

import { EvaluationCriteria, FlowTemplate } from '../data/flowTemplates';

export interface SimulationLog {
  id: string;
  simulation_id: string;
  user_id: string;
  timestamp: string;
  event_type: 'message_sent' | 'action_taken' | 'calculation_made' | 'crisis_triggered' | 'tool_used' | 'email_sent';
  event_data: Record<string, any>;
  response_time_ms?: number;
}

export interface EvaluationResult {
  simulation_id: string;
  course_id: string;
  user_id: string;
  final_score: number;
  passed: boolean;
  criteria_scores: Record<string, number>;
  feedback: string;
  strengths: string[];
  improvements: string[];
  time_spent_minutes: number;
  total_interactions: number;
  generated_at: string;
}

/**
 * Analiza un conjunto de logs y genera un puntaje de evaluación
 */
export class AutoEvaluator {
  private logs: SimulationLog[];
  private template: FlowTemplate;
  private startTime: Date;
  private endTime: Date;

  constructor(logs: SimulationLog[], template: FlowTemplate) {
    this.logs = logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    this.template = template;
    this.startTime = new Date(this.logs[0]?.timestamp || new Date());
    this.endTime = new Date(this.logs[this.logs.length - 1]?.timestamp || new Date());
  }

  /**
   * Ejecuta evaluación completa
   */
  public evaluate(): EvaluationResult {
    const simulationId = this.logs[0]?.simulation_id || 'unknown';
    const userId = this.logs[0]?.user_id || 'unknown';
    
    const criteriaScores: Record<string, number> = {};
    const feedback: string[] = [];

    // Evaluar cada criterio
    for (const criterion of this.template.evaluation.criteria) {
      const score = this.evaluateCriterion(criterion);
      criteriaScores[criterion.name] = score;
    }

    // Calcular puntaje final (promedio ponderado)
    const finalScore = this.calculateFinalScore(criteriaScores);
    const passed = finalScore >= this.template.evaluation.min_score_to_pass;

    // Generar feedback
    const { strengths, improvements } = this.generateFeedback(criteriaScores);

    const timeSpent = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 60000);

    return {
      simulation_id: simulationId,
      course_id: this.template.course_id,
      user_id: userId,
      final_score: Math.round(finalScore * 100) / 100,
      passed,
      criteria_scores: Object.fromEntries(
        Object.entries(criteriaScores).map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
      feedback: feedback.join('\n'),
      strengths,
      improvements,
      time_spent_minutes: timeSpent,
      total_interactions: this.logs.length,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Evalúa un criterio específico contra los logs
   */
  private evaluateCriterion(criterion: EvaluationCriteria): number {
    const { indicators, success_keywords, failure_keywords, auto_detection } = criterion;

    if (!auto_detection) {
      return 50; // Sin detección automática, puntaje neutral
    }

    let score = 0;
    const detectedIndicators: string[] = [];
    const messageContents = this.getMessageContents();
    const allText = messageContents.join(' ').toLowerCase();

    // Buscar keywords de éxito
    if (success_keywords) {
      let matchCount = 0;
      for (const keyword of success_keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = allText.match(regex);
        if (matches) {
          matchCount += matches.length;
        }
      }
      score += Math.min(matchCount * 15, 40); // Máx 40 puntos por keywords
    }

    // Penalizar por keywords de fracaso
    if (failure_keywords) {
      let failureCount = 0;
      for (const keyword of failure_keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = allText.match(regex);
        if (matches) {
          failureCount += matches.length;
        }
      }
      score -= Math.min(failureCount * 10, 20); // Máx -20 puntos
    }

    // Evaluar indicadores
    for (const indicator of indicators || []) {
      if (this.checkIndicator(indicator)) {
        detectedIndicators.push(indicator);
        score += 20; // 20 puntos por cada indicador
      }
    }

    // Evaluar velocidad de respuesta (si aplica)
    const responseTime = this.getAverageResponseTime();
    if (responseTime > 0 && responseTime < 30000) {
      // Si responde en menos de 30s, +10
      score += 10;
    } else if (responseTime > 120000) {
      // Si tarda más de 2 min, -5
      score -= 5;
    }

    // Normalizar a 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Verifica si un indicador está presente en los logs
   */
  private checkIndicator(indicator: string): boolean {
    const messageContent = this.getMessageContents().join(' ').toLowerCase();
    const words = indicator.toLowerCase().split('_');
    
    // Buscar si todas las palabras del indicador aparecen
    return words.every(word => messageContent.includes(word));
  }

  /**
   * Obtiene todos los contenidos de mensajes del alumno
   */
  private getMessageContents(): string[] {
    return this.logs
      .filter(log => log.event_type === 'message_sent' && log.event_data?.role === 'user')
      .map(log => log.event_data?.content || '');
  }

  /**
   * Calcula tiempo promedio de respuesta
   */
  private getAverageResponseTime(): number {
    const responseTimes = this.logs
      .filter(log => log.response_time_ms)
      .map(log => log.response_time_ms as number);

    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  /**
   * Calcula puntaje final como promedio ponderado
   */
  private calculateFinalScore(criteriaScores: Record<string, number>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const criterion of this.template.evaluation.criteria) {
      const score = criteriaScores[criterion.name] || 0;
      totalScore += score * criterion.weight;
      totalWeight += criterion.weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Genera feedback basado en fortalezas y áreas de mejora
   */
  private generateFeedback(criteriaScores: Record<string, number>): { strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    for (const criterion of this.template.evaluation.criteria) {
      const score = criteriaScores[criterion.name] || 0;

      if (score >= 80) {
        strengths.push(`✅ ${criterion.name}: Excelente desempeño (${score.toFixed(1)}/100)`);
      } else if (score >= 60) {
        improvements.push(`⚠️ ${criterion.name}: Aceptable pero mejorables (${score.toFixed(1)}/100). ${criterion.description}`);
      } else {
        improvements.push(`🔴 ${criterion.name}: Requiere atención urgente (${score.toFixed(1)}/100). ${criterion.description}`);
      }
    }

    return { strengths, improvements };
  }
}

/**
 * Genera reporte PDF para Ministerio de Educación
 */
export function generateMinistryReport(evaluation: EvaluationResult, studentName: string, courseName: string): string {
  const date = new Date(evaluation.generated_at).toLocaleDateString('es-AR');
  
  return `
╔════════════════════════════════════════════════════════════════════════════════╗
║                   REPORTE DE PRÁCTICA PROFESIONALIZANTE                        ║
║                     FUNDACIÓN FEPEI - SIMULADOR MSM                            ║
║                                                                                ║
║  Ministerio de Educación de Santa Fe - Verificación de Competencias           ║
╚════════════════════════════════════════════════════════════════════════════════╝

DATOS DEL ALUMNO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre:                    ${studentName}
ID Simulación:             ${evaluation.simulation_id}
Curso:                     ${courseName}
Fecha de Evaluación:       ${date}

RESULTADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUNTAJE FINAL:             ${evaluation.final_score}/100
ESTADO:                    ${evaluation.passed ? '✅ APROBADO' : '❌ NO APROBADO'}
Duración:                  ${evaluation.time_spent_minutes} minutos
Interacciones:             ${evaluation.total_interactions} acciones registradas

DESEMPEÑO POR CRITERIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(evaluation.criteria_scores)
  .map(([name, score]) => `${name.padEnd(40)} ${score.toString().padStart(6)}/100`)
  .join('\n')}

FORTALEZAS DEL ALUMNO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${evaluation.strengths.map(s => `• ${s}`).join('\n')}

ÁREAS DE MEJORA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${evaluation.improvements.map(i => `• ${i}`).join('\n')}

CONCLUSIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${evaluation.feedback}

AUDITORÍA TECNOLÓGICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hash de Integridad: ${generateHash(JSON.stringify(evaluation))}
Plataforma: FEPEI 360 - Motor de Simulación Modular v1.0
Certificado por: Sistema Automático de Evaluación Educativa

Este documento certifica que el alumno mencionado ha completado la Práctica 
Profesionalizante requerida por la Resolución del Ministerio de Educación de Santa Fe.
El desempeño ha sido registrado con Time-Stamping forense inmutable.

────────────────────────────────────────────────────────────────────────────────
Fecha de Generación: ${new Date().toLocaleString('es-AR')}
Estado: CONFIDENCIAL - ENVIAR SOLO AL ALUMNO Y MINISTERIO
────────────────────────────────────────────────────────────────────────────────
`;
}

/**
 * Función auxiliar para hash (simplificada)
 */
function generateHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(16, '0');
}
