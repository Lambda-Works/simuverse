import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
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
