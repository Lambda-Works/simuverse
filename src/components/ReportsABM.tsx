import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart3, Download, Filter } from 'lucide-react';

interface Evaluation {
  id: number;
  student_id: string;
  simulation_id: string;
  attempt_number: number;
  kpi_results: any;
  overall_score: number;
  overall_feedback: string;
  completion_percentage: number;
  time_spent_seconds: number;
  evaluated_at: string;
  student_name?: string;
  course_title?: string;
}

interface Course {
  id: string;
  title: string;
}

export function ReportsABM() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');

  useEffect(() => {
    Promise.all([fetchEvaluations(), fetchCourses()]).then(() => setLoading(false));
  }, []);

  const fetchEvaluations = async () => {
    try {
      // Get evaluations by course
      const response = await fetch('http://localhost:5000/api/evaluations/student/all');
      const data = await response.json();
      setEvaluations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      setEvaluations([]);
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

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  const filteredEvaluations = evaluations.filter((e) => {
    if (filterCourse !== 'all' && e.course_title !== filterCourse) return false;
    if (filterStudent !== 'all' && e.student_id !== filterStudent) return false;
    return true;
  });

  const uniqueStudents = [...new Set(evaluations.map((e) => e.student_id))];
  const uniqueCourses = [...new Set(evaluations.map((e) => e.course_title))];

  // Calculate statistics
  const courseStats = courses.map((course) => {
    const courseEvals = evaluations.filter((e) => e.course_title === course.title);
    const avgScore = courseEvals.length > 0 
      ? (courseEvals.reduce((sum, e) => sum + (e.overall_score || 0), 0) / courseEvals.length).toFixed(2)
      : 0;
    return {
      id: course.id,
      title: course.title,
      total_students: [...new Set(courseEvals.map((e) => e.student_id))].length,
      total_evaluations: courseEvals.length,
      average_score: avgScore,
    };
  });

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-900';
    if (score >= 70) return 'bg-yellow-100 text-yellow-900';
    if (score >= 60) return 'bg-orange-100 text-orange-900';
    return 'bg-red-100 text-red-900';
  };

  const handleExportCSV = () => {
    const headers = ['Estudiante', 'Curso', 'Calificación', 'Completitud %', 'Tiempo (min)', 'Fecha'];
    const rows = filteredEvaluations.map((e) => [
      e.student_name || e.student_id,
      e.course_title || 'Desconocido',
      e.overall_score?.toFixed(2) || '0',
      e.completion_percentage || '0',
      Math.floor((e.time_spent_seconds || 0) / 60),
      new Date(e.evaluated_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_simulaciones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando reportes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
          <p className="text-gray-600 mt-1">Visualiza el desempeño de estudiantes y cursos</p>
        </div>
        <Button
          onClick={handleExportCSV}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Resumen por curso */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Resumen por Curso
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseStats.map((stat) => (
            <Card key={stat.id} className="p-4">
              <h4 className="font-semibold text-sm">{stat.title}</h4>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estudiantes:</span>
                  <span className="font-semibold">{stat.total_students}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Simulaciones:</span>
                  <span className="font-semibold">{stat.total_evaluations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calificación Promedio:</span>
                  <span className={`font-semibold px-2 py-1 rounded ${getScoreBgColor(parseFloat(stat.average_score as any))}`}>
                    {stat.average_score}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold">Filtrar por:</span>
          </div>

          <div className="flex-1 min-w-48">
            <label className="text-xs text-gray-600">Curso</label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="all">Todos los cursos</option>
              {uniqueCourses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label className="text-xs text-gray-600">Estudiante</label>
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="all">Todos los estudiantes</option>
              {uniqueStudents.map((student) => (
                <option key={student} value={student}>
                  {student}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla de evaluaciones */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Detalle de Evaluaciones ({filteredEvaluations.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2">
              <tr>
                <th className="px-4 py-2 text-left">Estudiante</th>
                <th className="px-4 py-2 text-left">Curso</th>
                <th className="px-4 py-2 text-center">Calificación</th>
                <th className="px-4 py-2 text-center">Completitud %</th>
                <th className="px-4 py-2 text-center">Tiempo</th>
                <th className="px-4 py-2 text-left">Feedback</th>
                <th className="px-4 py-2 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvaluations.length > 0 ? (
                filteredEvaluations.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{e.student_name || e.student_id}</td>
                    <td className="px-4 py-3">{e.course_title || 'Desconocido'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded font-semibold ${getScoreBgColor(e.overall_score || 0)}`}>
                        {e.overall_score?.toFixed(1) || '0'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold">{e.completion_percentage || 0}%</span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {Math.floor((e.time_spent_seconds || 0) / 60)} min
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                      {e.overall_feedback || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(e.evaluated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay evaluaciones que coincidan con los filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {evaluations.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No hay evaluaciones registradas. Los datos aparecerán aquí cuando los estudiantes completen simulaciones.</p>
        </Card>
      )}
    </div>
  );
}
