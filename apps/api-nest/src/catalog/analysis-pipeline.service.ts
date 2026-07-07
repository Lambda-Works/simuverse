import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkitdownClient } from './markitdown-client.service';
import { DeepSeekService } from './deepseek.service';

@Injectable()
export class AnalysisPipelineService {
  private readonly logger = new Logger(AnalysisPipelineService.name);

  constructor(
    private prisma: PrismaService,
    private markitdown: MarkitdownClient,
    private deepseek: DeepSeekService,
  ) {}

  async run(techSheetId: number): Promise<void> {
    const sheet = await this.prisma.techSheet.findUnique({
      where: { id: techSheetId },
    });

    if (!sheet) {
      throw new BadRequestException(`Tech sheet with ID ${techSheetId} not found`);
    }

    if (!sheet.file_url) {
      throw new BadRequestException('Tech sheet must have a file attached for analysis');
    }

    // Resolve the filesystem path from the file_url (e.g. "/api/files/{id}/download")
    const filePath = await this.resolveFilePath(sheet.file_url);

    const pipelineOutput: Record<string, any> = {};

    try {
      // Step 1: Convert document to markdown
      await this.updateStatus(techSheetId, 'step_1');
      const markdown = await this.markitdown.convert(filePath);
      pipelineOutput.step_1_markdown = markdown;
      await this.updateOutput(techSheetId, pipelineOutput);

      // Step 2: Validate document
      await this.updateStatus(techSheetId, 'step_2');
      const validationPrompt = this.getValidationPrompt(markdown);
      const validationResponse = await this.deepseek.chat(validationPrompt);
      pipelineOutput.step_2_validation = validationResponse;
      await this.updateOutput(techSheetId, pipelineOutput);

      // Check if document was rejected
      if (validationResponse.toUpperCase().includes('RECHAZADO')) {
        await this.prisma.techSheet.update({
          where: { id: techSheetId },
          data: { pipeline_status: 'validation_rejected' },
        });
        return;
      }

      // Step 3: Extract competencies
      await this.updateStatus(techSheetId, 'step_3');
      const competencyPrompt = this.getCompetencyPrompt(markdown);
      const competencyResponse = await this.deepseek.chat(competencyPrompt);
      pipelineOutput.step_3_competencies = competencyResponse;
      await this.updateOutput(techSheetId, pipelineOutput);

      // Step 4: Extract KPIs
      await this.updateStatus(techSheetId, 'step_4');
      const kpiPrompt = this.getKpiPrompt(markdown);
      const kpiResponse = await this.deepseek.chat(kpiPrompt);
      pipelineOutput.step_4_kpis = kpiResponse;
      await this.updateOutput(techSheetId, pipelineOutput);

      // Step 5: Generate questions
      await this.updateStatus(techSheetId, 'step_5');
      const questionPrompt = this.getQuestionPrompt(markdown, competencyResponse);
      const questionResponse = await this.deepseek.chat(questionPrompt);
      pipelineOutput.step_5_questions = questionResponse;
      await this.updateOutput(techSheetId, pipelineOutput);

      // Step 6: Create simulation prompt
      await this.updateStatus(techSheetId, 'step_6');
      const simulationPrompt = this.getSimulationPrompt(markdown, competencyResponse, kpiResponse);
      const simulationResponse = await this.deepseek.chat(simulationPrompt);
      pipelineOutput.step_6_simulation_prompt = simulationResponse;
      await this.updateOutput(techSheetId, pipelineOutput);

      // Step 7: Generate evaluation prompt
      await this.updateStatus(techSheetId, 'step_7');
      const evalPrompt = this.getEvaluationAIPrompt(markdown, competencyResponse, kpiResponse);
      const evalResponse = await this.deepseek.chat(evalPrompt);
      pipelineOutput.step_7_evaluation_prompt = evalResponse;
      await this.updateOutput(techSheetId, pipelineOutput);

      // Step 8: Generate coaching prompt
      await this.updateStatus(techSheetId, 'step_8');
      const coachPrompt = this.getCoachingAIPrompt(markdown, competencyResponse, kpiResponse, evalResponse);
      const coachResponse = await this.deepseek.chat(coachPrompt);
      pipelineOutput.step_8_coaching_prompt = coachResponse;
      await this.updateOutput(techSheetId, pipelineOutput);

      // Mark as completed and populate extracted_data
      await this.prisma.techSheet.update({
        where: { id: techSheetId },
        data: {
          pipeline_status: 'completed',
          processed: true,
          processed_at: new Date(),
          extracted_data: {
            analyzed_config: {
              competencies: competencyResponse,
              kpis: kpiResponse,
              questions: questionResponse,
              simulation_prompt: simulationResponse,
              evaluation_prompt: evalResponse,
              coaching_prompt: coachResponse,
            },
          },
        },
      });

      this.logger.log(`Pipeline completed for tech sheet ${techSheetId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failedStep = this.getFailedStep(pipelineOutput);

      this.logger.error(
        `Pipeline failed at step ${failedStep} for tech sheet ${techSheetId}: ${errorMessage}`,
      );

      await this.prisma.techSheet.update({
        where: { id: techSheetId },
        data: {
          pipeline_status: 'failed',
          pipeline_output: {
            ...pipelineOutput,
            error_step: failedStep,
            error_message: errorMessage,
          },
        },
      });
    }
  }

  /**
   * Resolve the real filesystem path from a file_url.
   * file_url is typically "/api/files/{id}/download" — we extract the file ID,
   * look up the FileUpload record, and return its file_path (absolute on disk).
   */
  private async resolveFilePath(fileUrl: string): Promise<string> {
    // Extract file ID from URL pattern: /api/files/{id}/download
    const match = fileUrl.match(/\/api\/files\/([^/]+)\/download/);
    if (!match) {
      throw new BadRequestException(
        `Cannot resolve filesystem path from file_url: ${fileUrl}`,
      );
    }

    const fileId = match[1];
    const fileUpload = await this.prisma.fileUpload.findUnique({
      where: { id: fileId },
    });

    if (!fileUpload) {
      throw new BadRequestException(
        `FileUpload record not found for file_url: ${fileUrl}`,
      );
    }

    return fileUpload.file_path;
  }

  private async updateStatus(id: number, status: string): Promise<void> {
    await this.prisma.techSheet.update({
      where: { id },
      data: { pipeline_status: status },
    });
  }

  private async updateOutput(id: number, output: Record<string, any>): Promise<void> {
    await this.prisma.techSheet.update({
      where: { id },
      data: { pipeline_output: output },
    });
  }

  private getFailedStep(output: Record<string, any>): number {
    if (!output.step_1_markdown) return 1;
    if (!output.step_2_validation) return 2;
    if (!output.step_3_competencies) return 3;
    if (!output.step_4_kpis) return 4;
    if (!output.step_5_questions) return 5;
    if (!output.step_6_simulation_prompt) return 6;
    if (!output.step_7_evaluation_prompt) return 7;
    if (!output.step_8_coaching_prompt) return 8;
    return 0;
  }

  private getValidationPrompt(markdown: string): string {
    return `Analiza el siguiente documento educativo y determina si es una ficha técnica o plan de estudios válido del Ministerio de Educación de Argentina.

Documento:
${markdown}

Responde SOLAMENTE con una de las siguientes opciones:
1. "VALIDADO: [breve explicación de por qué es válido]"
2. "RECHAZADO: [breve explicación de por qué no es válido]"

Un documento es válido si contiene:
- Título o nombre del curso/plan de estudios
- Competencias profesionales o habilidades
- Criterios de evaluación o indicadores de logro
- Estructura clara con secciones definidas`;
  }

  private getCompetencyPrompt(markdown: string): string {
    return `Extrae las competencias profesionales del siguiente documento educativo.

Documento:
${markdown}

Retorna un JSON con el siguiente formato exacto:
{
  "competencias": [
    {
      "nombre": "Nombre de la competencia",
      "descripcion": "Descripción breve",
      "categoria": "tecnica|transversal",
      "nivel": "basico|intermedio|avanzado"
    }
  ]
}

Solo incluye competencias que estén explícitamente mencionadas o claramente inferidas del documento.`;
  }

  private getKpiPrompt(markdown: string): string {
    return `Extrae los indicadores clave de rendimiento (KPIs) y criterios de evaluación del siguiente documento educativo.

Documento:
${markdown}

Retorna un JSON con el siguiente formato exacto:
{
  "kpis": [
    {
      "nombre": "Nombre del KPI",
      "descripcion": "Descripción del indicador",
      "categoria": "evaluacion|desempeño|asistencia|participacion",
      "valor_objetivo": "valor numérico o porcentaje",
      "criterio_aprobacion": "criterio mínimo para aprobar"
    }
  ]
}

Incluye todos los criterios de evaluación, exámenes, prácticas y requisitos de aprobación mencionados.`;
  }

  private getQuestionPrompt(markdown: string, competencies: string): string {
    return `Basándote en las competencias extraídas y el documento original, genera preguntas de evaluación.

Competencias extraídas:
${competencies}

Documento original:
${markdown}

Genera 5-10 preguntas de evaluación que cubran las competencias identificadas.

Retorna un JSON con el siguiente formato exacto:
{
  "preguntas": [
    {
      "texto": "Texto de la pregunta",
      "tipo": "multiple_choice|abierta|verdadero_falso",
      "competencia_asociada": "Nombre de la competencia que evalúa",
      "dificultad": "basica|intermedia|avanzada",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"]
    }
  ]
}

Para preguntas de opción múltiple, incluye 4 opciones. Para preguntas abiertas, deja opciones vacía.`;
  }

  private getSimulationPrompt(
    markdown: string,
    competencies: string,
    kpis: string,
  ): string {
    return `Crea un prompt para un escenario de simulación empresarial basado en el documento educativo y las competencias/kpis extraídos.

Competencias:
${competencies}

KPIs:
${kpis}

Documento original:
${markdown}

Crea un escenario de simulación donde el estudiante deba aplicar las competencias profesionales en un contexto empresarial real.

El prompt debe incluir:
1. Contexto de la empresa y situación
2. Rol del estudiante
3. Objetivos del escenario
4. Situaciones o desafíos a enfrentar
5. Criterios de éxito basados en los KPIs

    Retorna el prompt como texto estructurado en español.`;
  }

  private getEvaluationAIPrompt(markdown: string, competencies: string, kpis: string): string {
    return `Crea un prompt de evaluación para un simulador educativo basado en el siguiente documento, competencias y KPIs.

Documento original:
${markdown}

Competencias extraídas:
${competencies}

KPIs extraídos:
${kpis}

El prompt de evaluación debe:
1. Explicar cómo evaluar cada competencia durante la simulación
2. Describir qué buscar en las respuestas del estudiante para cada KPI
3. Definir criterios de puntuación (1-10) alineados con las metas y mínimos de cada KPI
4. Especificar cuándo una respuesta es "correcta", "parcial" o "incorrecta"
5. Incluir instrucciones para calcular la nota final ponderada por los pesos de cada KPI

Retorna SOLO el texto del prompt de evaluación, sin markdown ni explicaciones adicionales.`;
  }

  private getCoachingAIPrompt(markdown: string, competencies: string, kpis: string, evaluationPrompt: string): string {
    return `Crea un prompt de coaching/tutoría para un simulador educativo basado en el siguiente contexto.

Documento original:
${markdown}

Competencias extraídas:
${competencies}

KPIs extraídos:
${kpis}

Prompt de evaluación (para referencia):
${evaluationPrompt}

El prompt de coaching debe:
1. Definir el tono pedagógico: alentador, constructivo, paciente
2. Especificar cuándo intervenir: si el estudiante se desvía, pide ayuda, o comete errores
3. Dar pautas para guiar sin dar respuestas directas (método socrático)
4. Incluir frases de ejemplo para corrección constructiva
5. Adaptar el nivel de ayuda según la dificultad de cada competencia (básico/intermedio/avanzado)

Retorna SOLO el texto del prompt de coaching, sin markdown ni explicaciones adicionales.`;
  }
}