import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Course } from '../entities/Course';
import { Simulation } from '../entities/Simulation';
import { Module } from '../entities/Module';
import { CourseModule } from '../entities/CourseModule';
import { TelemetryLog } from '../entities/TelemetryLog';
import { Assessment } from '../entities/Assessment';
import { CourseConfig } from '../entities/CourseConfig';
import { Scenario } from '../entities/Scenario';
import { SimulationInstance } from '../entities/SimulationInstance';
import { PracticeLogs } from '../entities/PracticeLogs';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'msm_fepei',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Course,
    Simulation,
    Module,
    CourseModule,
    TelemetryLog,
    Assessment,
    CourseConfig,
    Scenario,
    SimulationInstance,
    PracticeLogs
  ],
  migrations: ['dist/database/migrations/*.js'],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection initialized');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};
