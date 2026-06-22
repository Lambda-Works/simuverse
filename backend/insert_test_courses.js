import mysql from 'mysql2/promise';
import crypto from 'crypto';

const generateId = () => crypto.randomUUID();

const testCourses = [
  {
    title: 'Administración de Recursos Humanos',
    description: 'Simulación integral de procesos de gestión humana',
    category: 'rrhh',
    modules: JSON.stringify(['chat_ia', 'email_simulado', 'documentos', 'hoja_calculo']),
    is_active: 1
  },
  {
    title: 'Gestión Contable Integrada',
    description: 'Simulación de procesos contables y financieros',
    category: 'contable',
    modules: JSON.stringify(['chat_ia', 'hoja_calculo', 'documentos']),
    is_active: 1
  },
  {
    title: 'Asesoría Legal Corporativa',
    description: 'Simulación de casos legales y asesoría corporativa',
    category: 'legal',
    modules: JSON.stringify(['chat_ia', 'email_simulado', 'documentos']),
    is_active: 1
  },
  {
    title: 'Estrategia de Ventas',
    description: 'Simulación de negociaciones y gestión de ventas',
    category: 'ventas',
    modules: JSON.stringify(['chat_ia', 'email_simulado', 'hoja_calculo']),
    is_active: 1
  },
  {
    title: 'Administración General',
    description: 'Simulación de procesos administrativos generales',
    category: 'administracion',
    modules: JSON.stringify(['chat_ia', 'documentos', 'hoja_calculo', 'email_simulado']),
    is_active: 1
  },
  {
    title: 'Formación General',
    description: 'Simulación de competencias generales y blandas',
    category: 'general',
    modules: JSON.stringify(['chat_ia', 'email_simulado', 'documentos']),
    is_active: 1
  }
];

async function insertTestCourses() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'simuverse',
      password: 'CHANGE_ME_PASSWORD',
      database: 'simuverse'
    });

    for (const course of testCourses) {
      try {
        const id = generateId();
        const courseId = `COURSE-${course.category.toUpperCase()}-${Date.now()}`;
        await connection.execute(
          `INSERT INTO courses (id, course_id, title, description, category, modules, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, courseId, course.title, course.description, course.category, course.modules, course.is_active]
        );
        console.log(`✅ Inserted: ${course.title}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Already exists: ${course.title}`);
        } else {
          console.error(`❌ Error inserting ${course.title}:`, err.message);
        }
      }
    }

    // Verify
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM courses');
    console.log(`\n✅ Total courses in database: ${rows[0].count}`);

    // Show all courses
    const [allCourses] = await connection.execute('SELECT id, title, category FROM courses ORDER BY category');
    console.log('\n📚 All Courses:');
    allCourses.forEach(course => {
      console.log(`  - [${course.category.toUpperCase()}] ${course.title}`);
    });

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

insertTestCourses();
