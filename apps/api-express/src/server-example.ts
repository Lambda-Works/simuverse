/**
 * MSM FEPEI 360 - TypeORM + MySQL Migration Guide
 * 
 * Este documento explica cómo actualizar el server.ts existente
 * para usar TypeORM + MySQL en lugar de MongoDB
 */

import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase, AppDataSource } from './database/connection';
import { createAuthRoutes } from './routes/AuthMiddleware';
import { authMiddleware } from './middleware/AuthMiddleware';
import {
  promptInjectionFilter,
  rateLimitMiddleware,
  integrityChecker,
  auditLoggingMiddleware
} from './middleware/security';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
let isDbInitialized = false;

const initDb = async (req: Request, res: Response, next: NextFunction) => {
  if (!isDbInitialized) {
    try {
      await initializeDatabase();
      isDbInitialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }
  next();
};

app.use(initDb);

// Security middleware
app.use(rateLimitMiddleware);
app.use(promptInjectionFilter);
app.use(integrityChecker);
app.use(auditLoggingMiddleware);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isDbInitialized ? 'connected' : 'connecting'
  });
});

// API Routes
app.use('/api/auth', createAuthRoutes());

// Protected example routes (add your other routes here)
app.get('/api/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const UserRepository = AppDataSource.getRepository('User');
    const user = await UserRepository.findOne({ where: { id: req.user.userId } } as any);

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 MSM FEPEI 360 - Server started');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log('');
      console.log('Endpoints:');
      console.log('  POST   /api/auth/register - Register new user');
      console.log('  POST   /api/auth/login    - Login user');
      console.log('  POST   /api/auth/refresh  - Refresh token');
      console.log('  GET    /api/auth/me       - Get current user');
      console.log('  GET    /health            - Health check');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
