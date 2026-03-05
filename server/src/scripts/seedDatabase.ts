import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Course } from '../models/Course.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../data');

async function seedCourses() {
  try {
    console.log('Conectando a MongoDB...');
    await connectDatabase();

    console.log('Limpiando colección de cursos existentes...');
    await Course.deleteMany({});

    const courseFiles = fs.readdirSync(dataDir).filter((f) => f.startsWith('course-') && f.endsWith('.json'));

    for (const file of courseFiles) {
      const filePath = path.join(dataDir, file);
      const courseData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      console.log(`Insertando curso: ${courseData.course_id} - ${courseData.title}`);

      const course = new Course(courseData);
      await course.save();
    }

    console.log(`✓ ${courseFiles.length} cursos insertados exitosamente`);
    await disconnectDatabase();
  } catch (error) {
    console.error('Error en seeding:', error);
    process.exit(1);
  }
}

seedCourses();
