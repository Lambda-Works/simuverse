import { AppDataSource } from '../database/connection';
import { CourseConfig, ModuleActivation, UIConfig, IAConfig } from '../entities/CourseConfig';
import { Course } from '../entities/Course';

export class ConfigService {
  private static configRepository = AppDataSource.getRepository(CourseConfig);
  private static courseRepository = AppDataSource.getRepository(Course);

  /**
   * Get or create course configuration
   * If config doesn't exist, creates default configuration based on course family
   */
  static async getOrCreateConfig(course_id: string): Promise<CourseConfig> {
    let config = await this.configRepository.findOne({
      where: { course_id: course_id as any },
    });

    if (!config) {
      const course = await this.courseRepository.findOne({ where: { id: course_id } });
      if (!course) {
        throw new Error(`Course ${course_id} not found`);
      }

      config = await this.createDefaultConfig(course_id, course.category);
    }

    return config;
  }

  /**
   * Create default configuration based on course family
   */
  static async createDefaultConfig(
    course_id: string,
    family_type: string
  ): Promise<CourseConfig> {
    const defaultConfigs: Record<string, Partial<CourseConfig>> = {
      administration: {
        active_modules: [
          { moduleId: 1, enabled: true, config: { type: 'calculator' } },
          { moduleId: 2, enabled: true, config: { type: 'document' } },
          { moduleId: 3, enabled: true, config: { type: 'inbox' } },
        ],
        ui_config: {
          layout: 'office',
          primaryColor: '#1a237e',
          secondaryColor: '#003366',
          theme: 'light',
        },
        ia_config: {
          enabled: true,
          provider: 'gemini',
          systemPrompt:
            'Actúa como un Auditor Técnico de la AFIP/ARCA. Tu objetivo es supervisar la carga de impuestos o sueldos del alumno. Sé riguroso y formal.',
        },
        family_type: 'administration',
      },
      rrhh: {
        active_modules: [
          { moduleId: 2, enabled: true, config: { type: 'document' } },
          { moduleId: 4, enabled: true, config: { type: 'chat' } },
        ],
        ui_config: {
          layout: 'office',
          primaryColor: '#1b5e20',
          secondaryColor: '#2e7d32',
          theme: 'light',
        },
        ia_config: {
          enabled: true,
          provider: 'gemini',
          systemPrompt:
            'Actúa como un empleado con 15 años de antigüedad que acaba de recibir una sanción injustificada. Tu tono es defensivo y emocional.',
        },
        family_type: 'rrhh',
      },
      it: {
        active_modules: [
          { moduleId: 1, enabled: false, config: {} },
          { moduleId: 2, enabled: true, config: { type: 'document' } },
          { moduleId: 4, enabled: true, config: { type: 'terminal' } },
        ],
        ui_config: {
          layout: 'terminal',
          primaryColor: '#001f3f',
          secondaryColor: '#0066cc',
          theme: 'dark',
        },
        ia_config: {
          enabled: true,
          provider: 'gemini',
          systemPrompt:
            'Actúa como un Tech Lead que supervisa una automatización de procesos. Eres extremadamente eficiente y solo hablas con datos.',
        },
        family_type: 'it',
      },
      entrepreneurship: {
        active_modules: [
          { moduleId: 1, enabled: false, config: {} },
          { moduleId: 2, enabled: true, config: { type: 'document' } },
          { moduleId: 3, enabled: true, config: { type: 'inbox' } },
          { moduleId: 4, enabled: true, config: { type: 'chat' } },
        ],
        ui_config: {
          layout: 'dashboard',
          primaryColor: '#ff6f00',
          secondaryColor: '#e65100',
          theme: 'light',
        },
        ia_config: {
          enabled: true,
          provider: 'gemini',
          systemPrompt:
            'Actúa como un cliente indignado que compró un producto y le llegó roto o fuera de plazo. Eres impaciente y amenazas con hacer una denuncia.',
        },
        family_type: 'entrepreneurship',
      },
    };

    const defaultConfig = defaultConfigs[family_type] || defaultConfigs.administration;

    const config = this.configRepository.create({
      course_id,
      ...defaultConfig,
    } as CourseConfig);

    return await this.configRepository.save(config);
  }

  /**
   * Update course configuration
   */
  static async updateConfig(course_id: string, updates: Partial<CourseConfig>): Promise<CourseConfig> {
    const config = await this.getOrCreateConfig(course_id);

    if (updates.active_modules) {
      config.active_modules = updates.active_modules;
    }
    if (updates.ui_config) {
      config.ui_config = { ...config.ui_config, ...updates.ui_config };
    }
    if (updates.ia_config) {
      config.ia_config = { ...config.ia_config, ...updates.ia_config };
    }
    if (updates.calculator_config) {
      config.calculator_config = updates.calculator_config;
    }
    if (updates.inbox_config) {
      config.inbox_config = updates.inbox_config;
    }

    return await this.configRepository.save(config);
  }

  /**
   * Get system prompt for a given course
   */
  static async getSystemPrompt(course_id: string): Promise<string> {
    const config = await this.getOrCreateConfig(course_id);
    return config.ia_config?.systemPrompt || '';
  }

  /**
   * Check if a module is active for a course
   */
  static async isModuleActive(course_id: string, moduleId: number): Promise<boolean> {
    const config = await this.getOrCreateConfig(course_id);
    const module = config.active_modules?.find((m) => m.moduleId === moduleId);
    return module?.enabled || false;
  }

  /**
   * Get active modules for a course
   */
  static async getActiveModules(course_id: string): Promise<ModuleActivation[]> {
    const config = await this.getOrCreateConfig(course_id);
    return config.active_modules?.filter((m) => m.enabled) || [];
  }

  /**
   * Get UI configuration for a course
   */
  static async getUIConfig(course_id: string): Promise<UIConfig> {
    const config = await this.getOrCreateConfig(course_id);
    return config.ui_config || {
      layout: 'office',
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      theme: 'light'
    };
  }

  /**
   * Export configuration as JSON (for backup/sharing)
   */
  static async exportConfig(course_id: string): Promise<Record<string, any>> {
    const config = await this.getOrCreateConfig(course_id);
    return {
      course_id,
      active_modules: config.active_modules,
      ui_config: config.ui_config,
      ia_config: config.ia_config,
      calculator_config: config.calculator_config,
      inbox_config: config.inbox_config,
      validation_rules: config.validation_rules,
      metadata: config.metadata,
    };
  }

  /**
   * Import configuration from JSON
   */
  static async importConfig(
    course_id: string,
    configData: Record<string, any>
  ): Promise<CourseConfig> {
    return this.updateConfig(course_id, configData as Partial<CourseConfig>);
  }
}
