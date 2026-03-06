/**
 * Environment configuration
 * Database connection is handled by TypeORM in database/connection.ts
 */

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'msm_fepei',
  JWT_SECRET: process.env.JWT_SECRET || 'tu-clave-super-secreta-cambiar-en-produccion-12345',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  FRONTEND_URL: process.env.CORS_ORIGIN || 'http://localhost:5173',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};
