import { AppDataSource } from '../database/connection';
import { PromptTemplate } from '../entities/PromptTemplate';
import { In } from 'typeorm';

export class PromptTemplateService {
  
  /**
   * Obtener todas las plantillas activas
   */
  async getAllTemplates(): Promise<PromptTemplate[]> {
    return AppDataSource.manager.find(PromptTemplate, {
      where: { is_active: true },
      order: { category: 'ASC', name: 'ASC' }
    });
  }

  /**
   * Obtener plantillas por categoría
   */
  async getTemplatesByCategory(category: string): Promise<PromptTemplate[]> {
    return AppDataSource.manager.find(PromptTemplate, {
      where: { category, is_active: true },
      order: { name: 'ASC' }
    });
  }

  /**
   * Obtener una plantilla por ID
   */
  async getTemplateById(id: number): Promise<PromptTemplate | null> {
    return AppDataSource.manager.findOne(PromptTemplate, {
      where: { id, is_active: true }
    });
  }

  /**
   * Crear nueva plantilla
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    category: string;
    base_role: string;
    course_context?: string;
    personality_traits?: string[];
    knowledge_base_prompt: string;
    created_by?: string;
  }): Promise<PromptTemplate> {
    const template = AppDataSource.manager.create(PromptTemplate, {
      ...data,
      is_active: true
    });
    return AppDataSource.manager.save(template);
  }

  /**
   * Actualizar plantilla
   */
  async updateTemplate(id: number, data: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const template = await AppDataSource.manager.findOne(PromptTemplate, { where: { id } });
    if (!template) throw new Error('Template not found');
    
    Object.assign(template, data);
    return AppDataSource.manager.save(template);
  }

  /**
   * Desactivar plantilla
   */
  async deactivateTemplate(id: number): Promise<void> {
    await AppDataSource.manager.update(PromptTemplate, { id }, { is_active: false });
  }

  /**
   * Duplicar plantilla con nuevo nombre
   */
  async duplicateTemplate(id: number, newName: string, userId?: string): Promise<PromptTemplate> {
    const original = await AppDataSource.manager.findOne(PromptTemplate, { where: { id } });
    if (!original) throw new Error('Template not found');

    const newTemplate = AppDataSource.manager.create(PromptTemplate, {
      name: newName,
      description: original.description,
      category: original.category,
      base_role: original.base_role,
      course_context: original.course_context,
      personality_traits: original.personality_traits,
      knowledge_base_prompt: original.knowledge_base_prompt,
      created_by: userId,
      is_active: true
    });

    return AppDataSource.manager.save(newTemplate);
  }
}
