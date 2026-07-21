'use client'
/**
 * RolesABM.tsx — Gestión de Roles, Funcionalidades del Sistema y Permisos por Rol
 * Pestañas:
 *   1. Roles: ABM de roles (crear/editar/eliminar)
 *   2. Funcionalidades: lista de todas las funcionalidades del sistema
 *   3. Permisos: seleccioná un rol y configurá qué funcionalidades puede usar
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart3,
    CheckCircle2,
    Gamepad2,
    GraduationCap,
    Landmark,
    LayoutGrid,
    Lock,
    Pause,
    Plus,
    RotateCw,
    Save,
    Settings,
    Shield,
    Trash2,
    Wrench,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { apiClient } from '@/services/ApiClient';

interface Role {
  id: number;
  name: string;
  description: string;
  is_active: number;
  color: string;
  created_at: string;
}

interface Functionality {
  id: number;
  name: string;
  description: string;
  module: string;
  icon: string;
  route: string;
  is_active: number;
}

interface RolePermission {
  functionality_id: number;
  name: string;
  description: string;
  module: string;
  icon: string;
  enabled: number;
}

const MODULE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  reports: 'bg-blue-100 text-blue-700 border-blue-200',
  simulation: 'bg-purple-100 text-purple-700 border-purple-200',
  student: 'bg-green-100 text-green-700 border-green-200',
  ministry: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

const MODULE_LABELS: Record<string, React.ReactNode> = {
  admin: <><Settings className="w-3.5 h-3.5 inline" /> Administración</>,
  reports: <><BarChart3 className="w-3.5 h-3.5 inline" /> Reportes</>,
  simulation: <><Gamepad2 className="w-3.5 h-3.5 inline" /> Simulación</>,
  student: <><GraduationCap className="w-3.5 h-3.5 inline" /> Alumno</>,
  ministry: <><Landmark className="w-3.5 h-3.5 inline" /> Ministerio</>,
  other: <><Wrench className="w-3.5 h-3.5 inline" /> Otros</>,
};

const MODULE_LABELS_TEXT: Record<string, string> = {
  admin: 'Administración',
  reports: 'Reportes',
  simulation: 'Simulación',
  student: 'Alumno',
  ministry: 'Ministerio',
  other: 'Otros',
};

// ─── ABM de Roles ─────────────────────────────────────────────────────────────
function RolesTab({ roles, onRefresh }: { roles: Role[]; onRefresh: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [saving, setSaving] = useState(false);

  const handleOpen = (role?: Role) => {
    if (role) {
      setForm({ name: role.name, description: role.description || '', color: role.color || '#6366f1' });
      setEditingId(role.id);
    } else {
      setForm({ name: '', description: '', color: '#6366f1' });
      setEditingId(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/roles/${editingId}`, form);
      } else {
        await apiClient.post('/roles', form);
      }
      toast.success(editingId ? 'Rol actualizado' : 'Rol creado');
      setDialogOpen(false);
      onRefresh();
    } catch { toast.error('Error al guardar'); }
    setSaving(false);
  };

  const handleDelete = (id: number) => {
    toast.error('¿Eliminar este rol? No se puede deshacer.', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await apiClient.delete(`/roles/${id}`);
            toast.success('Rol eliminado');
            onRefresh();
          } catch { toast.error('Error al eliminar'); }
        },
      },
      duration: 5000,
    });
  };

  const handleReactivate = async (id: number) => {
    try {
      await apiClient.put(`/admin/roles/${id}/reactivate`);
      onRefresh();
      toast.success('Rol reactivado');
    } catch { toast.error('Error al reactivar'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => handleOpen()} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Rol
        </Button>
      </div>

      <div className="grid gap-3">
        {roles.map(role => (
          <Card key={role.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: role.color || '#6366f1' }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{role.name}</span>
                    <Badge variant="outline" className={`text-xs ${role.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {role.is_active ? <><CheckCircle2 className="w-4 h-4 inline text-green-500" /> Activo</> : <><Pause className="w-4 h-4 inline text-gray-400" /> Inactivo</>}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpen(role)}>
                  <Settings className="w-4 h-4" />
                </Button>
                {role.is_active ? (
                <Button size="sm" variant="destructive" onClick={() => handleDelete(role.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                ) : (
                <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => handleReactivate(role.id)}>
                  <RotateCw className="w-4 h-4 mr-1" /> Reactivar
                </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {roles.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No hay roles configurados.</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Nombre del rol *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="supervisor" />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Supervisor de aula" />
            </div>
            <div className="space-y-1">
              <Label>Color identificador</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border" />
                <Input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  className="font-mono" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Rol'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ABM de Funcionalidades ────────────────────────────────────────────────────
function FunctionalitiesTab({ funcs, onRefresh }: { funcs: Functionality[]; onRefresh: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', module: 'admin', icon: '', route: '' });
  const [saving, setSaving] = useState(false);

  const handleOpen = (f?: Functionality) => {
    if (f) {
      setForm({ name: f.name, description: f.description || '', module: f.module || 'admin', icon: f.icon || '', route: f.route || '' });
      setEditingId(f.id);
    } else {
      setForm({ name: '', description: '', module: 'admin', icon: '', route: '' });
      setEditingId(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/functionalities/${editingId}`, form);
      } else {
        await apiClient.post('/functionalities', form);
      }
      toast.success(editingId ? 'Funcionalidad actualizada' : 'Funcionalidad creada');
      setDialogOpen(false);
      onRefresh();
    } catch { toast.error('Error al guardar'); }
    setSaving(false);
  };

  const handleDelete = (id: number) => {
    toast.error('¿Eliminar esta funcionalidad?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await apiClient.delete(`/functionalities/${id}`);
            toast.success('Funcionalidad eliminada');
            onRefresh();
          } catch { toast.error('Error al eliminar'); }
        },
      },
      duration: 5000,
    });
  };

  // Group by module
  const grouped = funcs.reduce((acc, f) => {
    const mod = f.module || 'other';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(f);
    return acc;
  }, {} as Record<string, Functionality[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Nueva Funcionalidad
        </Button>
      </div>

      {Object.entries(grouped).map(([mod, items]) => (
        <div key={mod}>
          <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${MODULE_COLORS[mod] || MODULE_COLORS.other}`}>
              {MODULE_LABELS[mod] || mod}
            </span>
            <span className="text-gray-400">({items.length})</span>
          </h4>
          <div className="grid gap-2 ml-2">
            {items.map(f => (
              <Card key={f.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{f.name}</p>
                    {f.description && <p className="text-xs text-gray-500">{f.description}</p>}
                    {f.route && <p className="text-xs text-gray-400 font-mono">{f.route}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleOpen(f)}>
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(f.id)}
                      className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Funcionalidad' : 'Nueva Funcionalidad'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: ver_reportes_avanzados" />
              <p className="text-[12px] text-gray-500 mt-1">Identificador corto para la funcionalidad en el sistema.</p>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Ej: Permite al usuario ver los reportes detallados..." />
              <p className="text-[12px] text-gray-500 mt-1">Explica brevemente qué permite hacer esta funcionalidad.</p>
            </div>
            <div>
              <Label>Módulo</Label>
              <select value={form.module} onChange={e => setForm(p => ({ ...p, module: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                {Object.entries(MODULE_LABELS_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <p className="text-[12px] text-gray-500 mt-1">Categoría bajo la cual se agrupará en el panel de permisos.</p>
            </div>
            <div>
              <Label>Icono (nombre Lucide)</Label>
              <Input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="Ej: BarChart3" />
              <p className="text-[12px] text-gray-500 mt-1">Opcional. Ícono identificativo para mostrar en la interfaz.</p>
            </div>
            <div>
              <Label>Ruta</Label>
              <Input value={form.route} onChange={e => setForm(p => ({ ...p, route: e.target.value }))} placeholder="Ej: /admin/reports" />
              <p className="text-[12px] text-gray-500 mt-1">Opcional. Ruta de la app a la que da acceso exclusivo.</p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Permisos por Rol ─────────────────────────────────────────────────────────
function PermissionsTab({ roles }: { roles: Role[] }) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  const fetchPermissions = async (roleName: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/role-permissions?role_name=${encodeURIComponent(roleName)}`);
      const data = res.data;
      setPermissions(Array.isArray(data) ? data : []);
      setChanged(false);
    } catch { toast.error('Error al cargar permisos'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedRole) fetchPermissions(selectedRole);
  }, [selectedRole]);

  const togglePermission = (funcId: number) => {
    setPermissions(prev => prev.map(p =>
      p.functionality_id === funcId ? { ...p, enabled: p.enabled ? 0 : 1 } : p
    ));
    setChanged(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/role-permissions', {
        role_name: selectedRole,
        permissions: permissions.map(p => ({ functionality_id: p.functionality_id, enabled: p.enabled }))
      });
      toast.success(`Permisos de '${selectedRole}' actualizados`);
      setChanged(false);
    } catch { toast.error('Error al guardar permisos'); }
    setSaving(false);
  };

  const grouped = permissions.reduce((acc, p) => {
    const mod = p.module || 'other';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {} as Record<string, RolePermission[]>);

  const enabledCount = permissions.filter(p => p.enabled).length;

  return (
    <div className="space-y-4">
      {/* Selector de rol */}
      <Card className="p-4 bg-indigo-50 border-indigo-200">
        <Label className="text-indigo-700 font-semibold">Seleccionar Rol a Configurar</Label>
        <div className="flex gap-3 mt-2 flex-wrap">
          {roles.map(r => (
            <button
              key={r.name}
              onClick={() => setSelectedRole(r.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
                ${selectedRole === r.name
                  ? 'border-opacity-100 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              style={selectedRole === r.name ? { borderColor: r.color, backgroundColor: r.color + '20' } : {}}
            >
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                {r.name}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {!selectedRole && (
        <div className="py-12 text-center text-gray-400">
          <Lock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Seleccioná un rol para configurar sus permisos.</p>
        </div>
      )}

      {selectedRole && loading && (
        <div className="py-8 text-center text-gray-400">Cargando permisos...</div>
      )}

      {selectedRole && !loading && (
        <>
          {/* Header con conteo */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Permisos del rol: <span className="text-indigo-700">{selectedRole}</span></h3>
              <p className="text-sm text-gray-500">
                {enabledCount} de {permissions.length} funcionalidades habilitadas
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                setPermissions(prev => prev.map(p => ({ ...p, enabled: 1 }))); setChanged(true);
              }}>Habilitar todo</Button>
              <Button variant="outline" size="sm" onClick={() => {
                setPermissions(prev => prev.map(p => ({ ...p, enabled: 0 }))); setChanged(true);
              }}>Deshabilitar todo</Button>
              {changed && (
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-1" /> {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              )}
            </div>
          </div>

          {/* Tabla de permisos por módulo */}
          {Object.entries(grouped).map(([mod, items]) => (
            <Card key={mod} className="overflow-hidden">
              <div className={`px-4 py-2 text-sm font-semibold ${MODULE_COLORS[mod] || MODULE_COLORS.other}`}>
                {MODULE_LABELS[mod] || mod}
                <span className="ml-2 font-normal opacity-70">
                  ({items.filter(p => p.enabled).length}/{items.length})
                </span>
              </div>
              <div className="divide-y">
                {items.map(p => (
                  <div key={p.functionality_id}
                    className={`flex items-center justify-between px-4 py-3 ${p.enabled ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      {p.enabled
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      }
                      <div>
                        <p className={`text-sm font-medium ${p.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          {p.name}
                        </p>
                        {p.description && (
                          <p className="text-xs text-gray-400">{p.description}</p>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={!!p.enabled}
                      onCheckedChange={() => togglePermission(p.functionality_id)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          ))}


        </>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function RolesABM() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [funcs, setFuncs] = useState<Functionality[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rolesRes, funcsRes] = await Promise.all([
        apiClient.get('/roles').then(r => r.data),
        apiClient.get('/functionalities').then(r => r.data),
      ]);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
      setFuncs(Array.isArray(funcsRes) ? funcsRes : []);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <div className="py-12 text-center text-gray-400">Cargando roles y permisos...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> Roles, Funcionalidades y Permisos
        </h2>
        <p className="text-gray-500 mt-1">
          Configurá roles del sistema, listá las funcionalidades disponibles y asigná permisos por rol.
        </p>
      </div>

      <Tabs defaultValue="permissions">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-1" /> Roles
          </TabsTrigger>
          <TabsTrigger value="functionalities">
            <LayoutGrid className="w-4 h-4 mr-1" /> Funcionalidades
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Lock className="w-4 h-4 mr-1" /> Permisos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4">
          <RolesTab roles={roles} onRefresh={fetchAll} />
        </TabsContent>

        <TabsContent value="functionalities" className="mt-4">
          <FunctionalitiesTab funcs={funcs} onRefresh={fetchAll} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <PermissionsTab roles={roles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
