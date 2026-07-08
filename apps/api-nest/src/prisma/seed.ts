import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de roles y funcionalidades...');

  // Roles
  const rolesData = [
    { name: 'admin', description: 'Administrador del sistema', color: '#EF4444' },
    { name: 'teacher', description: 'Profesor o Docente', color: '#3B82F6' },
    { name: 'student', description: 'Alumno', color: '#10B981' },
    { name: 'ministerio', description: 'Auditor del Ministerio', color: '#8B5CF6' },
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { id: rolesData.indexOf(r) + 1 }, // Simple ID logic for seed
      update: r,
      create: { id: rolesData.indexOf(r) + 1, ...r },
    });
  }
  console.log('✅ Roles creados');

  // System Functionalities
  const functionalitiesData = [
    { name: 'Gestión de Usuarios', description: 'Permite administrar usuarios', module: 'Usuarios', route: '/admin/users' },
    { name: 'Configuración de Roles', description: 'Permite configurar roles y permisos', module: 'Seguridad', route: '/admin/roles' },
    { name: 'Gestión de Cursos', description: 'Creación y edición de cursos', module: 'Académico', route: '/admin/courses' },
    { name: 'Reportes', description: 'Ver reportes del sistema', module: 'Reportes', route: '/admin/reports' },
  ];

  for (const f of functionalitiesData) {
    await prisma.systemFunctionality.upsert({
      where: { id: functionalitiesData.indexOf(f) + 1 },
      update: f,
      create: { id: functionalitiesData.indexOf(f) + 1, ...f },
    });
  }
  console.log('✅ Funcionalidades creados');

  // Asignar permisos básicos (Admin tiene todo habilitado)
  const allRoles = await prisma.role.findMany();
  const allFuncs = await prisma.systemFunctionality.findMany();
  
  for (const role of allRoles) {
    for (const func of allFuncs) {
      await prisma.rolePermission.upsert({
        where: { role_name_functionality_id: { role_name: role.name, functionality_id: func.id } },
        update: { enabled: role.name === 'admin' }, // admin tiene true, otros false por ahora
        create: { role_name: role.name, functionality_id: func.id, enabled: role.name === 'admin' },
      });
    }
  }
  console.log('✅ Permisos básicos asignados');

  console.log('🌱 Iniciando seed de usuarios...');

  // Contraseña por defecto para todos los usuarios
  const defaultPassword = await bcrypt.hash('Admin123!', 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@simuverse.edu' },
    update: {},
    create: {
      id: 'admin-001',
      email: 'admin@simuverse.edu',
      name: 'Administrador SimuVerse',
      password_hash: defaultPassword,
      role: 'admin',
    },
  });
  console.log('✅ Admin creado:', admin.email);

  // Profesores
  const teacher1 = await prisma.user.upsert({
    where: { email: 'garcia@simuverse.edu' },
    update: {},
    create: {
      id: 'prof-001',
      email: 'garcia@simuverse.edu',
      name: 'Prof. García',
      password_hash: defaultPassword,
      role: 'teacher',
    },
  });
  console.log('✅ Profesor 1 creado:', teacher1.email);

  const teacher2 = await prisma.user.upsert({
    where: { email: 'martinez@simuverse.edu' },
    update: {},
    create: {
      id: 'prof-002',
      email: 'martinez@simuverse.edu',
      name: 'Prof. Martínez',
      password_hash: defaultPassword,
      role: 'teacher',
    },
  });
  console.log('✅ Profesor 2 creado:', teacher2.email);

  // Estudiantes
  const student1 = await prisma.user.upsert({
    where: { email: 'juan.perez@student.edu' },
    update: {},
    create: {
      id: 'stud-001',
      email: 'juan.perez@student.edu',
      name: 'Juan Pérez',
      password_hash: defaultPassword,
      role: 'student',
    },
  });
  console.log('✅ Estudiante 1 creado:', student1.email);

  const student2 = await prisma.user.upsert({
    where: { email: 'maria.lopez@student.edu' },
    update: {},
    create: {
      id: 'stud-002',
      email: 'maria.lopez@student.edu',
      name: 'María López',
      password_hash: defaultPassword,
      role: 'student',
    },
  });
  console.log('✅ Estudiante 2 creado:', student2.email);

  const student3 = await prisma.user.upsert({
    where: { email: 'carlos.soto@student.edu' },
    update: {},
    create: {
      id: 'stud-003',
      email: 'carlos.soto@student.edu',
      name: 'Carlos Soto',
      password_hash: defaultPassword,
      role: 'student',
    },
  });
  console.log('✅ Estudiante 3 creado:', student3.email);

  // Auditor del Ministerio
  const ministerio = await prisma.user.upsert({
    where: { email: 'control@ministerio.gob' },
    update: {},
    create: {
      id: 'min-001',
      email: 'control@ministerio.gob',
      name: 'Control Ministerio',
      password_hash: defaultPassword,
      role: 'ministerio',
    },
  });
  console.log('✅ Auditor Ministerio creado:', ministerio.email);

  console.log('✅ Auditor Ministerio creado:', ministerio.email);

  console.log('\n🌱 Creando Circuito Ofimática...');

  // 1. Crear Curso Ofimática
  const ofimaticaCourse = await prisma.course.upsert({
    where: { course_id: 'ofimatica-001' },
    update: {},
    create: {
      course_id: 'ofimatica-001',
      title: 'Ofimática Básica y Administración',
      description: 'Curso introductorio de herramientas de oficina (Word, Excel, Email) y gestión administrativa básica.',
      category: 'administracion',
      is_active: true,
      modules: ['Excel', 'Word', 'Email'],
    }
  });
  console.log('✅ Curso Ofimática creado:', ofimaticaCourse.id);

  // 2. Crear Escenario
  let ofimaticaScenario = await prisma.scenario.findFirst({
    where: { course_id: ofimaticaCourse.id }
  });
  if (!ofimaticaScenario) {
    ofimaticaScenario = await prisma.scenario.create({
      data: {
        course_id: ofimaticaCourse.id,
        title: 'Administración familiar: Las Tradiciones',
        difficulty: 'medium',
        content: {
          context: 'Trabajas en "Las Tradiciones", una pequeña empresa familiar. Tu jefe necesita urgente el balance mensual en Excel y que respondas algunos correos de proveedores atrasados.',
        },
        expected_outcomes: {
          main_objective: 'Resolver correos atrasados, corregir errores en el Excel de balance, y enviar el informe a tiempo.',
        }
      }
    });
  }
  console.log('✅ Escenario Ofimática creado:', ofimaticaScenario.id);

  // 3. Asignar el curso a los 3 estudiantes
  const { v4: uuidv4 } = require('uuid');
  for (const student of [student1, student2, student3]) {
    const existingAssignment = await prisma.simulationAssignment.findFirst({
      where: {
        course_id: ofimaticaCourse.id,
        student_id: student.id,
      }
    });
    if (!existingAssignment) {
      await prisma.simulationAssignment.create({
        data: {
          simulation_id: uuidv4(),
          course_id: ofimaticaCourse.id,
          student_id: student.id,
          assigned_by: admin.id,
          status: 'pending',
        }
      });
    }
  }
  console.log('✅ Curso asignado a los 3 estudiantes');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Email: admin@simuverse.edu | Password: Admin123!');
  console.log('   Email: garcia@simuverse.edu | Password: Admin123!');
  console.log('   Email: martinez@simuverse.edu | Password: Admin123!');
  console.log('   Email: juan.perez@student.edu | Password: Admin123!');
  console.log('   Email: maria.lopez@student.edu | Password: Admin123!');
  console.log('   Email: carlos.soto@student.edu | Password: Admin123!');
  console.log('   Email: control@ministerio.gob | Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
