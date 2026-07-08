'use client'
/**
 * UsersABM.tsx — Gestión completa de usuarios del sistema
 * ABM: Alta/Baja/Modificación + asignación de roles
 * Solo accesible por admin.
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Settings, Users, Search, Mail, Shield, Eye, EyeOff } from 'lucide-react';

import { API_BASE } from '@/lib/api';
import { useAdmin } from '@/lib/admin-context';
const API = API_BASE;

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

const emptyForm = { name: '', email: '', password: '', role: 'student' };

export function UsersABM() {
  const { readOnly } = useAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/all`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API}/roles`);
      const data = await res.json();
      setRolesList(Array.isArray(data) ? data : []);
    } catch { toast.error('Error al cargar roles'); }
  };

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

  const handleOpen = (user?: UserRow) => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role: user.role });
      setEditingId(user.id);
    } else {
      setForm({ ...emptyForm });
      setEditingId(null);
    }
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Nombre y email son obligatorios'); return; }
    if (!editingId && !form.password) { toast.error('La contraseña es obligatoria para nuevos usuarios'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const payload: any = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await fetch(`${API}/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Usuario actualizado');
      } else {
        const res = await fetch(`${API}/users/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al crear usuario');
        }
        toast.success('Usuario creado exitosamente');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/users/${id}`, { method: 'DELETE' });
      toast.success('Usuario eliminado');
      setDeleteConfirm(null);
      fetchUsers();
    } catch { toast.error('Error al eliminar usuario'); }
  };

  const roleInfo = (role: string) => {
    const r = rolesList.find(x => x.name === role);
    return r ? { label: r.description || r.name, color: r.color } : { label: role, color: '#9CA3AF' };
  };

  const filtered = users.filter(u =>
    (filterRole === 'all' || u.role === filterRole) &&
    (search === '' || u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Gestión de Usuarios
          </h2>
          <p className="text-gray-500 mt-1">Alta, baja y modificación de usuarios del sistema.</p>
        </div>
        {!readOnly && <Button onClick={() => handleOpen()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>}
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-gray-50">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-56 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm">
            <option value="all">Todos los roles</option>
            {rolesList.map(r => <option key={r.name} value={r.name}>{r.description || r.name}</option>)}
          </select>
        </div>
      </Card>

      {/* Tabla */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-3">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </Card>
            ))}
          </div>
          <Card className="p-4 border shadow-sm">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {rolesList.map(r => {
              const count = users.filter(u => u.role === r.name).length;
              return (
                <Card key={r.name} className="p-3 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-gray-500 truncate" title={r.description || r.name}>{r.description || r.name}</p>
                </Card>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-lg border shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Rol</th>
                <th className="px-4 py-3 text-left">Registro</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Sin usuarios para los filtros aplicados.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" /> {u.email}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span 
                      className="text-xs font-semibold px-2 py-1 rounded border text-white"
                      style={{ backgroundColor: roleInfo(u.role).color, borderColor: roleInfo(u.role).color }}
                    >
                      {roleInfo(u.role).label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      {!readOnly && <Button size="sm" variant="outline" onClick={() => handleOpen(u)}
                        title="Editar usuario">
                        <Settings className="w-4 h-4" />
                      </Button>}
                      {!readOnly && <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm(u.id)}
                        title="Eliminar usuario">
                        <Trash2 className="w-4 h-4" />
                      </Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Dialog alta/edición */}
      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Nombre completo *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Juan Pérez" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="juan@ejemplo.com" />
            </div>
            <div className="space-y-1">
              <Label>{editingId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder={editingId ? '(sin cambios)' : 'Mínimo 6 caracteres'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Rol *</Label>
              <Select value={form.role} onValueChange={(val: any) => setForm(p => ({ ...p, role: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map(r => (
                    <SelectItem key={r.name} value={r.name}>
                      {r.description || r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Usuario'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmación delete */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600">⚠️ Eliminar usuario</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mt-2">
              ¿Estás seguro? Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al usuario.
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>
                Sí, eliminar
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
