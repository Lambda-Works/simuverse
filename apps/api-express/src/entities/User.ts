import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Simulation } from './Simulation';
import { TelemetryLog } from './TelemetryLog';
import { Assessment } from './Assessment';
import { SimulationInstance } from './SimulationInstance';
import { PracticeLogs } from './PracticeLogs';
import { MinistryRequirement } from './MinistryRequirement';
import { Notification } from './Notification';
import { FileUpload } from './FileUpload';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  MINISTRY = 'ministerio'  // Changed to match actual database value
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['created_at'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })  // Maps to 'password_hash' column in DB (created by InitialMigration)
  password!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role!: UserRole;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany(() => Simulation, simulation => simulation.user)
  simulations!: Simulation[];

  @OneToMany(() => SimulationInstance, (instance) => instance.student)
  simulation_instances?: SimulationInstance[];

  @OneToMany(() => PracticeLogs, (log) => log.student)
  practice_logs?: PracticeLogs[];

  @OneToMany(() => TelemetryLog, log => log.user)
  telemetry_logs!: TelemetryLog[];

  @OneToMany(() => Assessment, assessment => assessment.user)
  assessments!: Assessment[];

  @OneToMany(() => MinistryRequirement, req => req.uploaded_by)
  ministry_requirements_uploaded?: MinistryRequirement[];

  @OneToMany(() => Notification, notif => notif.recipient)
  notifications_received?: Notification[];

  @OneToMany(() => FileUpload, file => file.uploaded_by)
  file_uploads?: FileUpload[];
}
