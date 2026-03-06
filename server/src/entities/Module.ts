import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum ModuleType {
  COMMUNICATION = 'communication',
  TOOLS = 'tools',
  DOCUMENTATION = 'documentation',
  ASSESSMENT = 'assessment'
}

@Entity('modules')
@Index(['name'])
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: ModuleType
  })
  type!: ModuleType;

  @Column({ type: 'json', nullable: true })
  config!: {
    description: string;
    enabled_features: string[];
    ui_layout: string;
    customization: Record<string, any>;
  };

  @CreateDateColumn()
  created_at!: Date;
}
