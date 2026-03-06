/**
 * Database configuration is now handled by TypeORM in database/connection.ts
 * This file is kept for legacy reference only.
 */

// TypeORM configuration is in src/database/connection.ts
// MySQL/MariaDB connection details:
// - Host: localhost (configurable via DB_HOST env var)
// - Port: 3306 (configurable via DB_PORT env var)
// - Database: msm_fepei
// - User: root (configurable via DB_USER env var)
// - Password: (from DB_PASSWORD env var)

export const config = {
  type: 'mysql' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'msm_fepei',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

