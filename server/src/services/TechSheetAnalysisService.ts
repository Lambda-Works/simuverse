import { AppDataSource } from '../database/connection';
import { TechSheet } from '../entities/TechSheet';
import { CourseConfig } from '../entities/CourseConfig';
import { Task } from '../entities/Task';
import { KPI } from '../entities/KPI';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface Competency {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

export interface KPIConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  target_value: number;
  minimum_pass_value: number;
  competencies_required: string[];
  evaluation_questions: string[];
}

export interface TaskConfig {
  id: string;
  kpi_id: string;
  type: 'practice' | 'evaluation';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sequence: number;
  expected_duration_minutes: number;
}

export interface AnalyzedKPIsConfig {
  tech_sheet_id: number;
  analyzed_at: Date;
  competencies: Competency[];
  kpis: KPIConfig[];
  tasks: TaskConfig[];
  prompts: {
    system_prompt: string;
    evaluation_prompt: string;
    coaching_prompt: string;
  };
}

export class TechSheetAnalysisService {
  /**
   * Analiza una ficha técnica y guarda la configuración en course_config
   * Extrae competencias y KPIs del contenido REAL (file_url, description)
   * NO usa datos hardcodeados
   */
  async analyzeAndSave(
    sheet: TechSheet,
    courseId: string
  ): Promise<AnalyzedKPIsConfig> {
    try {
      // 1. Obtener contenido real del archivo
      const contentToAnalyze = await this.readTechSheetContent(sheet);
      
      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        console.error('❌ No hay contenido para analizar');
        throw new Error('El documento no tiene contenido válido para analizar');
      }

      console.log(`📄 Contenido a analizar (${contentToAnalyze.length} caracteres)`);
      
      // 2. Llamar a Gemini para análisis inteligente
      const { competencies, kpis } = await this.analyzeWithGemini(contentToAnalyze, sheet.name);

      console.log(`✅ Gemini extrajo: ${competencies.length} competencias, ${kpis.length} KPIs`);

      // 3. Crear tareas para cada KPI
      const tasks = await this.createTasksForKPIs(
        courseId,
        kpis,
        sheet.name
      );

      // 4. Crear la configuración analizada
      const analyzedConfig: AnalyzedKPIsConfig = {
        tech_sheet_id: sheet.id,
        analyzed_at: new Date(),
        competencies,
        kpis: kpis.map((kpi) => ({
          ...kpi,
          related_tasks: tasks
            .filter((t) => t.kpi_id === kpi.id)
            .map((t) => t.id),
        })) as KPIConfig[],
        tasks,
        prompts: {
          system_prompt: this.generateSystemPrompt(sheet, kpis),
          evaluation_prompt: this.generateEvaluationPrompt(kpis),
          coaching_prompt: this.generateCoachingPrompt(sheet),
        },
      };

      // 5. Guardar en course_config.metadata
      try {
        const existingConfig = await AppDataSource.query(
          `SELECT id FROM course_config WHERE course_id = ?`,
          [courseId]
        );

        const metadata = JSON.stringify({
          analyzed_kpis_config: analyzedConfig
        });

        if (existingConfig.length > 0) {
          const configId = existingConfig[0].id;
          await AppDataSource.query(
            `UPDATE course_config SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.analyzed_kpis_config', CAST(? AS JSON)) WHERE id = ?`,
            [JSON.stringify(analyzedConfig), configId]
          );
          console.log(`✅ Metadata actualizada para config ${configId}`);
        } else {
          const id = uuidv4();
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          await AppDataSource.query(
            `INSERT INTO course_config (id, course_id, config_data, metadata, prompt_generation_mode, tech_sheet_id, created_at, updated_at) 
             VALUES (?, ?, ?, ?, 'template', ?, ?, ?)`,
            [
              id, 
              courseId, 
              JSON.stringify({}), 
              JSON.stringify({ analyzed_kpis_config: analyzedConfig }),
              sheet.id,
              now,
              now
            ]
          );
          console.log(`✅ Nueva config creada: ${id}`);
        }
      } catch (err: any) {
        console.error('⚠️ Error guardando config:', err.message);
      }

      return analyzedConfig;
    } catch (err: any) {
      console.error('❌ Error en analyzeAndSave:', err.message);
      throw err;
    }
  }

  /**
   * Lee el contenido real del archivo de la ficha técnica
   * Soporta: TXT, DOCX, DOC, PDF, CSV, PNG
   */
  private async readTechSheetContent(sheet: TechSheet): Promise<string> {
    let content = '';

    // Si tiene file_url con ruta relativa, leer del disco
    if (sheet.file_url && !sheet.file_url.startsWith('data:')) {
      try {
        // El archivo está en server/uploads/tech-sheets/
        // file_url es: "tech-sheets/uuid.ext"
        // process.cwd() es: /home/gaspi/.../simuverse-engine/server
        const filePath = path.join(process.cwd(), 'uploads', sheet.file_url);
        console.log(`📂 Intentando leer archivo de: ${filePath}`);
        
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          
          // Extraer contenido según el tipo de archivo
          if (ext === '.txt' || ext === '.csv') {
            // Archivos de texto plano
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            content += fileContent;
            console.log(`✅ Archivo TXT/CSV leído (${fileContent.length} caracteres)`);
          } 
          else if (ext === '.docx') {
            // Archivo DOCX con mammoth
            try {
              const buffer = fs.readFileSync(filePath);
              const result = await mammoth.extractRawText({ buffer });
              content += result.value;
              console.log(`✅ Archivo DOCX leído (${result.value.length} caracteres)`);
            } catch (docxError: any) {
              console.warn(`⚠️ Error extrayendo DOCX: ${docxError.message}`);
              // Fallback: leer como binario y buscar texto visible
              const buffer = fs.readFileSync(filePath);
              const textContent = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
              content += textContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
            }
          }
          else if (ext === '.pdf') {
            // Archivo PDF con pdf-parse
            try {
              const buffer = fs.readFileSync(filePath);
              const data = await (pdfParse as any)(buffer);
              content += data.text;
              console.log(`✅ Archivo PDF leído (${data.text.length} caracteres)`);
            } catch (pdfError: any) {
              console.warn(`⚠️ Error extrayendo PDF: ${pdfError.message}`);
            }
          }
          else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            // Para imágenes, solo registramos que no podemos extraer texto
            console.warn(`⚠️ Archivo de imagen - no se puede extraer texto: ${ext}`);
            content += `[Archivo de imagen: ${path.basename(filePath)}]`;
          }
          else {
            // Otros formatos - intentar leer como texto
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            content += fileContent;
            console.log(`✅ Archivo ${ext} leído como texto (${fileContent.length} caracteres)`);
          }
        } else {
          console.warn(`⚠️ Archivo no encontrado: ${filePath}`);
        }
      } catch (e: any) {
        console.warn(`⚠️ Error leyendo archivo: ${e.message}`);
      }
    }

    // Agregar descripción si existe
    if (sheet.description) {
      content += '\n\n--- DESCRIPCIÓN ADICIONAL ---\n' + sheet.description;
    }

    console.log(`📄 Contenido total a analizar: ${content.length} caracteres`);
    return content;
  }

  /**
   * Llama a Google Gemini para analizar el contenido
   */
  private async analyzeWithGemini(
    content: string,
    sheetName: string
  ): Promise<{ competencies: Competency[]; kpis: KPIConfig[] }> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'tu_gemini_api_key_aqui') {
      console.warn('⚠️ GEMINI_API_KEY no está configurada. Usando análisis básico.');
      return this.extractCompetenciesAndKPIsBasic(content);
    }

    try {
      const prompt = `Analiza este documento de capacitación/ficha técnica y extrae la información en JSON.

DOCUMENTO:
${content.substring(0, 8000)}

${content.length > 8000 ? '\n[... documento truncado ...]' : ''}

Responde SOLO con JSON válido:
{
  "competencies": [
    {
      "id": "comp-1",
      "name": "Nombre",
      "description": "Descripción",
      "level": "basic|intermediate|advanced"
    }
  ],
  "kpis": [
    {
      "id": "kpi-1",
      "name": "Nombre del KPI",
      "description": "Descripción",
      "category": "knowledge|skill|performance",
      "weight": 100,
      "target_value": 95,
      "minimum_pass_value": 70,
      "competencies_required": ["comp-1"],
      "evaluation_questions": ["Pregunta?"]
    }
  ]
}`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ Error de Gemini: ${response.status}`);
        return this.extractCompetenciesAndKPIsBasic(content);
      }

      const data: any = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('❌ Respuesta vacía de Gemini');
        return this.extractCompetenciesAndKPIsBasic(content);
      }

      const responseText = data.candidates[0].content.parts[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('❌ No se encontró JSON en la respuesta');
        return this.extractCompetenciesAndKPIsBasic(content);
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      const competencies: Competency[] = (parsedData.competencies || []).map((c: any, idx: number) => ({
        id: c.id || `comp-${idx + 1}`,
        name: c.name || `Competencia ${idx + 1}`,
        description: c.description || '',
        level: (c.level as any) || 'intermediate'
      }));

      const kpis: KPIConfig[] = (parsedData.kpis || []).map((k: any, idx: number) => ({
        id: k.id || `kpi-${idx + 1}`,
        name: k.name || `KPI ${idx + 1}`,
        description: k.description || '',
        category: k.category || 'performance',
        weight: k.weight || 100,
        target_value: k.target_value || 95,
        minimum_pass_value: k.minimum_pass_value || 70,
        competencies_required: k.competencies_required || [],
        evaluation_questions: k.evaluation_questions || [`¿Se logró ${k.name}?`]
      }));

      console.log(`✅ Análisis exitoso: ${competencies.length} competencias, ${kpis.length} KPIs`);
      return { competencies, kpis };
    } catch (err: any) {
      console.error(`❌ Error con Gemini: ${err.message}`);
      return this.extractCompetenciesAndKPIsBasic(content);
    }
  }

  /**
   * Fallback: análisis básico sin IA
   */
  private extractCompetenciesAndKPIsBasic(content: string): { competencies: Competency[]; kpis: KPIConfig[] } {
    console.log('🔄 Usando análisis estructural local (sin API)...');
    
    // Análisis inteligente basado en estructura del documento
    const competencies = this.extractCompetenciesFromStructure(content);
    const objectives = this.extractObjectivesFromStructure(content);
    const modules = this.extractModulesFromStructure(content);
    
    // Crear KPIs basados en objetivos y módulos
    const kpis = this.createKPIsFromObjectivesAndModules(objectives, modules, competencies);
    
    console.log(`📊 Análisis local: ${competencies.length} competencias, ${kpis.length} KPIs`);
    return { competencies, kpis };
  }

  /**
   * Extrae competencias buscando secciones específicas del documento
   */
  private extractCompetenciesFromStructure(content: string): Competency[] {
    const competencies: Competency[] = [];
    const lowerContent = content.toLowerCase();

    // Patrones a buscar en el documento
    const patterns = [
      { keyword: 'competencia', level: 'intermediate' as const, baseName: 'Competencia' },
      { keyword: 'habilidad', level: 'intermediate' as const, baseName: 'Habilidad' },
      { keyword: 'destreza', level: 'intermediate' as const, baseName: 'Destreza' },
      { keyword: 'capacidad', level: 'intermediate' as const, baseName: 'Capacidad' },
      { keyword: 'conocimiento', level: 'basic' as const, baseName: 'Conocimiento' },
      { keyword: 'liderazgo', level: 'advanced' as const, baseName: 'Liderazgo' },
      { keyword: 'análisis', level: 'intermediate' as const, baseName: 'Análisis crítico' },
      { keyword: 'comunicación', level: 'intermediate' as const, baseName: 'Comunicación efectiva' },
      { keyword: 'resolución', level: 'advanced' as const, baseName: 'Resolución de problemas' },
    ];

    const foundCompetencies: { [key: string]: Competency } = {};

    // Buscar patrones en el contenido
    patterns.forEach((pattern, idx) => {
      if (lowerContent.includes(pattern.keyword)) {
        const key = pattern.baseName.toLowerCase();
        if (!foundCompetencies[key]) {
          foundCompetencies[key] = {
            id: `comp-${Object.keys(foundCompetencies).length + 1}`,
            name: pattern.baseName,
            description: `Competencia identificada en el documento: ${pattern.baseName}`,
            level: pattern.level,
          };
        }
      }
    });

    // Buscar competencias específicas mencionadas explícitamente
    const competencySection = this.extractSection(content, 'competencia', 200);
    if (competencySection) {
      const lines = competencySection.split('\n').filter(l => l.trim().length > 5);
      lines.slice(0, 3).forEach((line, idx) => {
        const key = line.toLowerCase().substring(0, 30);
        if (!foundCompetencies[key] && Object.keys(foundCompetencies).length < 5) {
          foundCompetencies[key] = {
            id: `comp-${Object.keys(foundCompetencies).length + 1}`,
            name: line.trim().substring(0, 50),
            description: line.trim(),
            level: 'intermediate',
          };
        }
      });
    }

    return Object.values(foundCompetencies).slice(0, 6);
  }

  /**
   * Extrae objetivos de aprendizaje del documento
   */
  private extractObjectivesFromStructure(content: string): string[] {
    const objectives: string[] = [];

    // Buscar sección de objetivos
    const objectiveSection = this.extractSection(content, 'objetivo', 500);
    if (objectiveSection) {
      const lines = objectiveSection
        .split('\n')
        .filter(l => l.trim().length > 10 && !l.includes('•') && !l.includes('-'));
      
      lines.forEach(line => {
        const cleaned = line.replace(/^[\d.•\-\*]\s*/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          objectives.push(cleaned);
        }
      });
    }

    // Si no encontró, buscar patrones "Diseñar", "Implementar", "Comprender"
    const verbPatterns = ['diseñar', 'implementar', 'comprender', 'desarrollar', 'aplicar', 'crear', 'analizar'];
    const contentLower = content.toLowerCase();
    
    verbPatterns.forEach(verb => {
      const regex = new RegExp(`${verb}[^.]*\\.`, 'gi');
      const matches = content.match(regex);
      if (matches && objectives.length < 5) {
        matches.slice(0, 2).forEach(match => {
          objectives.push(match.trim());
        });
      }
    });

    return objectives.slice(0, 5);
  }

  /**
   * Extrae módulos o temas del documento
   */
  private extractModulesFromStructure(content: string): string[] {
    const modules: string[] = [];

    // Buscar sección de módulos
    const moduleSection = this.extractSection(content, 'módulo', 800);
    if (moduleSection) {
      const lines = moduleSection.split('\n');
      lines.forEach(line => {
        const match = line.match(/módulo\s+([ivxlcdm]+|[0-9]+)[:\s]+([^/]+)/i);
        if (match && match[2]) {
          modules.push(match[2].trim().substring(0, 100));
        }
      });
    }

    // Buscar "Eje temático"
    const ejeSection = this.extractSection(content, 'eje temático', 500);
    if (ejeSection && modules.length === 0) {
      const lines = ejeSection.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length > 10 && trimmed.length < 150) {
          modules.push(trimmed);
        }
      });
    }

    return modules.slice(0, 5);
  }

  /**
   * Crea KPIs basados en objetivos y módulos
   */
  private createKPIsFromObjectivesAndModules(
    objectives: string[],
    modules: string[],
    competencies: Competency[]
  ): KPIConfig[] {
    const kpis: KPIConfig[] = [];
    let kpiIdx = 1;

    // Crear KPI de cada objetivo
    objectives.forEach((obj, idx) => {
      if (kpiIdx <= 4) {
        kpis.push({
          id: `kpi-${kpiIdx}`,
          name: obj.substring(0, 60),
          description: obj.substring(0, 200),
          category: this.categorizeKPI(obj),
          weight: 100 / Math.max(1, objectives.length),
          target_value: 95,
          minimum_pass_value: 70,
          competencies_required: competencies.map(c => c.id).slice(0, 2),
          evaluation_questions: [
            `¿Se logró: "${obj.substring(0, 50)}"?`,
            `¿Cuál fue el nivel de cumplimiento?`,
            `¿Qué evidencia demuestra este logro?`,
          ]
        });
        kpiIdx++;
      }
    });

    // Crear KPI de cada módulo
    modules.forEach((mod, idx) => {
      if (kpiIdx <= 6) {
        kpis.push({
          id: `kpi-${kpiIdx}`,
          name: `Dominar: ${mod.substring(0, 40)}`,
          description: `Adquisición de competencias en: ${mod.substring(0, 150)}`,
          category: 'skill',
          weight: 100 / Math.max(1, modules.length),
          target_value: 90,
          minimum_pass_value: 70,
          competencies_required: competencies.map(c => c.id).slice(0, 2),
          evaluation_questions: [
            `¿Puede aplicar los conceptos de ${mod.substring(0, 30)}?`,
            `¿Demuestra habilidad en ${mod.substring(0, 30)}?`,
          ]
        });
        kpiIdx++;
      }
    });

    // Si no hay ni objetivos ni módulos, crear KPI genérico mejorado
    if (kpis.length === 0) {
      kpis.push({
        id: 'kpi-1',
        name: 'Desempeño General de la Capacitación',
        description: 'Evaluación integral del logro de las competencias propuestas en la capacitación',
        category: 'performance',
        weight: 100,
        target_value: 95,
        minimum_pass_value: 70,
        competencies_required: competencies.map(c => c.id),
        evaluation_questions: [
          '¿Se lograron los objetivos de aprendizaje?',
          '¿Demuestra las competencias requeridas?',
          '¿Puede aplicar lo aprendido en contextos reales?',
        ]
      });
    }

    return kpis;
  }

  /**
   * Busca una sección del documento por palabra clave
   */
  private extractSection(content: string, keyword: string, maxLength: number = 500): string {
    const lowerContent = content.toLowerCase();
    const keywordIndex = lowerContent.indexOf(keyword);
    
    if (keywordIndex === -1) return '';

    // Encontrar el siguiente salto de línea o punto después de la palabra clave
    const startIndex = keywordIndex;
    let endIndex = keywordIndex + maxLength;

    // Buscar un límite natural (próximo títul o sección)
    const nextKeywordIndex = lowerContent.indexOf('\n\n', startIndex);
    if (nextKeywordIndex > 0 && nextKeywordIndex < endIndex) {
      endIndex = nextKeywordIndex;
    }

    return content.substring(startIndex, Math.min(endIndex, content.length));
  }

  /**
   * Categoriza un KPI basado en su descripción
   */
  private categorizeKPI(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.includes('conocimiento') || lower.includes('comprender') || lower.includes('entender')) {
      return 'knowledge';
    }
    if (lower.includes('habilidad') || lower.includes('destreza') || lower.includes('aplicar')) {
      return 'skill';
    }
    if (lower.includes('actitud') || lower.includes('comportamiento') || lower.includes('ética')) {
      return 'attitude';
    }
    return 'performance';
  }

  /**
   * Extrae competencias del CONTENIDO REAL de la ficha técnica
   * Analiza texto del archivo/descripción usando palabras clave inteligentes
   */
  private extractCompetencies(
    contentText: string
  ): Competency[] {
    const competencies: Competency[] = [];
    const processedKeywords = new Set<string>();

    // Palabras clave de competencias comunes en fichas técnicas ministeriales
    const competencyKeywords = {
      'gestión': { name: 'Gestión de operaciones', level: 'intermediate' as const },
      'administración': { name: 'Administración de recursos', level: 'intermediate' as const },
      'análisis': { name: 'Análisis crítico', level: 'intermediate' as const },
      'comunicación': { name: 'Comunicación efectiva', level: 'intermediate' as const },
      'liderazgo': { name: 'Liderazgo', level: 'advanced' as const },
      'resolución': { name: 'Resolución de problemas', level: 'intermediate' as const },
      'toma de decisiones': { name: 'Toma de decisiones', level: 'advanced' as const },
      'planificación': { name: 'Planificación estratégica', level: 'advanced' as const },
      'evaluación': { name: 'Evaluación de desempeño', level: 'intermediate' as const },
      'cliente': { name: 'Atención al cliente', level: 'basic' as const },
      'negociación': { name: 'Negociación', level: 'intermediate' as const },
      'trabajo en equipo': { name: 'Trabajo en equipo', level: 'basic' as const },
      'ética': { name: 'Ética profesional', level: 'basic' as const },
      'calidad': { name: 'Aseguramiento de calidad', level: 'intermediate' as const },
    };

    const textLower = contentText.toLowerCase();
    let compIdx = 1;

    // Buscar palabras clave en el contenido
    for (const [keyword, info] of Object.entries(competencyKeywords)) {
      if (textLower.includes(keyword) && !processedKeywords.has(keyword)) {
        competencies.push({
          id: `comp-${compIdx++}`,
          name: info.name,
          description: `Competencia extraída del contenido: ${info.name}`,
          level: info.level,
        });
        processedKeywords.add(keyword);
      }
    }

    // Si no encontró nada, retornar una competencia genérica
    return competencies.length > 0 ? competencies : [
      {
        id: 'comp-1',
        name: 'Competencia General',
        description: 'Competencia extraída de la ficha técnica',
        level: 'intermediate',
      },
    ];
  }

  /**
   * Extrae KPIs del CONTENIDO REAL de la ficha técnica
   * Analiza texto del archivo/descripción buscando criterios de evaluación
   */
  private extractKPIs(
    contentText: string,
    competencies: Competency[]
  ): KPIConfig[] {
    const kpis: KPIConfig[] = [];
    const textLower = contentText.toLowerCase();

    // Palabras clave para identificar KPIs en el contenido
    const kpiKeywords = ['kpi', 'criterio', 'objetivo', 'meta', 'desempeño', 'resultado', 'evaluación', 'cumplimiento', 'porcentaje', '%', 'minutos', 'horas'];
    
    // Buscar líneas que contengan estas palabras (generalmente los KPIs están en párrafos específicos)
    const lines = contentText.split('\n').filter(line => line.trim().length > 0);
    let kpiIdx = 1;

    for (const line of lines) {
      const lineLower = line.toLowerCase();
      // Detectar si es una línea de KPI
      if (kpiKeywords.some(kw => lineLower.includes(kw))) {
        if (kpis.length < 10) { // Limitar a 10 KPIs máximo
          kpis.push({
            id: `kpi-${kpiIdx++}`,
            name: line.substring(0, 100), // Primeros 100 caracteres como nombre
            description: line,
            category: this.detectKPICategory(lineLower),
            weight: 100 / Math.max(1, kpiIdx),
            target_value: 95,
            minimum_pass_value: 70,
            competencies_required: competencies.slice(0, Math.max(1, competencies.length)).map(c => c.id),
            evaluation_questions: [
              `¿Se logró el objetivo: "${line.substring(0, 50)}"?`,
              `¿Cuál fue el nivel de cumplimiento de este criterio?`,
            ],
          });
        }
      }
    }

    // Si no encontró KPIs en el contenido, crear uno genérico
    return kpis.length > 0 ? kpis : [
      {
        id: 'kpi-1',
        name: 'Desempeño General',
        description: 'KPI general para evaluar el desempeño en la ficha técnica',
        category: 'performance',
        weight: 100,
        target_value: 95,
        minimum_pass_value: 70,
        competencies_required: competencies.map(c => c.id),
        evaluation_questions: [
          '¿Logró completar correctamente los requisitos de la ficha?',
          '¿Cumplió con los estándares especificados?',
        ],
      },
    ];
  }

  /**
   * Detecta la categoría de un KPI basado en palabras clave
   */
  private detectKPICategory(lineLower: string): string {
    if (lineLower.includes('cliente') || lineLower.includes('satisfacción')) return 'customer_satisfaction';
    if (lineLower.includes('tiempo') || lineLower.includes('minutos') || lineLower.includes('horas')) return 'time';
    if (lineLower.includes('calidad') || lineLower.includes('porcentaje') || lineLower.includes('%')) return 'quality';
    if (lineLower.includes('costo') || lineLower.includes('precio') || lineLower.includes('dinero')) return 'cost';
    return 'performance';
  }

  /**
   * Crea tareas automáticamente para cada KPI
   * ⚠️ IMPORTANTE: También persiste KPIs en la tabla kpis
   */
  private async createTasksForKPIs(
    courseId: string,
    kpis: KPIConfig[],
    techSheetName: string
  ): Promise<TaskConfig[]> {
    const tasks: TaskConfig[] = [];
    const kpiRepo = AppDataSource.getRepository(KPI);
    const taskRepo = AppDataSource.getRepository(Task);

    console.log(`[KPI_CREATION] Iniciando creación de ${kpis.length} KPIs para curso ${courseId}`);

    for (const kpiConfig of kpis) {
      try {
        // ✅ NUEVO: Crear KPI real en BD
        const kpiEntity = new KPI();
        kpiEntity.id = uuidv4();
        kpiEntity.course_id = courseId;
        kpiEntity.name = kpiConfig.name;
        kpiEntity.description = kpiConfig.description;
        kpiEntity.category = kpiConfig.category as any;
        kpiEntity.weight = kpiConfig.weight;
        kpiEntity.target_value = kpiConfig.target_value;
        kpiEntity.minimum_pass_value = kpiConfig.minimum_pass_value;
        kpiEntity.is_active = true;
        kpiEntity.tasks_count = 2; // 1 práctica + 1 evaluación

        const savedKpi = await kpiRepo.save(kpiEntity);
        console.log(`✅ KPI creado: ${savedKpi.id} - ${savedKpi.name}`);

        // Crear 2 tareas: 1 práctica + 1 evaluación por KPI
        const taskDefs = [
          { type: 'practice' as const, seq: 1, suffix: 'Práctica' },
          { type: 'evaluation' as const, seq: 2, suffix: 'Evaluación' }
        ];

        for (const taskDef of taskDefs) {
          try {
            const taskEntity = new Task();
            taskEntity.id = uuidv4();
            taskEntity.course_id = courseId;
            taskEntity.kpi_id = savedKpi.id;
            // scenario_id es opcional
            taskEntity.title = `${kpiConfig.name} - ${taskDef.suffix}`;
            taskEntity.description = `${taskDef.type === 'practice' ? 'Practica el siguiente KPI' : 'Evaluación del KPI'}: ${kpiConfig.name}\n\nDescripción: ${kpiConfig.description}\n\nObjetivo: Alcanzar al menos ${kpiConfig[taskDef.type === 'practice' ? 'minimum_pass_value' : 'target_value']}% de desempeño.`;
            taskEntity.type = taskDef.type;
            taskEntity.sequence_order = taskDef.seq;
            taskEntity.ai_prompt_config = {
              system_prompt: `${taskDef.type === 'practice' ? 'Ayuda al estudiante a practicar' : 'Evalúa al estudiante en'}: ${kpiConfig.name}`,
              temperature: taskDef.type === 'practice' ? 0.7 : 0.3,
              give_hints: taskDef.type === 'practice',
              max_attempts: taskDef.type === 'practice' ? 3 : 1
            };
            taskEntity.evaluation_criteria = {
              accuracy_required: kpiConfig[taskDef.type === 'practice' ? 'minimum_pass_value' : 'target_value'],
              time_limit_minutes: taskDef.type === 'practice' ? 15 : 20,
              partial_credit_allowed: taskDef.type === 'practice',
              auto_evaluation_rules: []
            };
            taskEntity.status = 'pending';
            taskEntity.is_active = true;
            taskEntity.students_completed = 0;
            taskEntity.average_completion_rate = 0;

            const savedTask = await taskRepo.save(taskEntity);
            console.log(`  ✅ Task ${taskDef.type} creada: ${savedTask.id}`);

            tasks.push({
              id: savedTask.id,
              kpi_id: savedKpi.id,
              type: taskDef.type,
              title: taskEntity.title,
              description: taskEntity.description,
              difficulty: taskDef.type === 'practice' ? 'medium' : 'hard',
              sequence: taskDef.seq,
              expected_duration_minutes: taskDef.type === 'practice' ? 15 : 20,
            });
          } catch (taskErr: any) {
            console.error(`  ❌ Error creando task ${taskDef.type}:`, taskErr.message);
            console.error(`     Stack:`, taskErr.stack);
          }
        }
      } catch (kpiErr: any) {
        console.error(`❌ Error creando KPI ${kpiConfig.name}:`, kpiErr.message);
      }
    }

    console.log(`[KPI_CREATION] Completado: ${tasks.length} tasks creadas`);
    return tasks;
  }

  /**
   * Genera el system prompt para la IA
   */
  private generateSystemPrompt(sheet: TechSheet, kpis: KPIConfig[]): string {
    const kpisList = kpis
      .map((k) => `- ${k.name}: ${k.description}`)
      .join('\n');

    return `Eres un asistente educativo profesional especializado en simulaciones de situaciones laborales reales.

Tu rol es ayudar al estudiante a alcanzar estos KPIs (indicadores de desempeño):
${kpisList}

Instrucciones:
1. Evalúa cada respuesta del estudiante contra los KPIs
2. Si comete un error, explica educadamente sin ser condescendiente
3. Proporciona coaching para mejorar
4. Registra el progreso hacia cada KPI
5. Sé motivador pero exigente

Context de la simulación: ${sheet.description || 'N/A'}`;
  }

  /**
   * Genera el evaluation prompt
   */
  private generateEvaluationPrompt(kpis: KPIConfig[]): string {
    const criteria = kpis
      .map(
        (k) =>
          `- ${k.name} (mínimo ${k.minimum_pass_value}%, objetivo ${k.target_value}%)`
      )
      .join('\n');

    return `Evalúa al estudiante contra estos criterios:

${criteria}

Para cada criterio:
1. Asigna un porcentaje de logro (0-100%)
2. Proporciona feedback específico
3. Sugiere mejoras

Formato de respuesta JSON:
{
  "kpi_evaluations": [
    { "kpi_name": "...", "score": 85, "feedback": "..." }
  ],
  "overall_score": 87,
  "strengths": [...],
  "areas_to_improve": [...]
}`;
  }

  /**
   * Genera el coaching prompt
   */
  private generateCoachingPrompt(sheet: TechSheet): string {
    return `Si el estudiante no logra alcanzar los objetivos, proporciona coaching específico:

1. Identifica la raíz del problema
2. Proporciona 2-3 tips prácticos
3. Sugiere que intente de nuevo
4. Sé empático pero directo
5. Usa ejemplos del contexto: ${sheet.description || 'la simulación'}

Ejemplo de estructura:
"Veo que tuviste dificultad con [X]. Aquí está el problema: [explicación]. 
Intenta esto: [tip 1], [tip 2]. ¿Quieres intentar de nuevo?"`;
  }

  /**
   * Obtiene la configuración analizada de un course_config
   */
  async getAnalyzedConfig(courseId: string): Promise<AnalyzedKPIsConfig | null> {
    try {
      const result = await AppDataSource.query(
        `SELECT metadata FROM course_config WHERE course_id = ?`,
        [courseId]
      );

      if (!result || result.length === 0) {
        console.log(`❌ No config found for course ${courseId}`);
        return null;
      }

      const metadata = result[0].metadata;
      if (!metadata) {
        console.log(`❌ No metadata in config for course ${courseId}`);
        return null;
      }

      const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      return metadataObj.analyzed_kpis_config || null;
    } catch (err: any) {
      console.error('Error getting analyzed config:', err.message);
      return null;
    }
  }

  /**
   * Actualiza la configuración analizada
   */
  async updateAnalyzedConfig(
    courseId: string,
    updates: Partial<AnalyzedKPIsConfig>
  ): Promise<AnalyzedKPIsConfig> {
    try {
      // Primero obtener la configuración actual
      const current = await this.getAnalyzedConfig(courseId);
      if (!current) {
        throw new Error('CourseConfig not found');
      }

      // Fusionar con los updates
      const updated: AnalyzedKPIsConfig = {
        ...current,
        ...updates,
        analyzed_at: current.analyzed_at || new Date(),
      };

      // Usar SQL raw para actualizar
      const configQuery = await AppDataSource.query(
        `SELECT id FROM course_config WHERE course_id = ?`,
        [courseId]
      );

      if (configQuery.length === 0) {
        throw new Error('CourseConfig not found');
      }

      const configId = configQuery[0].id;
      await AppDataSource.query(
        `UPDATE course_config SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.analyzed_kpis_config', CAST(? AS JSON)) WHERE id = ?`,
        [JSON.stringify(updated), configId]
      );

      console.log(`✅ Config actualizada para ${configId}`);
      return updated;
    } catch (err: any) {
      console.error('Error updating analyzed config:', err.message);
      throw err;
    }
  }
}
