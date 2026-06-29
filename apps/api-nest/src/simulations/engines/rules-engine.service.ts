import { Injectable } from '@nestjs/common';

interface CalculationRules {
  formula: string;
  validate: (input: any) => { valid: boolean; error?: string };
  execute: (input: any) => any;
}

// Family: Administración - Liquidación de Sueldos
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
        const holidayBonus = input.daily_salary * input.work_days_in_month * 0.1;
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

// Family: RRHH - Soft Skills
class RRHHRules {
  validateCommunication(transcript: string): { score: number; feedback: string } {
    const professionalTerms = ['además', 'considerando', 'en conclusión', 'propongo'];
    const aggressiveTerms = ['nunca', 'siempre', 'idiota', 'incompetente'];

    const profCount = professionalTerms.filter((t) => transcript.toLowerCase().includes(t)).length;
    const aggCount = aggressiveTerms.filter((t) => transcript.toLowerCase().includes(t)).length;

    const score = Math.min(100, 50 + profCount * 10 - aggCount * 15);
    const feedback =
      aggCount > 0
        ? 'Tono demasiado agresivo. Intenta ser más diplomático.'
        : 'Comunicación profesional adecuada.';

    return { score, feedback };
  }
}

// Family: Informática - Automation
class AutomationRules {
  validatePythonScript(code: string): { valid: boolean; error?: string; score?: number } {
    if (!code.includes('def ') && !code.includes('class ')) {
      return { valid: false, error: 'El script no define funciones ni clases.' };
    }

    if (!code.includes('return ')) {
      return { valid: false, error: 'El script no retorna valores.' };
    }

    const hasErrorHandling = code.includes('try:') && code.includes('except');
    const hasComments = (code.match(/#.*$/gm) || []).length;
    const hasTypeHints = code.includes('->') && code.includes(':');

    let score = 50;
    if (hasErrorHandling) score += 20;
    if (hasComments > 3) score += 15;
    if (hasTypeHints) score += 15;

    return { valid: true, score };
  }
}

// Family: Emprendimiento - E-commerce
class ECommerceRules {
  validateRefundProcess(data: any): { valid: boolean; score: number; feedback: string } {
    const required = ['refund_amount', 'customer_response', 'platform_action'];
    const missing = required.filter((field) => !data[field]);

    if (missing.length > 0) {
      return { valid: false, score: 0, feedback: `Campos faltantes: ${missing.join(', ')}` };
    }

    let score = 50;
    if (data.refund_amount === data.original_amount) score += 15;
    if (data.refund_amount > data.original_amount) score += 25;
    if (data.customer_response && data.customer_response.length > 100) score += 20;
    if (data.platform_action === 'immediate_refund') score += 15;

    return { valid: true, score: Math.min(100, score), feedback: 'Proceso de reembolso validado.' };
  }
}

@Injectable()
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
        return this.rrhhRules.validateCommunication(data.text || '');
      case 'informatica':
        return this.automationRules.validatePythonScript(data.code || '');
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
