/**
 * Role-Based Data Filtering Middleware
 * 
 * Segregates simulation data based on user role:
 * - student: Only public scenario data
 * - teacher: Student data + evaluation
 * - ministerio: Teacher data + compliance
 * - admin: Everything (full access)
 * 
 * Security: Filters at API response level BEFORE sending to client
 */

export type UserRole = 'student' | 'teacher' | 'admin' | 'ministerio';

export interface FilteredSimulation {
  simulation_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  student_data?: any;
  evaluation?: any;
  metrics?: any;
  compliance?: any;
  audit_trail?: any;
  course_info?: any;
  admin_data?: any;
}

/**
 * Filters simulation data based on user role
 * CRITICAL SECURITY: Prevents data leakage between roles
 * 
 * @param simulation - Full simulation data from database
 * @param userRole - Role of authenticated user
 * @param userId - ID of authenticated user
 * @param teacherCanSeeAdminData - ADMIN SETTING: Can teachers see ai_config and system prompts?
 */
export function filterSimulationByRole(
  simulation: any,
  userRole: UserRole,
  userId: string,
  teacherCanSeeAdminData: boolean = false
): FilteredSimulation {
  // Base response for all roles
  const baseData: FilteredSimulation = {
    simulation_id: simulation.id,
    status: simulation.status,
    started_at: simulation.started_at,
    completed_at: simulation.completed_at || undefined,
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1️⃣ STUDENT - Only public scenario data
  // ───────────────────────────────────────────────────────────────────────────
  if (userRole === 'student') {
    // RLS: Student can ONLY see their own simulations
    if (simulation.student_id !== userId) {
      throw new Error('Forbidden: Cannot access other student\'s simulation');
    }

    const studentResponse = {
      ...baseData,
      student_data: {
        scenario: {
          title: simulation.scenario?.title,
          category: simulation.course?.category,
          difficulty: simulation.scenario?.difficulty,
        },
        context: simulation.scenario?.content?.context,
        objectives: simulation.scenario?.expected_outcomes,
        modules: {
          emails: true,
          documents: true,
          spreadsheet: true,
          chat: true,
        },
      },
    };

    // After completion: include feedback only
    if (simulation.status === 'completed') {
      studentResponse.evaluation = {
        overall_score: simulation.final_score,
        feedback: simulation.feedback,
        areas_for_improvement: simulation.improvements,
      };
      studentResponse.metrics = {
        time_spent_seconds: simulation.time_spent_seconds,
        messages_count: simulation.message_count,
        help_requests: simulation.help_requests_count,
      };
    }

    return studentResponse;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2️⃣ TEACHER - Student data + evaluation (+ admin_data SI ADMIN LO HABILITA)
  // ───────────────────────────────────────────────────────────────────────────
  if (userRole === 'teacher') {
    const teacherResponse = {
      ...baseData,
      student_id: simulation.student_id,
      student_name: simulation.student?.name,
      student_email: simulation.student?.email,
      
      student_data: {
        scenario: {
          title: simulation.scenario?.title,
          category: simulation.course?.category,
          difficulty: simulation.scenario?.difficulty,
        },
        context: simulation.scenario?.content?.context,
        objectives: simulation.scenario?.expected_outcomes,
      },

      evaluation: {
        overall_score: simulation.final_score,
        score_breakdown: simulation.score_breakdown,
        feedback: simulation.feedback,
        areas_for_improvement: simulation.improvements,
      },

      metrics: {
        time_spent_seconds: simulation.time_spent_seconds,
        messages_count: simulation.message_count,
        help_requests: simulation.help_requests_count,
        score_adjustment_factor: simulation.score_adjustment_factor,
      },
    } as FilteredSimulation;

    // ✅ ADMIN SETTING: Can teacher see AI configuration?
    if (teacherCanSeeAdminData) {
      teacherResponse.admin_data = {
        ai_config: {
          systemPrompt: simulation.ai_config?.systemPrompt,
          base_role: simulation.ai_config?.base_role,
          course_context: simulation.ai_config?.course_context,
          personality_traits: simulation.ai_config?.personality_traits,
          temperature: simulation.ai_config?.temperature,
          top_p: simulation.ai_config?.top_p,
          max_tokens: simulation.ai_config?.max_tokens,
          // ❌ NEVER include actual credentials even for teacher
          // credentials are ONLY for admin
        },
        // Profesor puede ver cómo evaluó la IA
        score_calculation: simulation.score_calculation,
      };
    }

    return teacherResponse;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3️⃣ MINISTERIO - Teacher data + compliance
  // ───────────────────────────────────────────────────────────────────────────
  if (userRole === 'ministerio') {
    const ministerioResponse = {
      ...baseData,
      student_id: simulation.student_id,
      student_name: simulation.student?.name,

      student_data: {
        scenario: {
          title: simulation.scenario?.title,
          category: simulation.course?.category,
        },
        objectives: simulation.scenario?.expected_outcomes,
      },

      evaluation: {
        overall_score: simulation.final_score,
        score_breakdown: simulation.score_breakdown,
      },

      metrics: {
        time_spent_seconds: simulation.time_spent_seconds,
        help_requests: simulation.help_requests_count,
      },

      compliance: {
        standard_met: simulation.standard_met,
        kpi_alignment: simulation.kpi_results,
        competencies_developed: simulation.competencies,
      },

      audit_trail: {
        attempts: simulation.attempt_count,
        first_attempt_score: simulation.first_score,
        last_attempt_score: simulation.final_score,
        help_used: simulation.help_requests_count > 0,
        help_count: simulation.help_requests_count,
      },

      course_info: {
        course_id: simulation.course_id,
        course_title: simulation.course?.title,
        course_category: simulation.course?.category,
        ministry_alignment: simulation.course?.ministry_alignment,
      },
    } as FilteredSimulation;

    return ministerioResponse;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4️⃣ ADMIN - Everything (full access)
  // ───────────────────────────────────────────────────────────────────────────
  if (userRole === 'admin') {
    const adminResponse = {
      ...baseData,
      student_id: simulation.student_id,
      student_name: simulation.student?.name,
      student_email: simulation.student?.email,

      // Public data
      student_data: {
        scenario: simulation.scenario,
        context: simulation.scenario?.content?.context,
        objectives: simulation.scenario?.expected_outcomes,
      },

      evaluation: {
        overall_score: simulation.final_score,
        score_breakdown: simulation.score_breakdown,
        feedback: simulation.feedback,
      },

      metrics: {
        time_spent_seconds: simulation.time_spent_seconds,
        messages_count: simulation.message_count,
        help_requests: simulation.help_requests_count,
      },

      compliance: {
        standard_met: simulation.standard_met,
        kpi_alignment: simulation.kpi_results,
      },

      // ⭐ ADMIN ONLY DATA
      admin_data: {
        // AI Configuration (NEVER for students)
        ai_config: simulation.ai_config,

        // Telemetry logs (NEVER for students)
        telemetry_logs: simulation.telemetry_logs,

        // Score calculation breakdown
        score_calculation: {
          ia_score: simulation.ia_score,
          ia_weight: simulation.ia_weight,
          rules_score: simulation.rules_score,
          rules_weight: simulation.rules_weight,
          base_score: simulation.base_score,
          help_adjustment: simulation.score_adjustment_factor,
          final_score: simulation.final_score,
        },

        // Student login info (audit only)
        student_login: {
          email: simulation.student?.email,
          last_login: simulation.student?.last_login,
        },

        // Internal system state
        internal_state: simulation.internal_state,

        // Change audit log
        change_log: simulation.change_log,
      },
    } as FilteredSimulation;

    return adminResponse;
  }

  // Unknown role - DENY
  throw new Error(`Unknown role: ${userRole}`);
}

/**
 * Filters array of simulations
 */
export function filterSimulationListByRole(
  simulations: any[],
  userRole: UserRole,
  userId: string
): FilteredSimulation[] {
  return simulations.map(sim => 
    filterSimulationByRole(sim, userRole, userId)
  );
}

/**
 * Validates that data doesn't contain sensitive information
 * Dev-time security check
 */
export function validateDataSecurity(
  data: FilteredSimulation,
  userRole: UserRole
): boolean {
  // Student MUST NOT have admin_data
  if (userRole === 'student' && data.admin_data) {
    console.error('🚨 SECURITY VIOLATION: Student data contains admin_data');
    return false;
  }

  // Student MUST NOT have ai_config
  if (userRole === 'student' && (data as any).ai_config) {
    console.error('🚨 SECURITY VIOLATION: Student data contains ai_config');
    return false;
  }

  // Student MUST NOT have credentials
  if (userRole === 'student' && (data as any).student_email) {
    console.error('🚨 SECURITY VIOLATION: Student data contains credentials');
    return false;
  }

  // Teacher MUST NOT have admin_data
  if (userRole === 'teacher' && data.admin_data) {
    console.error('🚨 SECURITY VIOLATION: Teacher data contains admin_data');
    return false;
  }

  return true;
}

/**
 * Strips sensitive fields from logs
 * For teacher/ministerio viewing telemetry
 */
export function filterTelemetryLogs(
  logs: any[],
  userRole: UserRole
): any[] {
  if (userRole === 'student') {
    return []; // Students never see logs
  }

  if (userRole === 'teacher' || userRole === 'ministerio') {
    // Filter out logs with sensitive metadata
    return logs.filter(log => {
      // Remove logs that contain credentials or system info
      return !log.metadata?.includes('credential') &&
             !log.metadata?.includes('password') &&
             !log.metadata?.includes('secret');
    });
  }

  // Admin sees all
  return logs;
}
