import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
}

export function CategoriesABM() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      alert('Nombre y código son obligatorios');
      return;
    }

    try {
      if (editingId) {
        // Update
        await fetch(`http://localhost:5000/api/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        await fetch('http://localhost:5000/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      // Reset form
      setFormData({ name: '', code: '', description: '' });
      setEditingId(null);
      setIsAddingNew(false);

      // Refresh list
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al guardar la categoría');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE',
      });
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
    });
    setIsAddingNew(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', code: '', description: '' });
    setEditingId(null);
    setIsAddingNew(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando categorías...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
          <p className="text-gray-600 mt-1">Crea y administra familias de cursos</p>
        </div>
        {!isAddingNew && (
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        )}
      </div>

      {/* Form para agregar/editar */}
      {isAddingNew && (
        <Card className="p-6 border border-blue-200 bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Recursos Humanos"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Código</label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="ej: RRHH"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la categoría..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingId ? 'Actualizar' : 'Crear'} Categoría
              </Button>
              <Button type="button" onClick={handleCancel} variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{category.name}</h4>
                <p className="text-sm text-gray-500">Código: {category.code}</p>
                {category.description && (
                  <p className="text-sm mt-2 text-gray-600">{category.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Creado: {new Date(category.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(category)}
                  size="sm"
                  variant="outline"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(category.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {categories.length === 0 && !isAddingNew && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No hay categorías. ¡Crea una para empezar!</p>
        </Card>
      )}
    </div>
  );
}
