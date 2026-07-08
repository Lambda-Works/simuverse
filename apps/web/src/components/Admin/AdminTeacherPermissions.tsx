'use client'
/**
 * AdminTeacherPermissions.tsx
 * 
 * Admin panel component for controlling what data teachers can see
 * Allows admin to toggle teacher access to AI configuration
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/ApiClient';
import './AdminTeacherPermissions.css';

interface TeacherPermissions {
  can_see_ai_config?: boolean;
  can_see_system_prompt?: boolean;
  can_see_temperature?: boolean;
  can_see_score_calculation?: boolean;
  description?: string;
}

export function AdminTeacherPermissions() {
  const [permissions, setPermissions] = useState<TeacherPermissions>({
    can_see_ai_config: false,
    can_see_system_prompt: false,
    can_see_temperature: false,
    can_see_score_calculation: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/teacher-permissions');
      
      const data = response.data;
      setPermissions(data.data || {});
      setMessage(null);
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar los permisos de profesor',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof TeacherPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/admin/teacher-permissions', {
        can_see_ai_config: permissions.can_see_ai_config,
        can_see_system_prompt: permissions.can_see_system_prompt,
        can_see_temperature: permissions.can_see_temperature,
        can_see_score_calculation: permissions.can_see_score_calculation,
      });

      setMessage({
        type: 'success',
        text: '✅ Permisos de profesor actualizados correctamente',
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error saving permissions:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar los permisos. Intenta de nuevo.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-teacher-permissions loading">
        <div className="spinner"></div>
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="admin-teacher-permissions">
      <div className="header">
        <h2>👨‍🏫 Permisos para Profesores</h2>
        <p className="subtitle">
          Controla qué datos de IA pueden ver los profesores cuando revisan simulaciones
        </p>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="permissions-section">
        <h3>⚙️ Configuración de Acceso</h3>

        <div className="permission-item">
          <label className="permission-label">
            <input
              type="checkbox"
              checked={permissions.can_see_system_prompt ?? false}
              onChange={() => handleToggle('can_see_system_prompt')}
              disabled={saving}
            />
            <span className="checkbox-label">
              Pueden ver systemPrompt de la IA
            </span>
          </label>
          <p className="permission-description">
            Si está habilitado, los profesores verán la instrucción completa que recibe la IA, 
            como "Eres un auditor técnico..." y el rol asignado.
          </p>
        </div>

        <div className="permission-item">
          <label className="permission-label">
            <input
              type="checkbox"
              checked={permissions.can_see_temperature ?? false}
              onChange={() => handleToggle('can_see_temperature')}
              disabled={saving}
            />
            <span className="checkbox-label">
              Pueden ver parámetros de IA (temperature, top_p)
            </span>
          </label>
          <p className="permission-description">
            Si está habilitado, los profesores verán los parámetros técnicos como:
            <br />• temperature: 0.7 (controla creatividad)
            <br />• top_p: 0.9 (controla precisión)
            <br />• max_tokens: 2000 (longitud de respuesta)
          </p>
        </div>

        <div className="permission-item">
          <label className="permission-label">
            <input
              type="checkbox"
              checked={permissions.can_see_score_calculation ?? false}
              onChange={() => handleToggle('can_see_score_calculation')}
              disabled={saving}
            />
            <span className="checkbox-label">
              Pueden ver detalles del cálculo de puntuación
            </span>
          </label>
          <p className="permission-description">
            Si está habilitado, los profesores verán cómo se calculó la nota, como:
            <br />• Pregunta 1: 8/10
            <br />• Pregunta 2: 9/10
            <br />• Bonificación por creatividad: +2
          </p>
        </div>

        <div className="permission-item">
          <label className="permission-label">
            <input
              type="checkbox"
              checked={permissions.can_see_ai_config ?? false}
              onChange={() => handleToggle('can_see_ai_config')}
              disabled={saving}
            />
            <span className="checkbox-label">
              Pueden ver TODA la configuración de IA
            </span>
          </label>
          <p className="permission-description">
            Si está habilitado, combina TODAS las opciones anteriores:
            <br />✓ systemPrompt completo
            <br />✓ Parámetros (temperature, top_p, etc)
            <br />✓ Personality traits
            <br />✓ Detalles de cálculo de puntuación
          </p>
        </div>
      </div>

      <div className="security-warning">
        <h3>⚠️ Nota de Seguridad</h3>
        <p>
          Los profesores <strong>NUNCA</strong> verán:
        </p>
        <ul>
          <li>❌ Credenciales de estudiantes (passwords, emails privados)</li>
          <li>❌ Logs técnicos internos del sistema</li>
          <li>❌ Guiding questions internas de la IA</li>
          <li>❌ Datos de otros estudiantes</li>
          <li>❌ Información administrativa del sistema</li>
        </ul>
      </div>

      <div className="actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn btn-primary ${saving ? 'loading' : ''}`}
        >
          {saving ? '⏳ Guardando...' : '✅ Guardar Cambios'}
        </button>
        <button
          onClick={loadPermissions}
          disabled={saving}
          className="btn btn-secondary"
        >
          🔄 Recargar
        </button>
      </div>

      <div className="current-state">
        <h3>📊 Estado Actual</h3>
        <div className="state-display">
          <p>
            Profesores pueden ver admin_data: <strong>
              {(permissions.can_see_ai_config ||
                permissions.can_see_system_prompt ||
                permissions.can_see_temperature ||
                permissions.can_see_score_calculation)
                ? '✅ SÍ'
                : '❌ NO'}
            </strong>
          </p>
          {(permissions.can_see_ai_config ||
            permissions.can_see_system_prompt ||
            permissions.can_see_temperature ||
            permissions.can_see_score_calculation) && (
            <p className="enabled-features">
              Características habilitadas:{' '}
              {[
                permissions.can_see_system_prompt && 'systemPrompt',
                permissions.can_see_temperature && 'parámetros',
                permissions.can_see_score_calculation && 'cálculo de nota',
                permissions.can_see_ai_config && 'configuración completa',
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="info-box">
        <h3>ℹ️ Cómo Funciona</h3>
        <ol>
          <li>
            <strong>Admin habilita permisos:</strong> Marca qué datos pueden ver los profesores
          </li>
          <li>
            <strong>Profesor inicia sesión:</strong> Ve automáticamente los datos permitidos
          </li>
          <li>
            <strong>Próximas simulaciones:</strong> El cambio se aplica inmediatamente a nuevas consultas
          </li>
          <li>
            <strong>Seguridad:</strong> El filtrado ocurre en el backend, nunca en el cliente
          </li>
        </ol>
      </div>
    </div>
  );
}
