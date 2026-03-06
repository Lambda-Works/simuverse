import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Simulation } from './Simulation';
import { TelemetryLog } from './TelemetryLog';
import { Assessment } from './Assessment';
import { SimulationInstance } from './SimulationInstance';
import { PracticeLogs } from './PracticeLogs';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['created_at'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login!: Date;

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
}
