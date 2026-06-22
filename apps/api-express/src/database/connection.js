"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Course_1 = require("../entities/Course");
const Simulation_1 = require("../entities/Simulation");
const Module_1 = require("../entities/Module");
const CourseModule_1 = require("../entities/CourseModule");
const TelemetryLog_1 = require("../entities/TelemetryLog");
const Assessment_1 = require("../entities/Assessment");
const CourseConfig_1 = require("../entities/CourseConfig");
const Scenario_1 = require("../entities/Scenario");
const SimulationInstance_1 = require("../entities/SimulationInstance");
const PracticeLogs_1 = require("../entities/PracticeLogs");
const Notification_1 = require("../entities/Notification");
const FileUpload_1 = require("../entities/FileUpload");
const MinistryRequirement_1 = require("../entities/MinistryRequirement");
const KPI_1 = require("../entities/KPI");
const Task_1 = require("../entities/Task");
const Category_1 = require("../entities/Category");
const TechSheet_1 = require("../entities/TechSheet");
const CourseDocument_1 = require("../entities/CourseDocument");
const SimulationAssignment_1 = require("../entities/SimulationAssignment");
const FlowTemplate_1 = require("../entities/FlowTemplate");
const PromptTemplate_1 = require("../entities/PromptTemplate");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'simuverse',
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [
        User_1.User,
        Course_1.Course,
        Simulation_1.Simulation,
        Module_1.Module,
        CourseModule_1.CourseModule,
        TelemetryLog_1.TelemetryLog,
        Assessment_1.Assessment,
        CourseConfig_1.CourseConfig,
        Scenario_1.Scenario,
        SimulationInstance_1.SimulationInstance,
        PracticeLogs_1.PracticeLogs,
        Notification_1.Notification,
        FileUpload_1.FileUpload,
        MinistryRequirement_1.MinistryRequirement,
        KPI_1.KPI,
        Task_1.Task,
        Category_1.Category,
        TechSheet_1.TechSheet,
        CourseDocument_1.CourseDocument,
        SimulationAssignment_1.SimulationAssignment,
        FlowTemplate_1.FlowTemplate,
        PromptTemplate_1.PromptTemplate
    ],
    migrations: ['dist/database/migrations/*.js'],
    subscribers: [],
});
const initializeDatabase = async () => {
    try {
        if (!exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.initialize();
            console.log('✅ Database connection initialized');
        }
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
