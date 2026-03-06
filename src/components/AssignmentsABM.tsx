import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Send } from 'lucide-react';

interface Assignment {
  id: number;
  simulation_id: string;
  student_id: string;
  course_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string;
  max_attempts: number;
  status: string;
  attempts_used: number;
  created_at: string;
}

interface Simulation {
  id: string;
  course_id: string;
}

interface Course {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function AssignmentsABM() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [formData, setFormData] = useState({
    simulation_id: '',
    student_id: '',
    course_id: '',
    max_attempts: 1,
    start_date: '',
    end_date: '',
  });

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetchAssignments(),
      fetchCourses(),
      fetchSimulations(),
      fetchStudents(),
    ]).then(() => setLoading(false));
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/assignments');
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSimulations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/simulations');
      const data = await response.json();
      setSimulations(data);
    } catch (error) {
      console.error('Error fetching simulations:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // Mock students since we don't have a dedicated endpoint
      const mockStudents: User[] = [
        { id: 'user-1', name: 'Juan Pérez', email: 'student@example.com', role: 'student' },
        { id: 'user-2', name: 'María García', email: 'maria@example.com', role: 'student' },
        { id: 'user-3', name: 'Carlos López', email: 'carlos@example.com', role: 'student' },
      ];
      setUsers(mockStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.simulation_id || !formData.student_id || !formData.course_id) {
      alert('Simulación, estudiante y curso son obligatorios');
      return;
    }

    try {
      const payload = {
        ...formData,
        assigned_by: localStorage.getItem('userId') || 'system',
      };

      await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Reset form
      setFormData({
        simulation_id: '',
        student_id: '',
        course_id: '',
        max_attempts: 1,
        start_date: '',
        end_date: '',
      });
      setIsAddingNew(false);

      // Refresh list
      await fetchAssignments();
      alert('✅ Asignación creada. El estudiante recibirá una notificación.');
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Error al crear la asignación');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;

    try {
      await fetch(`http://localhost:5000/api/assignments/${id}`, {
        method: 'DELETE',
      });
      await fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Error al eliminar la asignación');
    }
  };

  const handleCancel = () => {
    setFormData({
      simulation_id: '',
      student_id: '',
      course_id: '',
      max_attempts: 1,
      start_date: '',
      end_date: '',
    });
    setIsAddingNew(false);
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  const getStudentName = (studentId: string) => {
    const user = users.find((u) => u.id === studentId);
    return user ? user.name : studentId;
  };

  const getSimulationCourse = (simId: string) => {
    const sim = simulations.find((s) => s.id === simId);
    return sim ? getCourseName(sim.course_id) : 'Desconocido';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-900',
      in_progress: 'bg-blue-100 text-blue-900',
      completed: 'bg-green-100 text-green-900',
      expired: 'bg-red-100 text-red-900',
    };
    return colors[status] || 'bg-gray-100 text-gray-900';
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando asignaciones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Asignación de Simulaciones</h2>
          <p className="text-gray-600 mt-1">Asigna simulaciones a estudiantes para que las realicen</p>
        </div>
        {!isAddingNew && (
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Asignación
          </Button>
        )}
      </div>

      {/* Form para agregar */}
      {isAddingNew && (
        <Card className="p-6 border border-blue-200 bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">Nueva Asignación</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Curso</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">-- Selecciona un curso --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Simulación</label>
                <select
                  value={formData.simulation_id}
                  onChange={(e) => setFormData({ ...formData, simulation_id: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">-- Selecciona una simulación --</option>
                  {simulations.map((sim) => (
                    <option key={sim.id} value={sim.id}>
                      {getSimulationCourse(sim.id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estudiantes (Selecciona uno o varios)</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-white">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.student_id === user.id}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, student_id: user.id });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{user.name} ({user.email})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Intentos Máximos</label>
                <input
                  type="number"
                  value={formData.max_attempts}
                  onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Inicio</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Send className="w-4 h-4 mr-2" />
                Asignar Simulación
              </Button>
              <Button type="button" onClick={handleCancel} variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de asignaciones */}
      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div>
                    <h4 className="font-semibold text-lg">{getStudentName(assignment.student_id)}</h4>
                    <p className="text-sm text-gray-600">{getCourseName(assignment.course_id)}</p>
                    <div className="mt-2 flex gap-2 items-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(assignment.status)}`}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {assignment.attempts_used}/{assignment.max_attempts} intentos
                      </span>
                    </div>
                  </div>
                </div>

                {assignment.start_date || assignment.end_date ? (
                  <div className="mt-2 text-xs text-gray-500">
                    {assignment.start_date && <p>Inicio: {new Date(assignment.start_date).toLocaleDateString()}</p>}
                    {assignment.end_date && <p>Vencimiento: {new Date(assignment.end_date).toLocaleDateString()}</p>}
                  </div>
                ) : null}

                <p className="text-xs text-gray-400 mt-2">
                  Asignado: {new Date(assignment.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  onClick={() => handleDelete(assignment.id)}
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

      {assignments.length === 0 && !isAddingNew && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No hay asignaciones. Crea una nueva asignación para empezar.</p>
        </Card>
      )}
    </div>
  );
}
