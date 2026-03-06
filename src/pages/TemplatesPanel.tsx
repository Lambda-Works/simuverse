import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/ApiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, ArrowLeft, Copy, Trash2, Save, Eye, FileJson, Code2, Zap, AlertTriangle, Clock } from 'lucide-react';
import { FlowTemplate, FLOW_TEMPLATES, getAllTemplates } from '@/data/flowTemplates';
import { ScrollArea } from '@/components/ui/scroll-area';

const TemplatesPanel = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<FlowTemplate> | null>(null);
  const [rawJson, setRawJson] = useState('');
  const [filterFamily, setFilterFamily] = useState('all');

  useEffect(() => {
    if (!loading && (!user || !hasRole('administrador'))) {
      navigate('/dashboard');
    }
  }, [user, loading, hasRole, navigate]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/templates?active=true');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data);
          return;
        }
      }
    } catch {
      // Si falla la API, cargar estáticas
    }
    // Fallback: plantillas estáticas
    setTemplates(getAllTemplates());
  };

  // Sincronizar plantillas estáticas a la BD (primera vez)
  const handleSyncToDB = async () => {
    const staticTemplates = getAllTemplates();
    try {
      const response = await fetch('http://localhost:5000/api/templates/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ templates: staticTemplates })
      });
      const result = await response.json();
      toast.success(`Sincronizado: ${result.created} creadas, ${result.updated} actualizadas`);
      await loadTemplates();
    } catch (err: any) {
      toast.error(`Error al sincronizar: ${err.message}`);
    }
  };

  const handleEdit = (template: FlowTemplate) => {
    setEditingTemplate({ ...template });
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleDuplicateTemplate = async (template: FlowTemplate) => {
    try {
      const response = await fetch(`http://localhost:5000/api/templates/${template.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title: `${template.title} (Copia)`, course_code: `${template.course_code}-COPIA` })
      });
      if (response.ok) {
        const copy = await response.json();
        setTemplates(prev => [...prev, copy]);
        toast.success('Plantilla duplicada correctamente');
      } else {
        // Fallback: abrir en editor
        const newTemplate = { ...template, id: `${template.id}-copia-${Date.now()}`, course_code: `${template.course_code}-COPIA` };
        setEditingTemplate(newTemplate);
        setDialogOpen(true);
        toast.success('Plantilla duplicada. Edita los campos necesarios.');
      }
    } catch {
      const newTemplate = { ...template, id: `${template.id}-copia-${Date.now()}`, course_code: `${template.course_code}-COPIA` };
      setEditingTemplate(newTemplate);
      setDialogOpen(true);
    }
  };

  const handleJsonEdit = (template: FlowTemplate) => {
    setRawJson(JSON.stringify(template, null, 2));
    setSelectedTemplate(template);
    setJsonEditorOpen(true);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      setEditingTemplate(parsed);
      setJsonEditorOpen(false);
      toast.success('JSON validado y cargado');
    } catch (err: any) {
      toast.error(`Error en JSON: ${err.message}`);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    // Validaciones básicas
    if (!editingTemplate.title || !editingTemplate.course_id) {
      toast.error('Título y Course ID son obligatorios');
      return;
    }

    try {
      const isNew = !templates.find(t => t.id === editingTemplate.id);
      const url = isNew ? 'http://localhost:5000/api/templates' : `http://localhost:5000/api/templates/${editingTemplate.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...editingTemplate, template_data: editingTemplate })
      });

      if (response.ok) {
        const saved = await response.json();
        setTemplates(prev => {
          const existing = prev.findIndex(t => t.id === saved.id);
          if (existing >= 0) { const updated = [...prev]; updated[existing] = saved; return updated; }
          return [...prev, saved];
        });
        toast.success('Plantilla guardada en base de datos');
      } else {
        // Fallback local
        setTemplates(prev => {
          const existing = prev.findIndex(t => t.id === editingTemplate.id);
          if (existing >= 0) { const updated = [...prev]; updated[existing] = editingTemplate as FlowTemplate; return updated; }
          return [...prev, editingTemplate as FlowTemplate];
        });
        toast.success('Plantilla guardada localmente (sin conexión a BD)');
      }
      setDialogOpen(false);
      setEditingTemplate(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla? Esta acción no se puede deshacer.')) return;
    
    try {
      await fetch(`http://localhost:5000/api/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Plantilla eliminada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = filterFamily === 'all' 
    ? templates 
    : templates.filter(t => t.family === filterFamily);

  const families = ['administracion', 'rrhh', 'tecnologia', 'ventas', 'clubes', 'industria'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <FileJson className="w-5 h-5 text-primary" />
                Gestor de Plantillas de Flujos
              </h1>
              <p className="text-xs text-muted-foreground">MSM - Motor de Simulación Modular</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSyncToDB} title="Sincronizar plantillas estáticas del sistema a la base de datos">
              <Zap className="w-4 h-4 mr-1" /> Sync BD
            </Button>
            <Select value={filterFamily} onValueChange={setFilterFamily}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por familia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las familias</SelectItem>
                {families.map(f => (
                  <SelectItem key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">Plantillas Totales</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</div>
              <p className="text-xs text-muted-foreground">Activas</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{new Set(templates.map(t => t.family)).size}</div>
              <p className="text-xs text-muted-foreground">Familias</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.tools.length, 0)}</div>
              <p className="text-xs text-muted-foreground">Herramientas Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Plantillas */}
        <div className="space-y-4">
          {filtered.map(template => (
            <Card key={template.id} className="glass-card hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  {/* Header del template */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{template.title}</h3>
                        {template.is_active ? (
                          <Badge variant="default" className="text-xs">Activo</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{template.family}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{template.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Course ID: <code className="bg-muted px-2 py-0.5 rounded">{template.course_id}</code></span>
                        <span>v{template.version}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        title="Editar plantilla"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJsonEdit(template)}
                        title="Editar JSON"
                      >
                        <Code2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template)}
                        title="Duplicar plantilla"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Eliminar plantilla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Detalles del template */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border-t pt-4">
                    <div>
                      <p className="text-muted-foreground font-semibold">Inbox</p>
                      <p>{template.inbox.initial_messages.length} mensaje(s)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Herramientas</p>
                      <p>{template.tools.length} módulo(s)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Crisis Events</p>
                      <p>{template.crisis_events.length} evento(s)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">KPIs</p>
                      <p>{template.evaluation.criteria.length} criterio(s)</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 border-t pt-3">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileJson className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay plantillas en esta categoría.</p>
            </div>
          )}
        </div>
      </main>

      {/* Dialog - Editor de Plantilla */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
            <DialogDescription>
              Configure los parámetros del flujo de simulación
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="persona">Persona</TabsTrigger>
                <TabsTrigger value="herramientas">Herramientas</TabsTrigger>
                <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
              </TabsList>

              {/* Tab: Básico */}
              <TabsContent value="basico" className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={editingTemplate.title || ''}
                    onChange={e => setEditingTemplate(p => ({ ...p, title: e.target.value }))}
                    placeholder="Nombre del curso"
                  />
                </div>
                <div>
                  <Label>Course ID</Label>
                  <Input
                    value={editingTemplate.course_id || ''}
                    onChange={e => setEditingTemplate(p => ({ ...p, course_id: e.target.value }))}
                    placeholder="SEGUROS_01"
                    disabled={!!selectedTemplate?.id}
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={editingTemplate.description || ''}
                    onChange={e => setEditingTemplate(p => ({ ...p, description: e.target.value }))}
                    placeholder="Descripción del flujo..."
                  />
                </div>
              </TabsContent>

              {/* Tab: Persona */}
              <TabsContent value="persona" className="space-y-4">
                <div>
                  <Label>Rol Base</Label>
                  <Textarea
                    value={editingTemplate.persona?.base_role || ''}
                    onChange={e => setEditingTemplate(p => ({ ...p, persona: { ...p.persona, base_role: e.target.value } }))}
                    placeholder="Eres..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Contexto del Curso</Label>
                  <Textarea
                    value={editingTemplate.persona?.course_context || ''}
                    onChange={e => setEditingTemplate(p => ({ ...p, persona: { ...p.persona, course_context: e.target.value } }))}
                    placeholder="La simulación se desarrolla en..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Tab: Herramientas */}
              <TabsContent value="herramientas" className="space-y-4">
                <p className="text-sm text-muted-foreground">Herramientas configuradas: {editingTemplate.tools?.length || 0}</p>
                <div className="bg-muted p-4 rounded-lg text-sm max-h-64 overflow-y-auto">
                  <pre>{JSON.stringify(editingTemplate.tools, null, 2)}</pre>
                </div>
              </TabsContent>

              {/* Tab: Evaluación */}
              <TabsContent value="evaluacion" className="space-y-4">
                <div>
                  <Label>Puntaje Mínimo para Pasar</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingTemplate.evaluation?.min_score_to_pass || 70}
                    onChange={e => setEditingTemplate(p => ({ ...p, evaluation: { ...p.evaluation, min_score_to_pass: parseInt(e.target.value) } }))}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Criterios: {editingTemplate.evaluation?.criteria.length || 0}</p>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="w-4 h-4 mr-2" /> Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Editor JSON */}
      <Dialog open={jsonEditorOpen} onOpenChange={setJsonEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editor JSON - {selectedTemplate?.title}</DialogTitle>
            <DialogDescription>
              Edición avanzada. Asegúrate de que el JSON sea válido.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] w-full border rounded-lg p-4 bg-muted">
            <textarea
              value={rawJson}
              onChange={e => setRawJson(e.target.value)}
              className="w-full h-full bg-transparent text-xs font-mono outline-none resize-none"
              spellCheck="false"
            />
          </ScrollArea>

          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={() => setJsonEditorOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveJson}>
              <Code2 className="w-4 h-4 mr-2" /> Aplicar JSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesPanel;
