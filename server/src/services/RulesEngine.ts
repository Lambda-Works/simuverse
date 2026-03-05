/**
 * Rules Engine - Motor de Reglas de Negocio
 * Aplicar estrategias de validación según el tipo de curso
 */

interface CalculationRules {
  formula: string;
  validate: (input: any) => { valid: boolean; error?: string };
  execute: (input: any) => any;
}

// Familia: Administración - Liquidación de Sueldos
class SalaryLiquidationRules {
  private rules: Record<string, CalculationRules> = {
    socialCharges: {
      formula: 'base_salary * (aporte_jubilacion + aporte_obra_social + aporte_sindicato)',
      validate: (input) => {
        if (!input.base_salary || input.base_salary <= 0) {
          return { valid: false, error: 'Salario base inválido' };
        }
        return { valid: true };
      },
      execute: (input) => {
        const APORTE_JUBILACION = 0.1;
        const APORTE_OBRA_SOCIAL = 0.03;
        const APORTE_SINDICATO = 0.02;
        return input.base_salary * (APORTE_JUBILACION + APORTE_OBRA_SOCIAL + APORTE_SINDICATO);
      },
    },
    holidayBonus: {
      formula: '(daily_salary * work_days_in_month * 1.1) - total_deductions',
      validate: (input) => {
        if (!input.daily_salary || !input.work_days_in_month) {
          return { valid: false, error: 'Parámetros de salario diario inválidos' };
        }
        return { valid: true };
      },
      execute: (input) => {
        const dailySalary = input.daily_salary;
        const workDaysInMonth = input.work_days_in_month;
        const holidayBonus = dailySalary * workDaysInMonth * 0.1;
        return input.base_salary + holidayBonus;
      },
    },
  };

  validate(ruleName: string, input: any) {
    const rule = this.rules[ruleName];
    if (!rule) return { valid: false, error: 'Regla no encontrada' };
    return rule.validate(input);
  }

  execute(ruleName: string, input: any) {
    const rule = this.rules[ruleName];
    if (!rule) throw new Error('Regla no encontrada');
    return rule.execute(input);
  }
}

// Familia: RRHH - Soft Skills
class RRHHRules {
  validateCommunication(transcript: string): { score: number; feedback: string } {
    const professionalTerms = ['además', 'considerando', 'en conclusión', 'propongo'];
    const aggressiveTerms = ['nunca', 'siempre', 'idiota', 'incompetente'];

    const profCount = professionalTerms.filter((term) => transcript.toLowerCase().includes(term)).length;
    const aggCount = aggressiveTerms.filter((term) => transcript.toLowerCase().includes(term)).length;

    const score = Math.min(100, 50 + profCount * 10 - aggCount * 15);
    const feedback = aggCount > 0 ? 'Tono demasiado agresivo. Intenta ser más diplomático.' : 'Comunicación profesional adecuada.';

    return { score, feedback };
  }

  validateEmpathy(transcript: string): { score: number; feedback: string } {
    const empathyKeywords = ['entiendo', 'comprendo', 'empatizo', 'me pongo en tu lugar', 'tu perspectiva'];
    const empathyCount = empathyKeywords.filter((keyword) => transcript.toLowerCase().includes(keyword)).length;

    const score = Math.min(100, empathyCount * 20);
    const feedback = empathyCount > 0 ? 'Buena demostración de empatía.' : 'Intenta demostrar mayor empatía hacia la otra persona.';

    return { score, feedback };
  }
}

// Familia: Informática - Automatización con IA
class AutomationRules {
  validatePythonScript(code: string): { valid: boolean; error?: string; score?: number } {
    // Validaciones básicas
    if (!code.includes('def ') && !code.includes('class ')) {
      return { valid: false, error: 'El script no define funciones ni clases.' };
    }

    if (!code.includes('return ')) {
      return { valid: false, error: 'El script no retorna valores.' };
    }

    // Scoring
    const hasErrorHandling = code.includes('try:') && code.includes('except');
    const hasComments = code.match(/#.*$/gm)?.length || 0;
    const hasTypeHints = code.includes('->')&&code.includes(':');

    let score = 50;
    if (hasErrorHandling) score += 20;
    if (hasComments > 3) score += 15;
    if (hasTypeHints) score += 15;

    return { valid: true, score };
  }

  validateLogicFlow(description: string): { valid: boolean; score: number; feedback: string } {
    const logicKeywords = ['si', 'entonces', 'sino', 'mientras', 'para cada'];
    const logicKeywordCount = logicKeywords.filter((kw) => description.toLowerCase().includes(kw)).length;

    const isLogical = logicKeywordCount > 0;
    const score = Math.min(100, logicKeywordCount * 20);

    return {
      valid: isLogical,
      score,
      feedback: isLogical ? 'Lógica clara y bien estructurada.' : 'La lógica del proceso podría ser más clara.',
    };
  }
}

// Familia: Emprendimiento - E-commerce
class ECommerceRules {
  validateRefundProcess(data: any): { valid: boolean; score: number; feedback: string } {
    const required = ['refund_amount', 'customer_response', 'platform_action'];
    const missing = required.filter((field) => !data[field]);

    if (missing.length > 0) {
      return { valid: false, score: 0, feedback: `Campos faltantes: ${missing.join(', ')}` };
    }

    let score = 50;

    // Validar monto de reembolso
    if (data.refund_amount === data.original_amount) score += 15;
    if (data.refund_amount > data.original_amount) score += 25; // Bonus por generosidad

    // Validar respuesta al cliente
    if (data.customer_response && data.customer_response.length > 100) score += 20;

    // Validar acción en plataforma
    if (data.platform_action === 'immediate_refund') score += 15;

    return { valid: true, score: Math.min(100, score), feedback: 'Proceso de reembolso validado.' };
  }
}

export {
  SalaryLiquidationRules,
  RRHHRules,
  AutomationRules,
  ECommerceRules,
};

export class RulesEngine {
  private salaryRules = new SalaryLiquidationRules();
  private rrhhRules = new RRHHRules();
  private automationRules = new AutomationRules();
  private ecommerceRules = new ECommerceRules();

  async validate(courseFamily: string, ruleName: string, data: any) {
    switch (courseFamily) {
      case 'administracion':
        return this.salaryRules.validate(ruleName, data);
      case 'rrhh':
        return this.rrhhRules.validateCommunication(data);
      case 'informatica':
        return this.automationRules.validatePythonScript(data);
      case 'emprendimiento':
        return this.ecommerceRules.validateRefundProcess(data);
      default:
        return { valid: false, error: 'Familia de curso no soportada' };
    }
  }

  async execute(courseFamily: string, ruleName: string, data: any) {
    if (courseFamily === 'administracion') {
      return this.salaryRules.execute(ruleName, data);
    }
    throw new Error('Ejecución no soportada para esta familia');
  }
}

export const rulesEngine = new RulesEngine();
