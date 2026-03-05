import express, { Request, Response } from 'express';
import cors from 'express-cors';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { promptInjectionFilter, rateLimitMiddleware, auditLoggingMiddleware } from './middleware/security.js';

// Import routes
import coursesRouter from './routes/courses.js';
import simulationsRouter from './routes/simulations.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(auditLoggingMiddleware);
app.use(rateLimitMiddleware);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/courses', coursesRouter);
app.use('/api/simulations', simulationsRouter);

// Error handling
app.use((err: any, req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Declare requestTime on Request type
declare global {
  namespace Express {
    interface Request {
      requestTime?: number;
    }
  }
}

// Start server
const start = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    app.listen(env.PORT, () => {
      console.log(`\n✓ Servidor MSM iniciado en puerto ${env.PORT}`);
      console.log(`✓ Entorno: ${env.NODE_ENV}`);
      console.log(`✓ Database: ${env.MONGODB_URI}`);
      console.log(`✓ URL del frontend: ${env.FRONTEND_URL}\n`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
};

start();

export default app;
