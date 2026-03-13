import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfflineCache } from '../entities/offline/OfflineCache.entity';
import { ChatResponseCache } from '../entities/offline/ChatResponseCache.entity';
import { EvaluationCache } from '../entities/offline/EvaluationCache.entity';
import { OfflineSession } from '../entities/offline/OfflineSession.entity';
import { Course } from '../entities/Course';
import { Scenario } from '../entities/Scenario';
import { KPI } from '../entities/KPI';
import * as crypto from 'crypto';
import * as zlib from 'zlib';

/**
 * OfflineCacheService
 * 
 * Maneja todo lo relacionado con offline mode:
 * 1. Pre-caching de datos cuando hay conexión
 * 2. Sincronización cuando regresa conexión
 * 3. Generación de hash para detectar cambios
 * 4. Gestión de sesiones offline
 * 
 * Flujo típico:
 * 1. admin.startOfflineCaching(courseId) → genera caches
 * 2. student.openSimulation() → carga datos del cache
 * 3. student.goOffline() → usa datos locales
 * 4. student.goOnline() → sincroniza con servidor
 */
@Injectable()
export class OfflineCacheService {
  constructor(
    @InjectRepository(OfflineCache)
    private offlineCacheRepo: Repository<OfflineCache>,

    @InjectRepository(ChatResponseCache)
    private chatCacheRepo: Repository<ChatResponseCache>,

    @InjectRepository(EvaluationCache)
    private evaluationCacheRepo: Repository<EvaluationCache>,

    @InjectRepository(OfflineSession)
    private sessionRepo: Repository<OfflineSession>,

    @InjectRepository(Course)
    private courseRepo: Repository<Course>,

    @InjectRepository(Scenario)
    private scenarioRepo: Repository<Scenario>,

    @InjectRepository(KPI)
    private kpiRepo: Repository<KPI>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // CACHE GENERATION
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Genera cache completo para un curso
   * Llamado por admin cuando quiere preparar offline mode
   * 
   * @param courseId - ID del curso
   * @returns Info sobre qué fue cacheado
   */
  async generateFullCourseCache(courseId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['scenarios', 'kpis', 'course_config'],
    });

    if (!course) throw new Error('Course not found');

    // Preparar datos del curso
    const courseData = {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      scenarios: course.scenarios,
      kpis: course.kpis,
      course_config: course.course_config,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        itemCount: course.scenarios.length + course.kpis.length,
      },
    };

    // Comprimir datos
    const jsonData = JSON.stringify(courseData);
    const compressed = await this.compressData(jsonData);
    const dataHash = this.hashData(jsonData);

    // Guardar en BD
    const cache = this.offlineCacheRepo.create({
      course_id: courseId,
      cache_type: 'full_course',
      cache_data: jsonData, // Guardar descomprimido para queries
      data_hash: dataHash,
      size_bytes: Buffer.byteLength(jsonData),
      is_ready_offline: true,
      last_synced: new Date(),
      metadata: {
        itemCount: courseData.metadata.itemCount,
        lastModified: new Date().toISOString(),
        compressionRatio: compressed.length / Buffer.byteLength(jsonData),
      },
    });

    await this.offlineCacheRepo.save(cache);

    return {
      cacheId: cache.id,
      courseId,
      dataSize: cache.size_bytes,
      itemsCount: courseData.metadata.itemCount,
      readyForOffline: true,
      message: `Curso ${course.title} cacheado para offline`,
    };
  }

  /**
   * Cachea solo escenarios de un curso
   */
  async cacheScenarios(courseId: string) {
    const scenarios = await this.scenarioRepo.find({
      where: { course_id: courseId },
    });

    const jsonData = JSON.stringify(scenarios);
    const dataHash = this.hashData(jsonData);

    const cache = this.offlineCacheRepo.create({
      course_id: courseId,
      cache_type: 'scenarios',
      cache_data: jsonData,
      data_hash: dataHash,
      size_bytes: Buffer.byteLength(jsonData),
      is_ready_offline: true,
      last_synced: new Date(),
    });

    await this.offlineCacheRepo.save(cache);
    return cache;
  }

  /**
   * Cachea solo KPIs de un curso
   */
  async cacheKPIs(courseId: string) {
    const kpis = await this.kpiRepo.find({
      where: { course_id: courseId },
    });

    const jsonData = JSON.stringify(kpis);
    const dataHash = this.hashData(jsonData);

    const cache = this.offlineCacheRepo.create({
      course_id: courseId,
      cache_type: 'kpis',
      cache_data: jsonData,
      data_hash: dataHash,
      size_bytes: Buffer.byteLength(jsonData),
      is_ready_offline: true,
      last_synced: new Date(),
    });

    await this.offlineCacheRepo.save(cache);
    return cache;
  }

  // ─────────────────────────────────────────────────────────────────────
  // CACHE RETRIEVAL
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Obtiene cache para un curso (mejor resultado, o null)
   */
  async getCourseCache(courseId: string, cacheType: string = 'full_course') {
    return await this.offlineCacheRepo.findOne({
      where: {
        course_id: courseId,
        cache_type: cacheType as any,
        is_ready_offline: true,
      },
      order: { last_synced: 'DESC' },
    });
  }

  /**
   * Verifica si existe cache válido
   */
  async hasCacheForCourse(courseId: string): Promise<boolean> {
    const cache = await this.offlineCacheRepo.findOne({
      where: {
        course_id: courseId,
        is_ready_offline: true,
      },
    });
    return !!cache;
  }

  /**
   * Obtiene tamaño total de cache para un curso
   */
  async getCacheSizeForCourse(courseId: string): Promise<number> {
    const caches = await this.offlineCacheRepo.find({
      where: { course_id: courseId },
    });
    return caches.reduce((sum, c) => sum + c.size_bytes, 0);
  }

  // ─────────────────────────────────────────────────────────────────────
  // CHAT RESPONSE CACHE
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Cachea una respuesta de chat pre-generada
   * Llamado por ChatService cuando genera respuestas con IA
   */
  async cacheChatResponse(
    scenarioId: string,
    familyType: string,
    question: string,
    response: string,
    tokensUsed?: number,
  ) {
    const questionHash = this.hashData(question);

    const cachedResponse = this.chatCacheRepo.create({
      scenario_id: scenarioId,
      family_type: familyType,
      question,
      question_hash: questionHash,
      category: this.extractCategory(question),
      response,
      tokens_used: tokensUsed,
      model: 'gemini-1.5-flash',
      relevance_score: 100,
      metadata: {
        generatedAt: new Date().toISOString(),
        temperature: 0.7,
      },
    });

    await this.chatCacheRepo.save(cachedResponse);
    return cachedResponse;
  }

  /**
   * Busca respuesta cacheada para una pregunta
   * Si no existe, retorna null (cae a fallback)
   */
  async findCachedResponse(
    scenarioId: string,
    question: string,
  ): Promise<ChatResponseCache | null> {
    // Intenta búsqueda exacta primero
    let response = await this.chatCacheRepo.findOne({
      where: {
        scenario_id: scenarioId,
        question_hash: this.hashData(question),
      },
    });

    if (response) {
      // Actualizar stats
      response.usage_count++;
      response.last_used = new Date();
      await this.chatCacheRepo.save(response);
      return response;
    }

    // Si no hay exacta, buscar por similaridad de categoría
    const category = this.extractCategory(question);
    response = await this.chatCacheRepo.findOne({
      where: {
        scenario_id: scenarioId,
        category,
      },
      order: { relevance_score: 'DESC' },
    });

    if (response) {
      response.usage_count++;
      response.last_used = new Date();
      await this.chatCacheRepo.save(response);
    }

    return response || null;
  }

  /**
   * Obtiene todas las respuestas cacheadas para un escenario
   */
  async getScenarioChatCache(scenarioId: string) {
    return await this.chatCacheRepo.find({
      where: { scenario_id: scenarioId },
      order: { usage_count: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // EVALUATION CACHE
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Cachea rúbrica de evaluación
   */
  async cacheEvaluationRubric(
    kpiId: string,
    scenarioId: string,
    rubricDefinition: Record<string, any>,
    checklist: string[],
  ) {
    const evaluation = this.evaluationCacheRepo.create({
      kpi_id: kpiId,
      scenario_id: scenarioId,
      evaluation_type: 'rubric',
      rubric_definition: JSON.stringify(rubricDefinition),
      checklist_items: JSON.stringify(checklist),
      is_validated: false,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
      },
    });

    await this.evaluationCacheRepo.save(evaluation);
    return evaluation;
  }

  /**
   * Obtiene rúbrica cacheada para evaluación offline
   */
  async getEvaluationRubric(
    kpiId: string,
    scenarioId: string,
  ): Promise<EvaluationCache | null> {
    return await this.evaluationCacheRepo.findOne({
      where: {
        kpi_id: kpiId,
        scenario_id: scenarioId,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // OFFLINE SESSIONS
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Crea nueva sesión offline
   * Llamado cuando estudiante se desconecta
   */
  async createOfflineSession(
    simulationInstanceId: string,
    scenarioId: string,
  ) {
    const session = this.sessionRepo.create({
      simulation_instance_id: simulationInstanceId,
      scenario_id: scenarioId,
      started_at: new Date(),
      status: 'active',
      session_data: JSON.stringify({}),
      action_log: JSON.stringify([]),
    });

    await this.sessionRepo.save(session);
    return session;
  }

  /**
   * Actualiza sesión offline con nuevos datos
   */
  async updateOfflineSession(
    sessionId: string,
    actionLog: Record<string, any>[],
    sessionData: Record<string, any>,
  ) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');

    session.action_log = JSON.stringify(actionLog);
    session.session_data = JSON.stringify(sessionData);
    session.data_size_bytes = Buffer.byteLength(session.session_data);
    session.updated_at = new Date();

    await this.sessionRepo.save(session);
    return session;
  }

  /**
   * Completa sincronización de sesión
   */
  async completeOfflineSync(
    sessionId: string,
    syncResult: Record<string, any>,
  ) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');

    session.status = 'synced';
    session.reconnected_at = new Date();
    session.synced_at = new Date();
    session.sync_result = syncResult;
    session.offline_duration_seconds = Math.floor(
      (session.reconnected_at.getTime() - session.disconnected_at!.getTime()) / 1000,
    );

    await this.sessionRepo.save(session);
    return session;
  }

  /**
   * Obtiene sesiones pendientes de sincronizar
   */
  async getPendingSessions() {
    return await this.sessionRepo.find({
      where: { status: 'syncing' },
      order: { disconnected_at: 'ASC' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Genera hash SHA256 de un string
   */
  private hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Comprime datos con gzip
   */
  private compressData(data: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  /**
   * Extrae categoría de una pregunta
   */
  private extractCategory(question: string): string {
    const q = question.toLowerCase();

    if (/(salario|sueldo|pago|nómina|remuneración)/.test(q))
      return 'salarios';
    if (/(contrato|empleo|trabajo|despido|término)/.test(q))
      return 'contratos';
    if (/(procedimiento|proceso|pasos|cómo)/.test(q))
      return 'procedimiento';
    if (/(normativa|ley|regulación|legal)/.test(q))
      return 'normativa';
    if (/(crisis|urgente|problema|error|falla)/.test(q))
      return 'problemas';

    return 'general';
  }

  /**
   * Limpia caches antiguos (> 30 días)
   */
  async cleanupOldCache() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.offlineCacheRepo.delete({
      last_synced: { $lt: thirtyDaysAgo } as any,
    });

    await this.chatCacheRepo.delete({
      created_at: { $lt: thirtyDaysAgo } as any,
    });
  }

  /**
   * Obtiene estadísticas de cache
   */
  async getCacheStats(courseId: string) {
    const caches = await this.offlineCacheRepo.find({
      where: { course_id: courseId },
    });

    const chatCaches = await this.chatCacheRepo.find({
      where: { scenario: { course_id: courseId } },
    });

    const evaluationCaches = await this.evaluationCacheRepo.find({
      where: { kpi: { course_id: courseId } },
    });

    const totalSize = caches.reduce((sum, c) => sum + c.size_bytes, 0);

    return {
      courseId,
      totalSize,
      cacheCount: caches.length,
      chatResponsesCount: chatCaches.length,
      evaluationCachesCount: evaluationCaches.length,
      lastUpdate: caches[0]?.updated_at || null,
      isReadyForOffline: caches.some((c) => c.is_ready_offline),
    };
  }
}
