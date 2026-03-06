import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User.js';
import { Course } from '../entities/Course.js';
import { Simulation } from '../entities/Simulation.js';
import { Module } from '../entities/Module.js';
import { CourseModule } from '../entities/CourseModule.js';
import { TelemetryLog } from '../entities/TelemetryLog.js';
import { Assessment } from '../entities/Assessment.js';
import { CourseConfig } from '../entities/CourseConfig.js';
import { Scenario } from '../entities/Scenario.js';
import { SimulationInstance } from '../entities/SimulationInstance.js';
import { PracticeLogs } from '../entities/PracticeLogs.js';
import { MinistryRequirement } from '../entities/MinistryRequirement.js';
import { KPI } from '../entities/KPI.js';
import { Task } from '../entities/Task.js';
import { Notification } from '../entities/Notification.js';
import { FileUpload } from '../entities/FileUpload.js';

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
    PracticeLogs,
    MinistryRequirement,
    KPI,
    Task,
    Notification,
    FileUpload
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

