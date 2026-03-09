import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenarioConfig } from '../entities/ScenarioConfig.entity';
import { CourseConfig } from '../entities/CourseConfig.entity';
import { Scenario } from '../entities/Scenario.entity';
import { Course } from '../entities/Course.entity';

/**
 * ScenarioConfigService
 * 
 * ⭐ SOLUCIONA GAP CRÍTICO IDENTIFICADO ⭐
 * 
 * Problema detectado:
 * - Todos los escenarios usan config global del curso
 * - No se puede personalizar IA, crisis, módulos por escenario
 * - Limita flexibilidad de simulaciones
 * 
 * Solución:
 * - ScenarioConfig permite override por escenario
 * - Herencia automática de CourseConfig para campos no definidos
 * - Transparente para el resto del sistema
 * 
 * Ejemplo de uso:
 * 
 * // Obtener config efectiva (con herencia)
 * const config = await this.getEffectiveConfig(scenarioId);
 * // Si ScenarioConfig.ia_config existe → la usa
 * // Si no → hereda de CourseConfig.ia_config
 * 
 * // Personalizar un escenario específico
 * await this.setScenarioIAConfig(scenarioId, {
 *   systemPrompt: "Eres cliente enojado",
 *   temperature: 0.9
 * });
 * // Solo este escenario usa esta config
 * // Otros escenarios del curso usan CourseConfig global
 */
@Injectable()
export class ScenarioConfigService {
  constructor(
    @InjectRepository(ScenarioConfig)
    private scenarioConfigRepo: Repository<ScenarioConfig>,

    @InjectRepository(CourseConfig)
    private courseConfigRepo: Repository<CourseConfig>,

    @InjectRepository(Scenario)
    private scenarioRepo: Repository<Scenario>,

    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // GET EFFECTIVE CONFIG (Con herencia)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Obtiene configuración efectiva de un escenario
   * Patrón de herencia: si está definido en escenario lo usa, si no hereda de curso
   * 
   * Ejemplo:
   * ```
   * const config = await service.getEffectiveConfig("scenario_123");
   * // {
   * //   ia_config: { systemPrompt: "Eres cliente..." }, // de scenario
   * //   crisis_events: null, // hereda del curso
   * //   modules: [ ... ] // hereda del curso
   * // }
   * ```
   */
  async getEffectiveConfig(scenarioId: string) {
    const scenario = await this.scenarioRepo.findOne({
      where: { id: scenarioId },
      relations: ['config', 'course', 'course.course_config'],
    });

    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const courseConfig = scenario.course.course_config;
    const scenarioConfig = scenario.config;

    // Patrón de herencia: scenario override + course default
    return {
      // IA Config
      ia_config: scenarioConfig?.ia_config ?? courseConfig?.ia_config,

      // Crisis Events
      crisis_events: scenarioConfig?.crisis_events ?? scenario.course.crisis_events,

      // Modules
      scenario_modules: scenarioConfig?.scenario_modules ?? courseConfig?.active_modules,

      // Inbox Config
      inbox_config: scenarioConfig?.inbox_config ?? courseConfig?.inbox_config,

      // Calculator Config
      calculator_config:
        scenarioConfig?.calculator_config ?? courseConfig?.calculator_config,

      // UI Config
      ui_config: scenarioConfig?.ui_config ?? courseConfig?.ui_config,

      // Documents Config
      documents_config:
        scenarioConfig?.documents_config ?? courseConfig?.documents_config,

      // Constraints (solo scenario)
      constraints: scenarioConfig?.constraints,

      // Metadata
      source: {
        hasScenarioOverride: !!scenarioConfig,
        courseId: scenario.course_id,
        scenarioId,
      },
    };
  }

  /**
   * Obtiene solo IA config efectiva
   */
  async getEffectiveIAConfig(scenarioId: string) {
    const scenario = await this.scenarioRepo.findOne({
      where: { id: scenarioId },
      relations: ['config', 'course', 'course.course_config'],
    });

    if (!scenario) throw new Error('Scenario not found');

    return scenario.config?.ia_config ?? scenario.course.course_config?.ia_config ?? {
      systemPrompt: `Eres un especialista en ${scenario.course.category}`,
      temperature: 0.7,
    };
  }

  /**
   * Obtiene solo crisis events efectivos
   */
  async getEffectiveCrisisEvents(scenarioId: string) {
    const scenario = await this.scenarioRepo.findOne({
      where: { id: scenarioId },
      relations: ['config', 'course'],
    });

    if (!scenario) throw new Error('Scenario not found');

    return scenario.config?.crisis_events ?? scenario.course.crisis_events ?? [];
  }

  /**
   * Obtiene solo módulos efectivos
   */
  async getEffectiveModules(scenarioId: string) {
    const scenario = await this.scenarioRepo.findOne({
      where: { id: scenarioId },
      relations: ['config', 'course', 'course.course_config'],
    });

    if (!scenario) throw new Error('Scenario not found');

    return (
      scenario.config?.scenario_modules ?? scenario.course.course_config?.active_modules ?? []
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // CREATE / UPDATE SCENARIO CONFIG
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Crea nueva configuración de escenario
   * 
   * Ejemplo:
   * ```
   * await service.createScenarioConfig(scenarioId, {
   *   ia_config: {
   *     systemPrompt: "Eres cliente muy exigente",
   *     temperature: 0.9
   *   },
   *   crisis_events: [
   *     {
   *       id: "crisis_1",
   *       name: "Cliente reclama",
   *       trigger: "salary_mentioned",
   *       probability: 0.9
   *     }
   *   ]
   * });
   * ```
   */
  async createScenarioConfig(
    scenarioId: string,
    configData: Partial<ScenarioConfig>,
  ) {
    const scenario = await this.scenarioRepo.findOne({
      where: { id: scenarioId },
      relations: ['course'],
    });

    if (!scenario) throw new Error('Scenario not found');

    // Verificar que no ya existe
    const existing = await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
    });

    if (existing) {
      throw new Error('ScenarioConfig already exists for this scenario');
    }

    const config = this.scenarioConfigRepo.create({
      scenario_id: scenarioId,
      course_id: scenario.course_id,
      ...configData,
      is_active: true,
      version: 1,
      created_by: configData.created_by || 'system',
    });

    return await this.scenarioConfigRepo.save(config);
  }

  /**
   * Actualiza configuración de escenario
   */
  async updateScenarioConfig(
    scenarioId: string,
    updates: Partial<ScenarioConfig>,
  ) {
    const config = await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
    });

    if (!config) {
      throw new Error('ScenarioConfig not found');
    }

    // Actualizar solo campos permitidos
    if (updates.ia_config !== undefined) config.ia_config = updates.ia_config;
    if (updates.crisis_events !== undefined) config.crisis_events = updates.crisis_events;
    if (updates.scenario_modules !== undefined) config.scenario_modules = updates.scenario_modules;
    if (updates.inbox_config !== undefined) config.inbox_config = updates.inbox_config;
    if (updates.calculator_config !== undefined)
      config.calculator_config = updates.calculator_config;
    if (updates.ui_config !== undefined) config.ui_config = updates.ui_config;
    if (updates.documents_config !== undefined)
      config.documents_config = updates.documents_config;
    if (updates.constraints !== undefined) config.constraints = updates.constraints;

    config.version++;
    config.updated_at = new Date();

    return await this.scenarioConfigRepo.save(config);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SET SPECIFIC CONFIGS (Métodos de conveniencia)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Establece IA config específica para escenario
   */
  async setScenarioIAConfig(
    scenarioId: string,
    iaConfig: Record<string, any>,
  ) {
    let config = await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
    });

    if (!config) {
      config = await this.createScenarioConfig(scenarioId, { ia_config: iaConfig });
    } else {
      await this.updateScenarioConfig(scenarioId, { ia_config: iaConfig });
    }

    return config;
  }

  /**
   * Establece crisis events específicos
   */
  async setScenarioCrisisEvents(
    scenarioId: string,
    crisisEvents: Array<Record<string, any>>,
  ) {
    let config = await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
    });

    if (!config) {
      config = await this.createScenarioConfig(scenarioId, { crisis_events: crisisEvents });
    } else {
      await this.updateScenarioConfig(scenarioId, { crisis_events: crisisEvents });
    }

    return config;
  }

  /**
   * Establece módulos activos para escenario
   */
  async setScenarioModules(
    scenarioId: string,
    modules: Array<Record<string, any>>,
  ) {
    let config = await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
    });

    if (!config) {
      config = await this.createScenarioConfig(scenarioId, { scenario_modules: modules });
    } else {
      await this.updateScenarioConfig(scenarioId, { scenario_modules: modules });
    }

    return config;
  }

  /**
   * Establece constraints (para fallback offline)
   */
  async setScenarioConstraints(
    scenarioId: string,
    constraints: string[],
  ) {
    let config = await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
    });

    if (!config) {
      config = await this.createScenarioConfig(scenarioId, { constraints });
    } else {
      await this.updateScenarioConfig(scenarioId, { constraints });
    }

    return config;
  }

  // ─────────────────────────────────────────────────────────────────────
  // DELETE / RESET
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Elimina configuración de escenario
   * (vuelve a heredar todo del curso)
   */
  async deleteScenarioConfig(scenarioId: string) {
    const config = await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
    });

    if (!config) {
      throw new Error('ScenarioConfig not found');
    }

    await this.scenarioConfigRepo.remove(config);

    return {
      message: 'ScenarioConfig deleted. Scenario now inherits from course config.',
      scenarioId,
    };
  }

  /**
   * Reseta un campo específico a herencia
   */
  async resetField(scenarioId: string, field: string) {
    const config = await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
    });

    if (!config) throw new Error('ScenarioConfig not found');

    const allowedFields = [
      'ia_config',
      'crisis_events',
      'scenario_modules',
      'inbox_config',
      'calculator_config',
      'ui_config',
      'documents_config',
      'constraints',
    ];

    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid field: ${field}`);
    }

    config[field] = null;
    config.version++;
    config.updated_at = new Date();

    await this.scenarioConfigRepo.save(config);

    return {
      message: `Field ${field} reset to inheritance`,
      scenarioId,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // GET INFO
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Obtiene configuración de escenario (sin herencia)
   */
  async getScenarioConfig(scenarioId: string) {
    return await this.scenarioConfigRepo.findOne({
      where: { scenario_id: scenarioId },
      relations: ['scenario', 'course'],
    });
  }

  /**
   * Obtiene todas las configuraciones de un curso
   */
  async getCourseScenarioConfigs(courseId: string) {
    return await this.scenarioConfigRepo.find({
      where: { course_id: courseId, is_active: true },
      relations: ['scenario'],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Obtiene info de qué está override vs. heredado
   */
  async getConfigOverrideInfo(scenarioId: string) {
    const scenario = await this.scenarioRepo.findOne({
      where: { id: scenarioId },
      relations: ['config', 'course', 'course.course_config'],
    });

    if (!scenario) throw new Error('Scenario not found');

    const config = scenario.config;

    return {
      scenarioId,
      courseId: scenario.course_id,
      hasOverride: !!config,
      overriddenFields: {
        ia_config: !!config?.ia_config,
        crisis_events: !!config?.crisis_events,
        modules: !!config?.scenario_modules,
        inbox: !!config?.inbox_config,
        calculator: !!config?.calculator_config,
        ui: !!config?.ui_config,
        documents: !!config?.documents_config,
        constraints: !!config?.constraints,
      },
      inheritedFields: {
        ia_config: !config?.ia_config,
        crisis_events: !config?.crisis_events,
        modules: !config?.scenario_modules,
        inbox: !config?.inbox_config,
        calculator: !config?.calculator_config,
        ui: !config?.ui_config,
        documents: !config?.documents_config,
      },
    };
  }

  /**
   * Obtiene estadísticas de configuración de un curso
   */
  async getCourseConfigStats(courseId: string) {
    const totalScenarios = await this.scenarioRepo.count({
      where: { course_id: courseId },
    });

    const withConfig = await this.scenarioConfigRepo.count({
      where: { course_id: courseId },
    });

    const configs = await this.scenarioConfigRepo.find({
      where: { course_id: courseId },
    });

    const overrideSummary = {
      ia_config: configs.filter((c) => !!c.ia_config).length,
      crisis_events: configs.filter((c) => !!c.crisis_events).length,
      modules: configs.filter((c) => !!c.scenario_modules).length,
      inbox_config: configs.filter((c) => !!c.inbox_config).length,
      calculator_config: configs.filter((c) => !!c.calculator_config).length,
      ui_config: configs.filter((c) => !!c.ui_config).length,
      documents_config: configs.filter((c) => !!c.documents_config).length,
      constraints: configs.filter((c) => !!c.constraints).length,
    };

    return {
      courseId,
      totalScenarios,
      scenariosWithConfig: withConfig,
      scenariosUsingInheritance: totalScenarios - withConfig,
      percentageCustomized: ((withConfig / totalScenarios) * 100).toFixed(2) + '%',
      overrideSummary,
    };
  }
}
