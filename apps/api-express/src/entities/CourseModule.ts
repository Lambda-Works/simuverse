import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Course } from './Course';
import { Module } from './Module';

@Entity('course_modules')
@Index(['course_id'])
@Index(['module_id'])
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'uuid' })
  module_id!: string;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @ManyToOne(() => Course, course => course.course_modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @ManyToOne(() => Module, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module!: Module;
}
