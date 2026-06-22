import 'reflect-metadata';
import { AppDataSource, initializeDatabase } from '../database/connection';
import { User, UserRole } from '../entities/User';
import { Course } from '../entities/Course';
import { Module, ModuleType } from '../entities/Module';
import { CourseModule } from '../entities/CourseModule';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const COURSES_DIR = path.join(process.cwd(), 'data');

async function seedDatabase() {
  try {
    await initializeDatabase();

    console.log('📚 Starting database seeding...');

    // Create repositories
    const userRepo = AppDataSource.getRepository(User);
    const courseRepo = AppDataSource.getRepository(Course);
    const moduleRepo = AppDataSource.getRepository(Module);
    const courseModuleRepo = AppDataSource.getRepository(CourseModule);

    // 1. Create default users
    console.log('👥 Creating default users...');

    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    const teacherPassword = await bcrypt.hash('TeacherPassword123!', 10);
    const studentPassword = await bcrypt.hash('StudentPassword123!', 10);

    const adminUser = userRepo.create({
      email: 'admin@msm-fepei.com',
      password: adminPassword,
      name: 'Administrator',
      role: UserRole.ADMIN
    });

    const teacherUser = userRepo.create({
      email: 'teacher@msm-fepei.com',
      password: teacherPassword,
      name: 'Teacher User',
      role: UserRole.TEACHER
    });

    const studentUser = userRepo.create({
      email: 'student@msm-fepei.com',
      password: studentPassword,
      name: 'Student User',
      role: UserRole.STUDENT
    });

    const existingAdmin = await userRepo.findOne({ where: { email: 'admin@msm-fepei.com' } });
    const existingTeacher = await userRepo.findOne({
      where: { email: 'teacher@msm-fepei.com' }
    });
    const existingStudent = await userRepo.findOne({
      where: { email: 'student@msm-fepei.com' }
    });

    if (!existingAdmin) {
      await userRepo.save(adminUser);
      console.log('  ✓ Admin user created');
    } else {
      console.log('  ✓ Admin user already exists');
    }

    if (!existingTeacher) {
      await userRepo.save(teacherUser);
      console.log('  ✓ Teacher user created');
    } else {
      console.log('  ✓ Teacher user already exists');
    }

    if (!existingStudent) {
      await userRepo.save(studentUser);
      console.log('  ✓ Student user created');
    } else {
      console.log('  ✓ Student user already exists');
    }

    // 2. Create modules
    console.log('🔧 Creating modules...');

    const communicationModule = moduleRepo.create({
      name: 'Communication Module',
      type: ModuleType.COMMUNICATION,
      config: {
        description: 'Chat interface for simulations',
        enabled_features: ['chat', 'ai_responses', 'message_history'],
        ui_layout: 'split_view',
        customization: {}
      }
    });

    const toolsModule = moduleRepo.create({
      name: 'Tools Module',
      type: ModuleType.TOOLS,
      config: {
        description: 'Tools for calculations and code execution',
        enabled_features: ['calculator', 'code_editor', 'file_manager'],
        ui_layout: 'tabbed',
        customization: {}
      }
    });

    const documentationModule = moduleRepo.create({
      name: 'Documentation Module',
      type: ModuleType.DOCUMENTATION,
      config: {
        description: 'Document and file management',
        enabled_features: ['file_manager', 'text_editor', 'viewer'],
        ui_layout: 'sidebar',
        customization: {}
      }
    });

    const assessmentModule = moduleRepo.create({
      name: 'Assessment Module',
      type: ModuleType.ASSESSMENT,
      config: {
        description: 'Performance evaluation and reporting',
        enabled_features: ['kpi_evaluation', 'reporting', 'feedback'],
        ui_layout: 'dashboard',
        customization: {}
      }
    });

    const existingComm = await moduleRepo.findOne({ where: { name: 'Communication Module' } });
    const existingTools = await moduleRepo.findOne({ where: { name: 'Tools Module' } });
    const existingDoc = await moduleRepo.findOne({ where: { name: 'Documentation Module' } });
    const existingAssess = await moduleRepo.findOne({ where: { name: 'Assessment Module' } });

    if (!existingComm) await moduleRepo.save(communicationModule);
    if (!existingTools) await moduleRepo.save(toolsModule);
    if (!existingDoc) await moduleRepo.save(documentationModule);
    if (!existingAssess) await moduleRepo.save(assessmentModule);

    console.log('  ✓ All modules created or already exist');

    // 3. Load and seed courses
    console.log('📖 Seeding courses...');

    const courseFiles = [
      'course-ADM3534-Seguros.json',
      'course-ADM5536-Sueldos.json',
      'course-INF28517B-IA.json',
      'course-RH3657-Oratoria.json'
    ];

    const modules = await moduleRepo.find();

    for (const courseFile of courseFiles) {
      const coursePath = path.join(COURSES_DIR, courseFile);

      if (fs.existsSync(coursePath)) {
        const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));

        const existingCourse = await courseRepo.findOne({
          where: { course_id: courseData.course_id }
        });

        if (!existingCourse) {
          const course = courseRepo.create({
            course_id: courseData.course_id,
            title: courseData.title,
            description: courseData.description,
            category: courseData.category || courseData.family,
            is_active: true,
            ai_config: courseData.ai_config,
            eval_criteria: courseData.eval_criteria,
            crisis_events: courseData.crisis_events
          });

          const savedCourse = await courseRepo.save(course);

          // Link modules to course
          for (let i = 0; i < modules.length; i++) {
            const courseModule = courseModuleRepo.create({
              course_id: savedCourse.id,
              module_id: modules[i].id,
              order: i
            });

            await courseModuleRepo.save(courseModule);
          }

          console.log(`  ✓ Course "${courseData.title}" seeded`);
        } else {
          console.log(`  ✓ Course "${courseData.title}" already exists`);
        }
      } else {
        console.log(`  ⚠️  Course file not found: ${courseFile}`);
      }
    }
    console.log('');
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('Default credentials:');
    console.log('  Admin:   admin@msm-fepei.com / AdminPassword123!');
    console.log('  Teacher: teacher@msm-fepei.com / TeacherPassword123!');
    console.log('  Student: student@msm-fepei.com / StudentPassword123!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();