
export interface Course {
  id: string;
  course_id: string;
  title: string;
  description: string;
  category: string;
  categories: any;
  modules: any;
  ai_config: any;
  eval_criteria: any;
  crisis_events: any;
  simulated_company_id: number | null;
  tech_sheet_id: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
