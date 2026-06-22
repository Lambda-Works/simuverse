'use client'
import React, { useState, useEffect } from 'react';
import { msmApi } from '../services/MSMApiClient';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart3,
  Settings,
  Users,
  FileText,
  Loader,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Download,
} from 'lucide-react';

interface CourseFamily {
  id: number;
  name: string;
  description: string;
  icon: string;
  configJson: Record<string, any>;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'logs' | 'settings'>(
    'dashboard'
  );
  const [families, setFamilies] = useState<CourseFamily[]>([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<CourseFamily | null>(null);
  const [editingConfig, setEditingConfig] = useState<string>('');

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [familiesData, logsData, statsData] = await Promise.all([
          // Get families with config
          Promise.resolve([
            {
              id: 1,
              name: 'Administración Pública',
              description: 'Simulación de procesos administrativos',
              icon: '📋',
              configJson: {
                layout: 'office',
                modules: ['calculator', 'document', 'inbox', 'chat'],
              },
            },
            {
              id: 2,
              name: 'Recursos Humanos',
              description: 'Gestión de nómina y beneficios',
              icon: '👥',
              configJson: {
                layout: 'office',
                modules: ['calculator', 'document', 'inbox', 'chat'],
              },
            },
            {
              id: 3,
              name: 'Tecnología',
              description: 'Infraestructura y seguridad',
              icon: '💻',
              configJson: {
                layout: 'terminal',
                modules: ['calculator', 'document', 'chat'],
              },
            },
            {
              id: 4,
              name: 'Emprendimiento',
              description: 'Creación y gestión de negocios',
              icon: '🚀',
              configJson: {
                layout: 'dashboard',
                modules: ['calculator', 'document', 'inbox', 'chat'],
              },
            },
          ]),
          // Get logs (mock)
          Promise.resolve([
            {
              id: 1,
              user: 'Juan García',
              action: 'calculation',
              details: 'Cálculo de pensión completado',
              timestamp: new Date(Date.now() - 3600000),
            },
            {
              id: 2,
              user: 'María López',
              action: 'document_upload',
              details: 'Contrato de trabajo cargado',
              timestamp: new Date(Date.now() - 7200000),
            },
          ]),
          // Get stats
          Promise.resolve({
            totalStudents: 150,
            completedSimulations: 87,
            averageCompletion: '85%',
            activeUsers: 23,
          }),
        ]);

        setFamilies(familiesData);
        setLogs(logsData);
        setStats(statsData);
        setError(null);
      } catch (err) {
        setError('Error al cargar el dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleSaveConfig = async (familyId: number) => {
    try {
      // Update config via API
      console.log('Saving config for family:', familyId, editingConfig);
      setSelectedFamily(null);
      setEditingConfig('');
    } catch (err) {
      setError('Error al guardar configuración');
    }
  };

  const handleExportLogs = () => {
    const csv = [
      ['ID', 'Usuario', 'Acción', 'Detalles', 'Fecha'],
      ...logs.map((log: any) => [
        log.id,
        log.user,
        log.action,
        log.details,
        log.timestamp.toISOString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Bienvenido, {user?.email || 'Admin'}</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          {['dashboard', 'courses', 'logs', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-1 py-4 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'dashboard'
                ? '📊 Dashboard'
                : tab === 'courses'
                  ? '🎓 Familias'
                  : tab === 'logs'
                    ? '📝 Registros'
                    : '⚙️ Configuración'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Estudiantes Totales', value: stats.totalStudents, icon: '👥' },
              { label: 'Simulaciones Completadas', value: stats.completedSimulations, icon: '✓' },
              { label: 'Tasa de Completión', value: stats.averageCompletion, icon: '📈' },
              { label: 'Usuarios Activos', value: stats.activeUsers, icon: '🟢' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <span className="text-4xl">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Familias de Cursos</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                <Plus className="w-4 h-4" />
                Nueva Familia
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {families.map((family) => (
                <div key={family.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-2xl">{family.icon}</p>
                      <h3 className="text-xl font-bold text-gray-900 mt-2">{family.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{family.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedFamily(family)}
                        className="p-2 hover:bg-blue-100 rounded transition"
                      >
                        <Edit2 className="w-5 h-5 text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded transition">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 font-mono">
                    <p>Layout: {family.configJson.layout}</p>
                    <p>Módulos: {family.configJson.modules?.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Registros de Auditoría</h2>
              <button
                onClick={handleExportLogs}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Detalles
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{log.user}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{log.details}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {log.timestamp.toLocaleString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>

            {selectedFamily ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Configuración: {selectedFamily.name}</h3>
                  <button
                    onClick={() => setSelectedFamily(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>

                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  JSON de Configuración
                </label>
                <textarea
                  value={editingConfig || JSON.stringify(selectedFamily.configJson, null, 2)}
                  onChange={(e) => setEditingConfig(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 resize-vertical"
                  rows={10}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleSaveConfig(selectedFamily.id)}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-semibold"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setSelectedFamily(null)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-900">
                  Selecciona una familia de cursos para editar su configuración.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
