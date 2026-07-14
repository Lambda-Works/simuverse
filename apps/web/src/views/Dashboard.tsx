'use client'
import { SimulationCalendar } from '@/components/SimulationCalendar';
import { StudentReviewModal } from '@/components/StudentReviewModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/ApiClient';
import { Award, BookOpen, CalendarDays, CheckCircle2, Clock, CreditCard, Eye, GraduationCap, HelpCircle, Lock, Mail, MessageSquare, Phone, Play, Settings, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  modules: string[];
  is_active: number;
}

interface Assignment {
  id: number;
  simulation_id: string;
  course_id: string;
  status: string;
}

interface CoursePracticeProgress {
  total: number;
  completed_count: number;
  practices: Array<{
    id: string;
    agent_key: string;
    title: string;
    status: 'locked' | 'available' | 'in_progress' | 'completed';
  }>;
}

const Dashboard = () => {
  const { user, signOut, loading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrichedAssignments, setEnrichedAssignments] = useState<any[]>([]);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ instanceId: string; courseTitle: string } | null>(null);
  const [coursePractices, setCoursePractices] = useState<Record<string, CoursePracticeProgress>>({});

  // Estado del formulario de solicitud de acceso
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', celular: '', email: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        // Admin, docentes y ministerio ven todos los cursos directamente
        if (hasRole('admin') || hasRole('teacher') || hasRole('ministerio')) {
          const response = await apiClient.get('/courses');
          setCourses(response.data);
          setAssignmentsLoaded(true);
          return;
        }

        // Para alumnos: verificar asignaciones primero
        const [assignRes, coursesRes] = await Promise.all([
          apiClient.get(`/assignments?student_id=${user.id}`).then(r => r.data),
          apiClient.get('/courses'),
        ]);

        const assignList: Assignment[] = assignRes || [];
        setAssignments(assignList);

        const allCourses: Course[] = coursesRes.data || [];

        if (assignList.length > 0) {
          // Solo mostrar los cursos que tiene asignados
          const assignedCourseIds = new Set(assignList.map((a: Assignment) => a.course_id));
          setCourses(allCourses.filter(c => assignedCourseIds.has(c.id)));
        } else {
          setCourses([]);
        }

        // Pre-llenar email del formulario
        setForm(prev => ({ ...prev, email: user.email || '' }));

        // Fetch enriched assignments (con intentos, fechas, score, instance_id)
        try {
          const enrichedRes = await apiClient.get(`/student-assignments/${user.id}`);
          const enriched = enrichedRes.data;
          if (Array.isArray(enriched)) setEnrichedAssignments(enriched);
        } catch { /* silent */ }

        const visibleCourses =
          assignList.length > 0
            ? allCourses.filter((c) => assignList.some((a) => a.course_id === c.id))
            : [];
        if (visibleCourses.length > 0) {
          const entries = await Promise.all(
            visibleCourses.map(async (c) => {
              try {
                const res = await apiClient.get(`/practices/course/${c.id}/progress`);
                return [c.id, res.data as CoursePracticeProgress] as const;
              } catch {
                return [c.id, null] as const;
              }
            }),
          );
          setCoursePractices(
            Object.fromEntries(entries.filter(([, v]) => v != null) as [string, CoursePracticeProgress][]),
          );
        }

        setAssignmentsLoaded(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAssignmentsLoaded(true);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  if (loading || !assignmentsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const roleLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    student: { label: 'Estudiante', icon: <GraduationCap className="w-3 h-3" />, color: 'bg-primary/10 text-primary' },
    teacher: { label: 'Profesor', icon: <BookOpen className="w-3 h-3" />, color: 'bg-success/10 text-success' },
    admin: { label: 'Administrador', icon: <Settings className="w-3 h-3" />, color: 'bg-accent/10 text-accent' },
    ministerio: { label: 'Ministerio', icon: <Shield className="w-3 h-3" />, color: 'bg-warning/10 text-warning' },
  };

  // ── Validación del formulario de solicitud ───────────────────────────────────
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!form.apellido.trim()) errors.apellido = 'El apellido es obligatorio';
    if (!form.dni.trim()) errors.dni = 'El DNI es obligatorio';
    if (!/^\d{6,10}$/.test(form.dni.replace(/\./g, '').replace(/-/g, '')))
      errors.dni = 'DNI inválido (solo números, 6-10 dígitos)';
    if (!form.celular.trim()) errors.celular = 'El celular es obligatorio';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Email inválido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendRequest = async () => {
    if (!validateForm()) return;
    setSending(true);
    setSendError('');
    try {
      const res = await apiClient.post('/request-access', {
        student_id: user?.id,
        student_name: `${form.nombre} ${form.apellido}`,
        student_email: form.email,
        course_id: '',
        course_name: '',
        reason: JSON.stringify({ dni: form.dni, celular: form.celular }),
      });
      setSent(true);
    } catch (err: any) {
      setSendError(err.response?.data?.error || err.message || 'No se pudo enviar la solicitud. Intente nuevamente.');
    } finally {
      setSending(false);
    }
  };

  const isStudentOnly = hasRole('student') && !hasRole('teacher') && !hasRole('admin');
  const hasNoAssignments = isStudentOnly && assignments.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">

        {/* ── CASO: alumno sin asignaciones → pantalla de bienvenida + formulario ── */}
        {hasNoAssignments ? (
          <div className="max-w-2xl mx-auto">
            {/* Banner de bienvenida */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                ¡Bienvenido/a, {user?.name}!
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Tu cuenta ha sido creada exitosamente en el simulador MSM.
              </p>
            </div>

            {/* Aviso sin asignaciones */}
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 mb-6">
              <CardContent className="pt-6 flex gap-4">
                <div className="shrink-0">
                  <Clock className="w-6 h-6 text-amber-600 mt-0.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                    Aún no tienes escenarios asignados
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Para acceder a las simulaciones, un docente o administrador debe asignarte
                    un espacio de trabajo. Completa el formulario a continuación para solicitar
                    tu acceso y te contactaremos a la brevedad.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de solicitud */}
            {sent ? (
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-3">
                  <CheckCircle2 className="w-14 h-14 text-green-500" />
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">
                    ¡Solicitud enviada correctamente!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 max-w-sm">
                    Recibimos tu pedido. El equipo de <strong>CentroSadosky</strong> revisará
                    tu solicitud y te asignará los escenarios de simulación disponibles.
                    Te avisaremos por email cuando esté listo.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Correo de contacto: <strong>centrosadoskyregistracion@gmail.com</strong>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="w-5 h-5 text-primary" />
                    Solicitar acceso al simulador
                  </CardTitle>
                  <CardDescription>
                    Completa todos los campos. Tu solicitud será enviada a{' '}
                    <strong>centrosadoskyregistracion@gmail.com</strong>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                      <Label htmlFor="nombre" className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Nombre *
                      </Label>
                      <Input
                        id="nombre"
                        placeholder="Ej: María"
                        value={form.nombre}
                        onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                        className={formErrors.nombre ? 'border-destructive' : ''}
                      />
                      {formErrors.nombre && <p className="text-xs text-destructive">{formErrors.nombre}</p>}
                    </div>

                    {/* Apellido */}
                    <div className="space-y-1.5">
                      <Label htmlFor="apellido" className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Apellido *
                      </Label>
                      <Input
                        id="apellido"
                        placeholder="Ej: González"
                        value={form.apellido}
                        onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))}
                        className={formErrors.apellido ? 'border-destructive' : ''}
                      />
                      {formErrors.apellido && <p className="text-xs text-destructive">{formErrors.apellido}</p>}
                    </div>

                    {/* DNI */}
                    <div className="space-y-1.5">
                      <Label htmlFor="dni" className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> DNI *
                      </Label>
                      <Input
                        id="dni"
                        placeholder="Ej: 35123456"
                        value={form.dni}
                        onChange={e => setForm(p => ({ ...p, dni: e.target.value }))}
                        className={formErrors.dni ? 'border-destructive' : ''}
                      />
                      {formErrors.dni && <p className="text-xs text-destructive">{formErrors.dni}</p>}
                    </div>

                    {/* Celular */}
                    <div className="space-y-1.5">
                      <Label htmlFor="celular" className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Celular *
                      </Label>
                      <Input
                        id="celular"
                        placeholder="Ej: 11 6123-4567"
                        value={form.celular}
                        onChange={e => setForm(p => ({ ...p, celular: e.target.value }))}
                        className={formErrors.celular ? 'border-destructive' : ''}
                      />
                      {formErrors.celular && <p className="text-xs text-destructive">{formErrors.celular}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Correo electrónico *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className={formErrors.email ? 'border-destructive' : ''}
                    />
                    {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                  </div>

                  {sendError && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 text-sm text-destructive">
                      {sendError}
                    </div>
                  )}

                  <Button className="w-full" onClick={handleSendRequest} disabled={sending}>
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enviando solicitud...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar solicitud de acceso
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Al enviar, un administrador o docente asignará los escenarios correspondientes a tu perfil.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

        ) : (
          /* ── CASO NORMAL: mostrar cursos ──────────────────────────────────── */
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {isStudentOnly
                  ? `Bienvenido, ${user?.name || 'Estudiante'}`
                  : 'Panel de Control'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isStudentOnly
                  ? courses.length > 0
                    ? `Tenés ${courses.length} simulación${courses.length !== 1 ? 'es' : ''} asignada${courses.length !== 1 ? 's' : ''}. Hacé click en "Iniciar" para comenzar.`
                    : 'Aquí verás tus simulaciones asignadas.'
                  : 'Gestione cursos y simulaciones'}
              </p>
            </div>

            {/* ── Guía paso a paso para alumnos ───────────────────────────────── */}
            {isStudentOnly && courses.length > 0 && (
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2 text-sm">
                  <HelpCircle className="w-4 h-4" /> ¿Cómo usar el simulador?
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: BookOpen, title: 'Elegí tu simulación', desc: 'Hacé click en una tarjeta para ver los detalles del escenario asignado.' },
                    { icon: Play, title: 'Iniciá', desc: 'Presioná "Iniciar". El sistema te presentará el contexto del caso a resolver.' },
                    { icon: MessageSquare, title: 'Interactuá', desc: 'Usá el chat con tu asesor, revisá emails y documentos del escenario.' },
                    { icon: Award, title: 'Finalizá', desc: 'Al terminar, el sistema evalúa tu desempeño y genera tu puntaje y certificado.' },
                  ].map(({ icon: Icon, title, desc }, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                          <Icon className="w-3 h-3" /> {title}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5 leading-snug">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {courses.length === 0 ? (              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No hay cursos disponibles</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {hasRole('admin') ? 'Cree un nuevo curso desde el panel de administración.' : 'Contacte a su administrador.'}
                  </p>
                  {hasRole('admin') && (
                    <Button className="mt-4" onClick={() => router.push('/admin')}>
                      <Settings className="w-4 h-4 mr-2" /> Crear Curso
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => {
                  // Buscar asignación enriquecida para esta course
                  const enriched = enrichedAssignments.find(a => a.course_id === course.id);
                  const attemptsLeft = enriched ? Number(enriched.attempts_remaining ?? 99) : null;
                  const hasScore = enriched && enriched.overall_score !== null && enriched.overall_score !== undefined;
                  const passed = hasScore && Number(enriched.overall_score) >= 70;
                  const calStatus = enriched?.calendar_status;
                  const practiceSummary = coursePractices[course.id];

                  return (
                    <Card
                      key={course.id}
                      className={`flex flex-col h-full glass-card hover:shadow-xl transition-all duration-300 group cursor-pointer ${calStatus === 'expired' ? 'opacity-60' : ''}`}
                      onClick={() => calStatus !== 'expired' && router.push(`/simulation/${course.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                          <div className="flex items-center gap-1.5">
                            {calStatus === 'expired' && <Badge className="text-xs bg-red-100 text-red-700 border-red-300 border">Vencido</Badge>}
                            {calStatus === 'upcoming' && <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-300 border">Próximo</Badge>}
                            {calStatus === 'completed' && <Badge className="text-xs bg-green-100 text-green-700 border-green-300 border">Completado</Badge>}
                            {course.is_active && !calStatus && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
                          </div>
                        </div>
                        <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1">
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(course.modules as string[])?.slice(0, 3).map((mod: string) => (
                            <Badge key={mod} variant="outline" className="text-xs">{mod}</Badge>
                          ))}
                        </div>
                        {/* Prácticas del curso (progreso secuencial) */}
                        {isStudentOnly && practiceSummary && (
                          <div className="mb-3 space-y-1.5">
                            {practiceSummary.total > 0 ? (
                              <>
                                <p className="text-xs font-medium text-muted-foreground">
                                  Prácticas: {practiceSummary.completed_count}/{practiceSummary.total} completadas
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {practiceSummary.practices.map((p) => (
                                    <Badge
                                      key={p.id}
                                      variant="outline"
                                      className={`text-xs gap-1 ${
                                        p.status === 'completed'
                                          ? 'border-green-300 bg-green-50/50 text-green-700'
                                          : p.status === 'locked'
                                            ? 'opacity-60'
                                            : p.status === 'in_progress'
                                              ? 'border-primary bg-primary/5'
                                              : ''
                                      }`}
                                    >
                                      {p.status === 'locked' && <Lock className="w-3 h-3" />}
                                      {p.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                                      {p.agent_key}
                                    </Badge>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Este curso aún no tiene prácticas configuradas.
                              </p>
                            )}
                          </div>
                        )}
                        {/* Info de intentos / score */}
                        {enriched && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 bg-muted/40 rounded-md px-2 py-1.5">
                            {attemptsLeft !== null && (
                              <span className={`flex items-center gap-1 ${attemptsLeft === 0 ? 'text-red-600 font-semibold' : ''}`}>
                                <Clock className="w-3 h-3" />
                                {attemptsLeft > 0 ? `${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''} restante${attemptsLeft !== 1 ? 's' : ''}` : 'Sin intentos'}
                              </span>
                            )}
                            {hasScore && (
                              <span className={`flex items-center gap-1 font-semibold ${passed ? 'text-green-600' : 'text-orange-600'}`}>
                                {passed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {Number(enriched.overall_score).toFixed(0)} pts
                              </span>
                            )}
                            {enriched.end_date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                Vto: {new Date(enriched.end_date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 mt-auto">
                          <Button
                            className="flex-1"
                            variant="default"
                            disabled={calStatus === 'expired' || (attemptsLeft !== null && attemptsLeft === 0)}
                            onClick={e => { e.stopPropagation(); router.push(`/simulation/${course.id}`); }}
                          >
                            <Play className="w-4 h-4 mr-2" /> {calStatus === 'completed' ? 'Re-intentar' : 'Iniciar'}
                          </Button>
                          {/* Botón revisión */}
                          {enriched?.instance_id && (
                            <Button
                              size="icon"
                              variant="outline"
                              title="Revisar mi simulación"
                              onClick={e => { e.stopPropagation(); setReviewModal({ instanceId: enriched.instance_id, courseTitle: course.title }); }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {/* Botón certificado */}
                          {enriched?.instance_id && passed && (
                            <Button
                              size="icon"
                              variant="outline"
                              title="Ver certificado"
                              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                              onClick={e => { e.stopPropagation(); router.push(`/certificate/${enriched.instance_id}`); }}
                            >
                              <Award className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Mini calendario del alumno */}
            {isStudentOnly && enrichedAssignments.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Mi Calendario de Simulaciones
                </h2>
                <SimulationCalendar studentId={user?.id} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de revisión de simulación */}
      {reviewModal && user && (
        <StudentReviewModal
          instanceId={reviewModal.instanceId}
          studentId={user.id}
          courseTitle={reviewModal.courseTitle}
          open={!!reviewModal}
          onClose={() => setReviewModal(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
