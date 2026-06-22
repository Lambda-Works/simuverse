import 'reflect-metadata';
import { AppDataSource } from '../database/connection';
import { User, UserRole } from '../entities/User';

async function seedExampleData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a base de datos SIMUVERSE');

    const userRepo = AppDataSource.getRepository(User);

    // ============================================================
    // 1. CREAR USUARIOS DE EJEMPLO
    // ============================================================
    console.log('\n📝 Creando usuarios de ejemplo...');

    // Verificar si los usuarios ya existen
    const existingAdmin = await userRepo.findOne({
      where: { email: 'admin-demo@simuverse.edu' },
    });
    const existingTeacher = await userRepo.findOne({
      where: { email: 'profesor-demo@simuverse.edu' },
    });
    const existingMinistry = await userRepo.findOne({
      where: { email: 'ministerio-demo@simuverse.edu' },
    });
    const existingStudent = await userRepo.findOne({
      where: { email: 'alumno-demo@simuverse.edu' },
    });

    let admin = existingAdmin;
    if (!admin) {
      admin = userRepo.create({
        email: 'admin-demo@simuverse.edu',
        password: 'Admin123!Demo',
        name: 'Admin Demo Sistema',
        role: UserRole.ADMIN,
      });
      await userRepo.save(admin);
      console.log('  ✅ Admin: admin-demo@simuverse.edu');
    } else {
      console.log('  ℹ️  Admin ya existe');
    }

    let teacher = existingTeacher;
    if (!teacher) {
      teacher = userRepo.create({
        email: 'profesor-demo@simuverse.edu',
        password: 'Prof123!Demo',
        name: 'Dr. José García (Demo)',
        role: UserRole.TEACHER,
      });
      await userRepo.save(teacher);
      console.log('  ✅ Profesor: profesor-demo@simuverse.edu');
    } else {
      console.log('  ℹ️  Profesor ya existe');
    }

    let ministry = existingMinistry;
    if (!ministry) {
      ministry = userRepo.create({
        email: 'ministerio-demo@simuverse.edu',
        password: 'Min123!Demo',
        name: 'Representante Ministerio (Demo)',
        role: UserRole.MINISTRY,
      });
      await userRepo.save(ministry);
      console.log('  ✅ Ministerio: ministerio-demo@simuverse.edu');
    } else {
      console.log('  ℹ️  Ministerio ya existe');
    }

    let student = existingStudent;
    if (!student) {
      student = userRepo.create({
        email: 'alumno-demo@simuverse.edu',
        password: 'Est123!Demo',
        name: 'Carlos Mendez (Demo)',
        role: UserRole.STUDENT,
      });
      await userRepo.save(student);
      console.log('  ✅ Alumno: alumno-demo@simuverse.edu');
    } else {
      console.log('  ℹ️  Alumno ya existe');
    }

    // ============================================================
    // RESUMEN
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATOS DE EJEMPLO - SIMUVERSE');
    console.log('='.repeat(60));

    console.log('\n👥 USUARIOS CREADOS:');
    console.log('  Admin:     admin-demo@simuverse.edu');
    console.log('  Profesor:  profesor-demo@simuverse.edu');
    console.log('  Ministerio: ministerio-demo@simuverse.edu');
    console.log('  Alumno:    alumno-demo@simuverse.edu');

    console.log('\n  ⚠️  NOTA: Todos tienen contraseña terminada en "Demo"');
    console.log('  (Cambiar en producción por contraseñas seguras)');

    console.log('\n📚 ESTRUCTURA EXISTENTE EN SIMUVERSE:');
    console.log('  ✅ 5 usuarios ya existen');
    console.log('  ✅ 7 cursos ya existen');
    console.log('  ✅ Escenarios, tareas y simulaciones disponibles');
    console.log('  ✅ Este script solo agrega usuarios demo adicionales');

    console.log('\n' + '='.repeat(60));

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedExampleData();
