import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Settings, BarChart3, LogOut, Users, Shield, GraduationCap } from 'lucide-react';

interface CourseRow {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  category: string;
  modules: any;
  is_active: boolean;
}

const Dashboard = () => {
  const { user, roles, profile, signOut, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase.from('courses').select('*');
      if (data) setCourses(data as CourseRow[]);
    };
    if (user) fetchCourses();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const roleLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    alumno: { label: 'Alumno', icon: <GraduationCap className="w-3 h-3" />, color: 'bg-primary/10 text-primary' },
    profesor: { label: 'Profesor', icon: <BookOpen className="w-3 h-3" />, color: 'bg-success/10 text-success' },
    administrador: { label: 'Administrador', icon: <Settings className="w-3 h-3" />, color: 'bg-accent/10 text-accent' },
    ministerio: { label: 'Ministerio', icon: <Shield className="w-3 h-3" />, color: 'bg-warning/10 text-warning' },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">MSM</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {roles.map(role => (
                <Badge key={role} variant="secondary" className={`${roleLabels[role]?.color} text-xs gap-1`}>
                  {roleLabels[role]?.icon}
                  {roleLabels[role]?.label}
                </Badge>
              ))}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">{profile?.full_name}</span>
            {(hasRole('administrador')) && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <Settings className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            {(hasRole('profesor') || hasRole('administrador') || hasRole('ministerio')) && (
              <Button variant="outline" size="sm" onClick={() => navigate('/evaluations')}>
                <BarChart3 className="w-4 h-4 mr-1" /> Evaluaciones
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {hasRole('alumno') && !hasRole('profesor') && !hasRole('administrador')
              ? `Bienvenido, ${profile?.full_name || 'Alumno'}`
              : 'Panel de Control'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {hasRole('alumno') ? 'Seleccione un curso para iniciar la simulación' : 'Gestione cursos y simulaciones'}
          </p>
        </div>

        {courses.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hay cursos disponibles</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {hasRole('administrador') ? 'Cree un nuevo curso desde el panel de administración.' : 'Contacte a su administrador.'}
              </p>
              {hasRole('administrador') && (
                <Button className="mt-4" onClick={() => navigate('/admin')}>
                  <Settings className="w-4 h-4 mr-2" /> Crear Curso
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Card key={course.id} className="glass-card hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => navigate(`/simulation/${course.id}`)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                    {course.is_active && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
                  </div>
                  <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(course.modules as string[])?.slice(0, 3).map((mod: string) => (
                      <Badge key={mod} variant="outline" className="text-xs">{mod}</Badge>
                    ))}
                  </div>
                  <Button className="w-full" variant="default">
                    <Play className="w-4 h-4 mr-2" /> Iniciar Simulación
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
