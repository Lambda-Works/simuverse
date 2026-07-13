'use client'
/**
 * TeacherPanel.tsx
 * 
 * Panel for teachers to view student simulations
 * Shows/hides admin_data based on admin configuration
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/ApiClient';
import './TeacherPanel.css';

interface Simulation {
  simulation_id: string;
  status: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  student_data?: {
    scenario?: { title: string; category: string };
    context?: string;
    objectives?: any;
  };
  evaluation?: {
    overall_score: number;
    score_breakdown?: any;
    feedback?: string;
    areas_for_improvement?: string[];
  };
  metrics?: {
    time_spent_seconds: number;
    messages_count: number;
    help_requests: number;
  };
  admin_data?: {
    ai_config?: {
      systemPrompt: string;
      base_role: string;
      temperature: number;
      top_p: number;
      max_tokens: number;
    };
    score_calculation?: any;
  };
}

interface TeacherPanelProps {
  simulationId: string;
}

export function TeacherPanel({ simulationId }: TeacherPanelProps) {
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSimulation();
  }, [simulationId]);

  const loadSimulation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/simulations/${simulationId}`);

      const data = response.data;
      setSimulation(data);
    } catch (err) {
      console.error('❌ Error loading simulation:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="teacher-panel loading">Cargando simulación...</div>;
  }

  if (error) {
    return <div className="teacher-panel error">Error: {error}</div>;
  }

  if (!simulation) {
    return <div className="teacher-panel error">Simulación no encontrada</div>;
  }

  const hasAdminData = !!simulation.admin_data;

  return (
    <div className="teacher-panel">
      {/* Header */}
      <div className="panel-header">
        <h2>👨‍🎓 {simulation.student_name || 'Estudiante'}</h2>
        <p className="status" data-status={simulation.status}>
          {simulation.status === 'in_progress' && '🔄 En progreso'}
          {simulation.status === 'completed' && '✅ Completado'}
          {simulation.status === 'paused' && '⏸️ Pausado'}
        </p>
      </div>

      {/* Student Data */}
      {simulation.student_data && (
        <div className="section student-data">
          <h3>📚 Caso de Simulación</h3>
          <div className="section-content">
            {simulation.student_data.scenario && (
              <div className="item">
                <strong>Escenario:</strong> {simulation.student_data.scenario.title}
              </div>
            )}
            {simulation.student_data.context && (
              <div className="item">
                <strong>Contexto:</strong>
                <p>{simulation.student_data.context}</p>
              </div>
            )}
            {simulation.student_data.objectives && (
              <div className="item">
                <strong>Objetivos de Aprendizaje:</strong>
                <ul>
                  {Array.isArray(simulation.student_data.objectives) ? (
                    simulation.student_data.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))
                  ) : (
                    <li>{JSON.stringify(simulation.student_data.objectives)}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evaluation */}
      {simulation.evaluation && (
        <div className="section evaluation">
          <h3>📊 Evaluación</h3>
          <div className="section-content">
            <div className="score-display">
              <span className="score-value">{simulation.evaluation.overall_score}</span>
              <span className="score-label">/100</span>
            </div>

            {simulation.evaluation.score_breakdown && (
              <div className="item">
                <strong>Desglose de Puntaje:</strong>
                <div className="breakdown">
                  {typeof simulation.evaluation.score_breakdown === 'object' &&
                    Object.entries(simulation.evaluation.score_breakdown).map(
                      ([key, value]) => (
                        <div key={key} className="breakdown-item">
                          <span>{key}:</span>
                          <span>{value}/10</span>
                        </div>
                      )
                    )}
                </div>
              </div>
            )}

            {simulation.evaluation.feedback && (
              <div className="item">
                <strong>Retroalimentación:</strong>
                <p>{simulation.evaluation.feedback}</p>
              </div>
            )}

            {simulation.evaluation.areas_for_improvement &&
              simulation.evaluation.areas_for_improvement.length > 0 && (
                <div className="item">
                  <strong>Áreas para Mejorar:</strong>
                  <ul>
                    {simulation.evaluation.areas_for_improvement.map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Metrics */}
      {simulation.metrics && (
        <div className="section metrics">
          <h3>⏱️ Métricas</h3>
          <div className="section-content metrics-grid">
            <div className="metric">
              <span className="metric-label">Tiempo usado:</span>
              <span className="metric-value">
                {Math.floor(simulation.metrics.time_spent_seconds / 60)} min
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Mensajes:</span>
              <span className="metric-value">{simulation.metrics.messages_count}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Ayuda solicitada:</span>
              <span className="metric-value">{simulation.metrics.help_requests} veces</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Data - Conditional */}
      {hasAdminData && (
        <div className="section admin-data">
          <h3>⚙️ Configuración de IA (Habilitada por Admin)</h3>
          <div className="section-content">
            {simulation.admin_data.ai_config && (
              <div className="item">
                <strong>Configuración del Sistema:</strong>

                {simulation.admin_data.ai_config.systemPrompt && (
                  <div className="sub-item">
                    <span className="label">Instrucción (systemPrompt):</span>
                    <p className="code-block">
                      {simulation.admin_data.ai_config.systemPrompt}
                    </p>
                  </div>
                )}

                {simulation.admin_data.ai_config.base_role && (
                  <div className="sub-item">
                    <span className="label">Rol Asignado:</span>
                    <p>{simulation.admin_data.ai_config.base_role}</p>
                  </div>
                )}

                <div className="parameters">
                  <span className="label">Parámetros Técnicos:</span>
                  <div className="params-grid">
                    <div className="param">
                      <span>temperature:</span>
                      <span className="value">{simulation.admin_data.ai_config.temperature}</span>
                    </div>
                    <div className="param">
                      <span>top_p:</span>
                      <span className="value">{simulation.admin_data.ai_config.top_p}</span>
                    </div>
                    <div className="param">
                      <span>max_tokens:</span>
                      <span className="value">{simulation.admin_data.ai_config.max_tokens}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {simulation.admin_data.score_calculation && (
              <div className="item">
                <strong>Detalles del Cálculo de Puntuación:</strong>
                <pre className="code-block">
                  {JSON.stringify(simulation.admin_data.score_calculation, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Admin Data Message */}
      {!hasAdminData && (
        <div className="section no-admin-data">
          <p>
            📌 <strong>Nota:</strong> El administrador no ha habilitado el acceso a la configuración
            de IA. Para ver systemPrompt, parámetros y detalles de cálculo, contacta al admin.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        <button onClick={loadSimulation} className="btn btn-secondary">
          🔄 Recargar
        </button>
        <button className="btn btn-primary" disabled>
          📝 Ver Detalles Completos
        </button>
      </div>
    </div>
  );
}
