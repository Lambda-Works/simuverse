import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './database/connection.js';
import { createAuthRoutes } from './routes/AuthMiddleware.js';
import coursesRouter from './routes/courses.js';
import simulationsRouter from './routes/simulations.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ 
  origin: FRONTEND_URL,
  credentials: true 
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
      console.log(`✓ Frontend: ${FRONTEND_URL}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

start();

export default app;


