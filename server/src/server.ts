import 'reflect-metadata';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppDataSource } from './database/connection.js';
import { createAuthRoutes } from './routes/AuthMiddleware.js';
import coursesRouter from './routes/courses.js';
import simulationsRouter from './routes/simulations.js';
import adminRouter from './routes/admin.js';
import ministryRouter from './routes/ministry.js';
import catalogRouter from './routes/catalog.js';
import templatesRouter from './routes/templates.js';
import legajoRouter from './routes/legajo.js';
import promptTemplateRouter from './routes/prompt-template.router.js';
import promptConfigRouter from './routes/prompt-config.router.js';


const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8082').split(',').map(url => url.trim());

// En desarrollo aceptamos cualquier origen localhost (evita problemas de puerto)
const corsOriginFn = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Permite requests sin origen (curl, Postman, server-to-server)
  if (!origin) return callback(null, true);
  // En desarrollo: permite cualquier localhost independientemente del puerto
  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  // En producción: solo orígenes explícitamente listados
  if (CORS_ORIGINS.includes(origin)) {
    return callback(null, true);
  }
  callback(new Error(`CORS: origen no permitido: ${origin}`));
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ 
  origin: corsOriginFn,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date(), message: 'Server is running' });
});

// API Routes
const authRoutes = createAuthRoutes();
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRouter);
app.use('/api/simulations', simulationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ministry', ministryRouter);
app.use('/api/legajo', legajoRouter);
// Catalog routes: categories, tech-sheets, documents, assignments, users, evaluations
app.use('/api', catalogRouter);
// Templates (FlowTemplates persistidos en BD)
app.use('/api/templates', templatesRouter);
// Prompt Templates & Configuration
app.use('/api/prompt-templates', promptTemplateRouter);
app.use('/api/prompt-config', promptConfigRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ 
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const start = async () => {
  try {
    // Initialize TypeORM connection
    console.log('🔄 Conectando a la base de datos...');
    await AppDataSource.initialize();
    console.log('✅ Base de datos conectada exitosamente');

    app.listen(PORT, () => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`✓ Servidor MSM iniciado en puerto ${PORT}`);
      console.log(`✓ URL: http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Orígenes CORS permitidos: ${CORS_ORIGINS.join(', ')}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

start();

export default app;


