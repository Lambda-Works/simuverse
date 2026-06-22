import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connection Pool para MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3309'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'simuverse',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
pool.getConnection().then(conn => {
  console.log('✅ MySQL connected successfully');
  conn.release();
}).catch((err) => {
  console.error('❌ MySQL connection failed:', err.message);
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// ======= AUTH ROUTES =======
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    try {
      const conn = await pool.getConnection();
      const [rows] = await conn.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      conn.release();

      if (rows.length > 0) {
        const user = rows[0];
        const token = 'demo-token-' + Date.now();

        return res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });
      }
    } catch (dbError) {
      // If DB not available, use mock user
    }

    // Mock user for demo
    const mockUser = {
      id: '1',
      email: email,
      name: 'Test User',
      role: 'student',
    };
    
    const token = 'demo-token-' + Date.now();
    
    res.json({
      token,
      user: mockUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password required' });
    }

    try {
      const conn = await pool.getConnection();
      
      try {
        await conn.execute(
          'INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)',
          [email, name, password, 'student']
        );
        conn.release();
      } catch (error) {
        conn.release();
        throw error;
      }
    } catch (dbError) {
      // If DB not available, continue
    }

    // Return registered user
    const mockUser = {
      id: Date.now().toString(),
      email: email,
      name: name,
      role: 'student',
    };
    
    const token = 'demo-token-' + Date.now();

    res.json({
      token,
      user: mockUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/auth/profile', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // For demo purposes, we'll just validate that token exists
    // In production, you'd decode and validate the JWT
    if (!token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      message: 'Profile retrieved successfully',
      token: token.substring(0, 20) + '...',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= COURSES ROUTES =======
app.get('/api/courses', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [courses] = await conn.execute('SELECT * FROM courses');
    conn.release();
    res.json(courses);
  } catch (error) {
    // Return empty array if table doesn't exist
    res.json([]);
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [courses] = await conn.execute(
      'SELECT * FROM courses WHERE id = ?',
      [req.params.id]
    );
    conn.release();
    
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(courses[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, category, modules, ai_config, eval_criteria, is_active, created_by } = req.body;
    
    // Generate UUID for course
    const id = 'course-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const course_id = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'INSERT INTO courses (id, course_id, title, description, category, modules, ai_config, eval_criteria, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        course_id,
        title,
        description || null,
        category || null,
        modules ? JSON.stringify(modules) : null,
        ai_config ? JSON.stringify(ai_config) : null,
        eval_criteria ? JSON.stringify(eval_criteria) : null,
        is_active ? 1 : 1,
        created_by || null
      ]
    );
    conn.release();

    res.json({ id: id, course_id: course_id, message: 'Course created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { title, description, category, modules, ai_config, eval_criteria, is_active } = req.body;
    
    const conn = await pool.getConnection();
    await conn.execute(
      'UPDATE courses SET title=?, description=?, category=?, modules=?, ai_config=?, eval_criteria=?, is_active=? WHERE id=?',
      [
        title || null,
        description || null,
        category || null,
        modules ? JSON.stringify(modules) : null,
        ai_config ? JSON.stringify(ai_config) : null,
        eval_criteria ? JSON.stringify(eval_criteria) : null,
        is_active ? 1 : 1,
        req.params.id
      ]
    );
    conn.release();

    res.json({ message: 'Course updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.execute('DELETE FROM courses WHERE id=?', [req.params.id]);
    conn.release();

    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= SIMULATIONS ROUTES =======
app.get('/api/simulations', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [sims] = await conn.execute('SELECT * FROM simulations ORDER BY started_at DESC');
    conn.release();
    res.json(sims);
  } catch (error) {
    // Return empty array if table doesn't exist
    res.json([]);
  }
});

app.get('/api/simulations/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [sim] = await conn.execute(
      'SELECT * FROM simulations WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    conn.release();
    if (sim.length === 0) return res.status(404).json({ error: 'Simulation not found' });
    res.json(sim[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/simulations', async (req, res) => {
  try {
    const { course_id, user_id } = req.body;
    if (!course_id || !user_id) {
      return res.status(400).json({ error: 'course_id and user_id required' });
    }
    const conn = await pool.getConnection();
    const id = crypto.randomUUID();
    await conn.execute(
      'INSERT INTO simulations (id, course_id, user_id, status) VALUES (?, ?, ?, ?)',
      [id, course_id, user_id, 'active']
    );
    conn.release();
    res.status(201).json({ id, course_id, user_id, status: 'active' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/simulations/start - Alias para iniciar simulación
app.post('/api/simulations/start', async (req, res) => {
  try {
    const { course_id, user_id } = req.body;
    if (!course_id || !user_id) {
      return res.status(400).json({ error: 'course_id and user_id required' });
    }
    const conn = await pool.getConnection();
    const id = crypto.randomUUID();
    await conn.execute(
      'INSERT INTO simulations (id, course_id, user_id, status) VALUES (?, ?, ?, ?)',
      [id, course_id, user_id, 'active']
    );
    conn.release();
    res.status(201).json({ id, course_id, user_id, status: 'active' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/courses - Todos los cursos para admin
app.get('/api/admin/courses', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [courses] = await conn.execute('SELECT * FROM courses ORDER BY created_at DESC');
    conn.release();
    res.json(courses);
  } catch (error) {
    res.json([]);
  }
});

// GET /api/simulated-companies - Empresas simuladas (mock data)
app.get('/api/simulated-companies', async (req, res) => {
  try {
    const companies = [
      { id: 1, name: 'Empresa Simulada A', short_name: 'SIM-A', industry: 'Tecnología', employees: 500 },
      { id: 2, name: 'Empresa Simulada B', short_name: 'SIM-B', industry: 'Finanzas', employees: 1200 },
      { id: 3, name: 'Empresa Simulada C', short_name: 'SIM-C', industry: 'Seguros', employees: 300 },
    ];
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/scenarios - Escenarios simulados
app.get('/api/scenarios', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [scenarios] = await conn.execute('SELECT * FROM courses WHERE is_active = 1');
    conn.release();
    res.json(scenarios);
  } catch (error) {
    res.json([]);
  }
});

// PUT /api/tech-sheets/:id/config - Configurar ficha técnica
app.put('/api/tech-sheets/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const { config, scenario, expected_outcomes } = req.body;
    const conn = await pool.getConnection();
    await conn.execute(
      'UPDATE tech_sheets SET extracted_data = ?, description = ? WHERE id = ?',
      [JSON.stringify({ config, scenario, expected_outcomes }), scenario, id]
    );
    conn.release();
    res.json({ message: 'Tech sheet configured', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/simulations/:id/logs', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [logs] = await conn.execute(
      'SELECT * FROM telemetry_logs WHERE simulation_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    conn.release();
    res.json(logs);
  } catch (error) {
    // Return empty array if table doesn't exist
    res.json([]);
  }
});

// ======= MODULE ROUTES =======
// Chat IA endpoint
app.post('/api/simulations/:id/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    
    // Simulate AI response
    const responses = [
      'Recomiendo revisar el flujo de caja antes de tomar esa decisión.',
      'Esa es una decisión estratégica importante. Considere los riesgos.',
      'Basándome en los datos, esa opción tiene 75% de probabilidad de éxito.',
      'Sugiero consultar con el equipo de operaciones primero.',
      'Esa decisión podría impactar significativamente el presupuesto Q2.'
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    res.json({ 
      role: 'ai',
      message: response,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email simulado endpoint
app.get('/api/simulations/:id/emails', async (req, res) => {
  try {
    const emails = [
      {
        id: '1',
        from: 'cliente@empresa.com',
        subject: 'Consulta sobre presupuesto',
        body: 'Buenos días, quisiera saber si es posible negociar el precio del pedido.',
        timestamp: new Date(Date.now() - 3600000),
        unread: true
      },
      {
        id: '2',
        from: 'proveedor@supply.com',
        subject: 'Confirmación de envío',
        body: 'Su pedido ha sido despachado. El número de tracking es SHP123456.',
        timestamp: new Date(Date.now() - 7200000),
        unread: true
      },
      {
        id: '3',
        from: 'jefe@empresa.com',
        subject: 'Reporte mensual',
        body: 'Por favor enviar el reporte de ventas antes del viernes.',
        timestamp: new Date(Date.now() - 86400000),
        unread: false
      }
    ];
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/simulations/:id/emails/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, body required' });
    }
    res.status(201).json({
      id: require('crypto').randomUUID(),
      to,
      subject,
      body,
      status: 'sent',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Documentos endpoint
app.get('/api/simulations/:id/documents', async (req, res) => {
  try {
    const documents = [
      {
        id: '1',
        name: 'Caso de Estudio - Negociación',
        type: 'pdf',
        content: 'CASO: You are managing a negotiation with a major client...',
        url: '#'
      },
      {
        id: '2',
        name: 'Contrato Marco',
        type: 'pdf',
        content: 'Este documento contiene los términos y condiciones estándar...',
        url: '#'
      },
      {
        id: '3',
        name: 'Políticas de Empresa',
        type: 'pdf',
        content: 'Política de Descuentos: máximo 15% para clientes premium...',
        url: '#'
      }
    ];
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Spreadsheet endpoint
app.get('/api/simulations/:id/spreadsheet', async (req, res) => {
  try {
    const spreadsheet = {
      name: 'Análisis Financiero',
      data: [
        { item: 'Ingresos', value: 100000, currency: 'USD' },
        { item: 'Gastos Operacionales', value: 45000, currency: 'USD' },
        { item: 'Costos Fijos', value: 20000, currency: 'USD' },
        { item: 'Utilidad Bruta', value: 35000, currency: 'USD' }
      ],
      formulas: {
        utilidad_bruta: 'Ingresos - Gastos Operacionales - Costos Fijos'
      }
    };
    res.json(spreadsheet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/simulations/:id/spreadsheet/calculate', async (req, res) => {
  try {
    const { values } = req.body;
    // Simple calculation example
    const result = {
      ...values,
      total: Object.values(values).reduce((a, b) => a + b, 0)
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= CATEGORIES ABM ROUTES =======
app.get('/api/categories', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [categories] = await conn.execute('SELECT * FROM categories ORDER BY name ASC');
    conn.release();
    res.json(categories);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
    
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'INSERT INTO categories (name, code, description) VALUES (?, ?, ?)',
      [name, code, description || null]
    );
    conn.release();
    
    res.status(201).json({ id: result.insertId, name, code, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const conn = await pool.getConnection();
    await conn.execute(
      'UPDATE categories SET name=?, code=?, description=? WHERE id=?',
      [name, code, description || null, req.params.id]
    );
    conn.release();
    res.json({ message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.execute('DELETE FROM categories WHERE id=?', [req.params.id]);
    conn.release();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= DOCUMENTS ABM ROUTES =======
app.get('/api/documents', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [docs] = await conn.execute('SELECT * FROM course_documents ORDER BY created_at DESC');
    conn.release();
    res.json(docs);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/documents/course/:courseId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [docs] = await conn.execute(
      'SELECT * FROM course_documents WHERE course_id=? ORDER BY created_at DESC',
      [req.params.courseId]
    );
    conn.release();
    res.json(docs);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const { course_id, document_name, document_type, document_content, file_url, uploaded_by } = req.body;
    if (!course_id || !document_name) return res.status(400).json({ error: 'course_id and document_name required' });
    
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'INSERT INTO course_documents (course_id, document_name, document_type, document_content, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [course_id, document_name, document_type || 'other', document_content || null, file_url || null, uploaded_by || null]
    );
    conn.release();
    
    res.status(201).json({ id: result.insertId, course_id, document_name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.execute('DELETE FROM course_documents WHERE id=?', [req.params.id]);
    conn.release();
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= TECH SHEETS ABM ROUTES =======
app.get('/api/tech-sheets', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [sheets] = await conn.execute('SELECT * FROM tech_sheets ORDER BY created_at DESC');
    conn.release();
    res.json(sheets);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/tech-sheets', async (req, res) => {
  try {
    // Aceptar tanto JSON como FormData
    let name, ministry_code, description, file_url, uploaded_by;
    
    // Si es JSON (Content-Type: application/json)
    if (req.is('json')) {
      ({ name, ministry_code, description, file_url, uploaded_by } = req.body);
    } else {
      // Si es FormData (multipart/form-data)
      name = req.body.name;
      ministry_code = req.body.ministry_code;
      description = req.body.description;
      file_url = req.body.file_url;
      uploaded_by = req.body.uploaded_by;
    }
    
    // Validación: name es obligatorio
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name required' });
    }
    
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'INSERT INTO tech_sheets (name, ministry_code, description, file_url, uploaded_by, processed) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), ministry_code || null, description || null, file_url || null, uploaded_by || null, 0]
    );
    conn.release();
    
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      ministry_code,
      message: 'Tech sheet uploaded. Processing will begin shortly.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze tech sheet with AI (mock implementation)
app.post('/api/tech-sheets/:id/analyze', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Get tech sheet
    const [sheets] = await conn.execute('SELECT * FROM tech_sheets WHERE id=?', [req.params.id]);
    if (sheets.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Tech sheet not found' });
    }
    
    const sheet = sheets[0];
    
    // Get the actual content from request body
    const { content, file_data, description, competencies: userCompetencies, scenario } = req.body;
    
    // Real analysis - process actual uploaded content
    let extractedData = {
      competencies: [],
      kpi_requirements: [],
      context_scenario: '',
      suggested_prompt: '',
      suggested_questions: [],
      source: 'analyzed',
      analyzed_at: new Date().toISOString()
    };
    
    // Process file content if provided
    if (content || file_data) {
      const fileContent = (content || file_data || '').toString().toLowerCase();
      
      // Extract competencies from content
      const competencyKeywords = {
        'negociación': 'Negociación',
        'comunicación': 'Comunicación',
        'liderazgo': 'Liderazgo',
        'análisis': 'Análisis',
        'resolución': 'Resolución de problemas',
        'toma de decisiones': 'Toma de decisiones',
        'gestión': 'Gestión',
        'estrategia': 'Estrategia',
        'financiero': 'Análisis financiero',
        'conflictos': 'Gestión de conflictos'
      };
      
      for (const [keyword, competency] of Object.entries(competencyKeywords)) {
        if (fileContent.includes(keyword)) {
          if (!extractedData.competencies.includes(competency)) {
            extractedData.competencies.push(competency);
          }
        }
      }
      
      // If no competencies found in content, use provided ones or default
      if (extractedData.competencies.length === 0) {
        extractedData.competencies = userCompetencies || [
          'Análisis crítico',
          'Comunicación efectiva',
          'Resolución de problemas',
          'Capacidad de aprendizaje'
        ];
      }
      
      // Generate KPI requirements based on content
      extractedData.kpi_requirements = [
        { name: 'Comprensión de conceptos', weight: 0.3, threshold: 80 },
        { name: 'Aplicación práctica', weight: 0.3, threshold: 75 },
        { name: 'Análisis crítico', weight: 0.2, threshold: 70 },
        { name: 'Presentación de resultados', weight: 0.2, threshold: 75 }
      ];
      
      // Create context from description or file
      extractedData.context_scenario = scenario || description || fileContent.substring(0, 200) || 'Análisis de ficha técnica';
      
      // Generate relevant prompt
      const mainCompetency = extractedData.competencies[0] || 'tópico';
      extractedData.suggested_prompt = `Eres un especialista en ${mainCompetency}. Guía al alumno a través de este módulo con preguntas reflexivas y retroalimentación constructiva.`;
      
      // Generate questions based on competencies
      extractedData.suggested_questions = [
        `¿Cuáles son los conceptos clave en ${mainCompetency}?`,
        `¿Cómo aplicarías esto en una situación real?`,
        `¿Cuáles son los desafíos principales?`,
        `¿Qué has aprendido de este análisis?`
      ];
    } else {
      // If no content provided, use provided data or defaults
      extractedData.competencies = userCompetencies || ['Competencia genérica'];
      extractedData.context_scenario = scenario || description || 'Análisis de ficha técnica';
      extractedData.suggested_prompt = 'Ayuda al alumno a dominar este contenido con preguntas reflexivas.';
      extractedData.suggested_questions = [
        '¿Cuáles son los puntos clave?',
        '¿Cómo se aplica esto?',
        '¿Cuáles son los desafíos?',
        '¿Qué has aprendido?'
      ];
    }
    
    // Update tech sheet with REAL extracted data
    await conn.execute(
      'UPDATE tech_sheets SET extracted_data=?, competencies=?, kpi_requirements=?, description=?, processed=1, processed_at=NOW() WHERE id=?',
      [
        JSON.stringify(extractedData),
        JSON.stringify(extractedData.competencies),
        JSON.stringify(extractedData.kpi_requirements),
        extractedData.context_scenario,
        req.params.id
      ]
    );
    conn.release();
    
    res.json({
      message: 'Tech sheet analyzed successfully',
      extracted_data: extractedData,
      ready_for_simulation: true,
      competencies_found: extractedData.competencies.length,
      analysis_timestamp: extractedData.analyzed_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tech-sheets/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.execute('DELETE FROM tech_sheets WHERE id=?', [req.params.id]);
    conn.release();
    res.json({ message: 'Tech sheet deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= ASSIGNMENTS ABM ROUTES =======
app.get('/api/assignments', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [assignments] = await conn.execute('SELECT * FROM simulation_assignments ORDER BY created_at DESC');
    conn.release();
    res.json(assignments);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/assignments/student/:studentId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [assignments] = await conn.execute(
      'SELECT * FROM simulation_assignments WHERE student_id=? ORDER BY created_at DESC',
      [req.params.studentId]
    );
    conn.release();
    res.json(assignments);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const { simulation_id, student_id, course_id, assigned_by, start_date, end_date, max_attempts } = req.body;
    if (!simulation_id || !student_id || !course_id) {
      return res.status(400).json({ error: 'simulation_id, student_id, course_id required' });
    }
    
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'INSERT INTO simulation_assignments (simulation_id, student_id, course_id, assigned_by, start_date, end_date, max_attempts, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [simulation_id, student_id, course_id, assigned_by || null, start_date || null, end_date || null, max_attempts || 1, 'pending']
    );
    conn.release();
    
    res.status(201).json({
      id: result.insertId,
      simulation_id,
      student_id,
      status: 'pending',
      message: 'Assignment created. Student will be notified.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/assignments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in_progress', 'completed', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const conn = await pool.getConnection();
    await conn.execute('UPDATE simulation_assignments SET status=? WHERE id=?', [status, req.params.id]);
    conn.release();
    
    res.json({ message: 'Assignment status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.execute('DELETE FROM simulation_assignments WHERE id=?', [req.params.id]);
    conn.release();
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= EVALUATIONS / REPORTS ROUTES =======
app.get('/api/evaluations/assignment/:assignmentId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [evals] = await conn.execute(
      'SELECT * FROM simulation_evaluations WHERE assignment_id=? ORDER BY evaluated_at DESC',
      [req.params.assignmentId]
    );
    conn.release();
    res.json(evals);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/evaluations/student/:studentId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [evals] = await conn.execute(
      'SELECT * FROM simulation_evaluations WHERE student_id=? ORDER BY evaluated_at DESC',
      [req.params.studentId]
    );
    conn.release();
    res.json(evals);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/evaluations', async (req, res) => {
  try {
    const { assignment_id, student_id, simulation_id, attempt_number, kpi_results, overall_score, overall_feedback, completion_percentage, time_spent_seconds, responses } = req.body;
    if (!assignment_id || !student_id || !simulation_id) {
      return res.status(400).json({ error: 'assignment_id, student_id, simulation_id required' });
    }
    
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'INSERT INTO simulation_evaluations (assignment_id, student_id, simulation_id, attempt_number, kpi_results, overall_score, overall_feedback, completion_percentage, time_spent_seconds, responses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        assignment_id,
        student_id,
        simulation_id,
        attempt_number || 1,
        kpi_results ? JSON.stringify(kpi_results) : null,
        overall_score || null,
        overall_feedback || null,
        completion_percentage || 0,
        time_spent_seconds || 0,
        responses ? JSON.stringify(responses) : null
      ]
    );
    conn.release();
    
    res.status(201).json({
      id: result.insertId,
      message: 'Evaluation recorded',
      overall_score,
      overall_feedback
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports (dashboard data)
app.get('/api/reports/course/:courseId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Get all evaluations for course
    const [evals] = await conn.execute(`
      SELECT se.*, sa.student_id, sa.course_id, u.name as student_name
      FROM simulation_evaluations se
      JOIN simulation_assignments sa ON se.assignment_id = sa.id
      JOIN users u ON se.student_id = u.id
      WHERE sa.course_id=?
      ORDER BY se.evaluated_at DESC
    `, [req.params.courseId]);
    
    conn.release();
    
    // Aggregate data
    const report = {
      course_id: req.params.courseId,
      total_evaluations: evals.length,
      average_score: evals.length > 0 ? (evals.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evals.length).toFixed(2) : 0,
      students_evaluated: [...new Set(evals.map(e => e.student_id))].length,
      evaluations: evals
    };
    
    res.json(report);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/api/reports/student/:studentId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Get all evaluations for student
    const [evals] = await conn.execute(`
      SELECT se.*, sa.course_id, c.title as course_title
      FROM simulation_evaluations se
      JOIN simulation_assignments sa ON se.assignment_id = sa.id
      JOIN courses c ON sa.course_id = c.id
      WHERE se.student_id=?
      ORDER BY se.evaluated_at DESC
    `, [req.params.studentId]);
    
    conn.release();
    
    // Aggregate data
    const report = {
      student_id: req.params.studentId,
      total_simulations: evals.length,
      average_score: evals.length > 0 ? (evals.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evals.length).toFixed(2) : 0,
      courses_completed: [...new Set(evals.map(e => e.course_id))].length,
      evaluations: evals
    };
    
    res.json(report);
  } catch (error) {
    res.json({ error: error.message });
  }
});

// ======= ADMIN ROUTES =======
app.get('/api/admin/teacher-permissions', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Get teacher permissions grouped by user and role
    const query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.name,
        GROUP_CONCAT(DISTINCT r.id) as role_ids,
        GROUP_CONCAT(DISTINCT r.role_name) as role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE r.role_type IN ('teacher', 'admin') OR r.id IS NULL
      GROUP BY u.id, u.email, u.name
      ORDER BY u.name ASC
    `;
    
    const [rows] = await conn.query(query);
    conn.release();
    
    res.json({
      success: true,
      data: rows || [],
      total: (rows || []).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/teacher-permissions', async (req, res) => {
  try {
    const { userId, roleId, permissions } = req.body;
    
    if (!userId || !roleId) {
      return res.status(400).json({ error: 'userId and roleId are required' });
    }
    
    const conn = await pool.getConnection();
    
    try {
      // 1. Check if user exists
      const [userCheck] = await conn.query(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      
      if (userCheck.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // 2. Check if role exists
      const [roleCheck] = await conn.query(
        'SELECT id FROM roles WHERE id = ?',
        [roleId]
      );
      
      if (roleCheck.length === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      // 3. Update or insert user role
      const [existing] = await conn.query(
        'SELECT id FROM user_roles WHERE user_id = ?',
        [userId]
      );
      
      if (existing.length > 0) {
        await conn.query(
          'UPDATE user_roles SET role_id = ? WHERE user_id = ?',
          [roleId, userId]
        );
      } else {
        await conn.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleId]
        );
      }
      
      conn.release();
      res.json({ 
        success: true, 
        message: 'Teacher permissions updated successfully' 
      });
    } catch (error) {
      conn.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= TECH-SHEETS ROUTES (EXTENDED) =======
app.get('/api/tech-sheets/valid/list', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Get valid and active tech-sheets
    const query = `
      SELECT id, title, description, course_id, created_at, updated_at,
             is_active, is_valid
      FROM tech_sheets
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    
    const [rows] = await conn.query(query);
    conn.release();
    
    // Filter results that have is_valid = true (handle both NULL and false)
    const validSheets = rows.filter(sheet => sheet.is_valid === true || sheet.is_valid === 1);
    
    res.json({
      success: true,
      data: validSheets || [],
      total: (validSheets || []).length
    });
  } catch (error) {
    // If column doesn't exist, return all active sheets
    try {
      const conn = await pool.getConnection();
      const [rows] = await conn.query('SELECT * FROM tech_sheets WHERE is_active = true');
      conn.release();
      
      res.json({
        success: true,
        data: rows || [],
        total: (rows || []).length
      });
    } catch (fallbackError) {
      res.json({ success: false, data: [], total: 0 });
    }
  }
});

// ======= TEMPLATES ROUTES (EXTENDED) =======
app.post('/api/templates/bulk-import', async (req, res) => {
  try {
    const { templates } = req.body;
    
    if (!Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({ error: 'Templates array is required and must not be empty' });
    }
    
    const conn = await pool.getConnection();
    const results = [];
    
    try {
      for (const template of templates) {
        if (!template.name || !template.content) {
          throw new Error('Each template must have name and content');
        }
        
        const query = `
          INSERT INTO templates (name, content, category, is_active, created_at)
          VALUES (?, ?, ?, true, NOW())
        `;
        
        const [result] = await conn.query(query, [
          template.name,
          template.content,
          template.category || 'general'
        ]);
        
        results.push({
          id: result.insertId,
          name: template.name,
          category: template.category || 'general'
        });
      }
      
      conn.release();
      res.json({
        success: true,
        message: `${results.length} template(s) imported successfully`,
        data: results
      });
    } catch (error) {
      conn.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/templates/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    try {
      // 1. Get original template
      const [original] = await conn.query(
        'SELECT * FROM templates WHERE id = ?',
        [id]
      );
      
      if (original.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const template = original[0];
      
      // 2. Create a duplicate
      const newName = `${template.name} (Copy)`;
      const [result] = await conn.query(
        'INSERT INTO templates (name, content, category, is_active, created_at) VALUES (?, ?, ?, ?, NOW())',
        [newName, template.content, template.category, template.is_active]
      );
      
      conn.release();
      res.json({
        success: true,
        id: result.insertId,
        name: newName,
        message: 'Template duplicated successfully'
      });
    } catch (error) {
      conn.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======= DEFAULT ROUTE =======
app.get('/', (req, res) => {
  res.json({ message: 'SimuVerse API v3.0 - Full ABM System', status: 'running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
