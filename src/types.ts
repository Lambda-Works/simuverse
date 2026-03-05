
export interface Course {
  id: string;
  course_id: string;
  modules: string[];
  ai_role: string;
  eval_criteria: string[];
  title: string;
  description: string;
}

export interface Simulation {
  id: string;
  course_id: string;
  student_id: string;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  state: any; 
}

export interface TelemetryLog {
  id: string;
  simulation_id: string;
  timestamp: string;
  event_type: string;
  payload: any;
}
