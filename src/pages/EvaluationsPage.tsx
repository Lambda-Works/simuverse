import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BarChart3, Clock, MessageCircle, Users, AlertTriangle, CheckCircle } from 'lucide-react';

const EvaluationsPage = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [logs, setLogs] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!loading && (!user || (!hasRole('profesor') && !hasRole('administrador') && !hasRole('ministerio')))) {
      navigate('/dashboard');
    }
  }, [user, loading, hasRole, navigate]);

  useEffect(() => {
    const fetch = async () => {
      const [simsRes, coursesRes] = await Promise.all([
        supabase.from('simulations').select('*, courses(title, category, eval_criteria)')
          .order('started_at', { ascending: false }),
        supabase.from('courses').select('id, title'),
      ]);
      if (simsRes.data) setSimulations(simsRes.data);
      if (coursesRes.data) setCourses(coursesRes.data);
    };
    if (user) fetch();
  }, [user]);

  const loadLogs = async (simId: string) => {
    if (logs[simId]) return;
    const { data } = await supabase.from('simulation_logs')
      .select('*').eq('simulation_id', simId).order('created_at', { ascending: true });
    if (data) setLogs(prev => ({ ...prev, [simId]: data }));
  };

  const filtered = selectedCourse === 'all' ? simulations : simulations.filter(s => s.course_id === selectedCourse);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active: { label: 'En Curso', color: 'bg-success/10 text-success', icon: <Clock className="w-3 h-3" /> },
    completed: { label: 'Completada', color: 'bg-primary/10 text-primary', icon: <CheckCircle className="w-3 h-3" /> },
    paused: { label: 'Pausada', color: 'bg-warning/10 text-warning', icon: <Clock className="w-3 h-3" /> },
    abandoned: { label: 'Abandonada', color: 'bg-destructive/10 text-destructive', icon: <AlertTriangle className="w-3 h-3" /> },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <span className="font-bold text-lg">
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Evaluaciones y Telemetría
            </span>
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{simulations.length}</div>
              <p className="text-xs text-muted-foreground">Total Simulaciones</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{simulations.filter(s => s.status === 'completed').length}</div>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{simulations.filter(s => s.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">En Curso</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {simulations.filter(s => s.score !== null).length > 0
                  ? (simulations.filter(s => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) / simulations.filter(s => s.score !== null).length).toFixed(1)
                  : '—'}
              </div>
              <p className="text-xs text-muted-foreground">Puntaje Promedio</p>
            </CardContent>
          </Card>
        </div>

        {/* Simulation list */}
        <div className="space-y-3">
          {filtered.map(sim => {
            const st = statusConfig[sim.status] || statusConfig.active;
            const courseName = (sim.courses as any)?.title || 'Curso';
            const studentName = 'Alumno';
            const duration = sim.completed_at
              ? Math.round((new Date(sim.completed_at).getTime() - new Date(sim.started_at).getTime()) / 60000)
              : null;

            return (
              <Card key={sim.id} className="glass-card cursor-pointer hover:shadow-lg transition-all" onClick={() => loadLogs(sim.id)}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{studentName}</span>
                        <Badge variant="secondary" className={`text-xs ${st.color} gap-1`}>{st.icon}{st.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{courseName}</span>
                        <span>·</span>
                        <span>{new Date(sim.started_at).toLocaleDateString('es-AR')}</span>
                        {duration !== null && <><span>·</span><span>{duration} min</span></>}
                        {sim.score !== null && <><span>·</span><span className="font-medium text-primary">{sim.score}/100</span></>}
                      </div>
                    </div>
                  </div>

                  {/* Expanded logs */}
                  {logs[sim.id] && (
                    <div className="mt-4 border-t pt-3">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">REGISTRO DE ACTIVIDAD ({logs[sim.id].length} eventos)</h4>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {logs[sim.id].map(log => (
                          <div key={log.id} className="flex items-center gap-2 text-xs py-1">
                            <span className="text-muted-foreground w-16 flex-shrink-0">
                              {new Date(log.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <Badge variant="outline" className="text-xs">{log.event_type}</Badge>
                            <span className="text-muted-foreground truncate">{JSON.stringify(log.event_data).slice(0, 80)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay simulaciones registradas.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EvaluationsPage;
