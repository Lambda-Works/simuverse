/**
 * AdminSettingsService.ts
 * 
 * Service for managing administrator settings
 * Specifically handles teacher permissions to view AI configuration data
 * 
 * Features:
 * - Get current teacher permissions
 * - Update teacher permissions
 * - Determine if teachers can see admin_data
 */

import { DatabaseConnection } from '../database/connection';

export interface TeacherPermissions {
  can_see_ai_config?: boolean;
  can_see_system_prompt?: boolean;
  can_see_temperature?: boolean;
  can_see_score_calculation?: boolean;
  description?: string;
}

export class AdminSettingsService {
  private static readonly SETTING_KEY = 'teacher_permissions';

  /**
   * Get current teacher permissions from database
   * 
   * @returns TeacherPermissions object with current settings
   */
  static async getTeacherPermissions(): Promise<TeacherPermissions> {
    try {
      const db = DatabaseConnection.getInstance();
      
      const query = `
        SELECT setting_value 
        FROM admin_settings 
        WHERE setting_key = ?
        LIMIT 1
      `;

      const [results]: any[] = await db.query(query, [this.SETTING_KEY]);

      if (!results || results.length === 0) {
        // Return defaults if not found
        return this.getDefaultPermissions();
      }

      const settingValue = results[0].setting_value;
      
      // Parse JSON if it's a string, otherwise return as-is
      if (typeof settingValue === 'string') {
        return JSON.parse(settingValue);
      }
      
      return settingValue as TeacherPermissions;
    } catch (error) {
      console.error('❌ Error getting teacher permissions:', error);
      return this.getDefaultPermissions();
    }
  }

  /**
   * Update teacher permissions in database
   * 
   * @param permissions - New permissions to set
   * @returns Updated TeacherPermissions
   */
  static async updateTeacherPermissions(
    permissions: TeacherPermissions
  ): Promise<TeacherPermissions> {
    try {
      const db = DatabaseConnection.getInstance();

      // Merge with current permissions to preserve any fields not provided
      const currentPerms = await this.getTeacherPermissions();
      const updatedPerms = {
        ...currentPerms,
        ...permissions,
      };

      const query = `
        INSERT INTO admin_settings (setting_key, setting_value, updated_at)
        VALUES (?, JSON_OBJECT(
          'can_see_ai_config', ?,
          'can_see_system_prompt', ?,
          'can_see_temperature', ?,
          'can_see_score_calculation', ?,
          'description', ?
        ), NOW())
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          updated_at = NOW()
      `;

      const values = [
        this.SETTING_KEY,
        updatedPerms.can_see_ai_config ?? false,
        updatedPerms.can_see_system_prompt ?? false,
        updatedPerms.can_see_temperature ?? false,
        updatedPerms.can_see_score_calculation ?? false,
        updatedPerms.description ?? 'Controls which AI configuration data teachers can see',
      ];

      await db.query(query, values);

      console.log('✅ Teacher permissions updated');
      return updatedPerms;
    } catch (error) {
      console.error('❌ Error updating teacher permissions:', error);
      throw new Error('Failed to update teacher permissions');
    }
  }

  /**
   * Determine if teachers should see admin_data
   * Returns true if ANY permission is enabled
   * 
   * @returns boolean - True if teacher can see admin_data
   */
  static async shouldTeacherSeeAdminData(): Promise<boolean> {
    try {
      const perms = await this.getTeacherPermissions();
      
      // If any permission is true, teacher sees admin_data
      return (
        perms.can_see_ai_config === true ||
        perms.can_see_system_prompt === true ||
        perms.can_see_temperature === true ||
        perms.can_see_score_calculation === true
      );
    } catch (error) {
      console.error('❌ Error checking teacher access:', error);
      return false; // Default to false for security
    }
  }

  /**
   * Get specific permission value
   * 
   * @param permissionKey - Key of the permission to check
   * @returns boolean value of the permission
   */
  static async hasPermission(permissionKey: keyof TeacherPermissions): Promise<boolean> {
    try {
      const perms = await this.getTeacherPermissions();
      return perms[permissionKey] === true;
    } catch (error) {
      console.error(`❌ Error checking permission ${String(permissionKey)}:`, error);
      return false;
    }
  }

  /**
   * Get default permissions (all disabled)
   * 
   * @returns Default TeacherPermissions
   */
  private static getDefaultPermissions(): TeacherPermissions {
    return {
      can_see_ai_config: false,
      can_see_system_prompt: false,
      can_see_temperature: false,
      can_see_score_calculation: false,
      description: 'Controls which AI configuration data teachers can see',
    };
  }

  /**
   * Log current state (for debugging)
   */
  static async logCurrentState(): Promise<void> {
    try {
      const perms = await this.getTeacherPermissions();
      const shouldSee = await this.shouldTeacherSeeAdminData();
      
      console.log('📊 Current Teacher Permissions:');
      console.log(`   can_see_ai_config: ${perms.can_see_ai_config}`);
      console.log(`   can_see_system_prompt: ${perms.can_see_system_prompt}`);
      console.log(`   can_see_temperature: ${perms.can_see_temperature}`);
      console.log(`   can_see_score_calculation: ${perms.can_see_score_calculation}`);
      console.log(`   Overall access to admin_data: ${shouldSee}`);
    } catch (error) {
      console.error('❌ Error logging state:', error);
    }
  }
}
