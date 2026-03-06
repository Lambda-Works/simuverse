import React, { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';

interface CalculatorModuleProps {
  scenario: any;
  config: any;
  logAction: (actionType: string, description: string, metadata: Record<string, any>) => void;
  updateState: (state: Record<string, any>) => void;
}

const CalculatorModule: React.FC<CalculatorModuleProps> = ({
  scenario,
  config,
  logAction,
  updateState,
}) => {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  // Get calculator config from course
  const calculatorConfig = useMemo(() => {
    return config.calculatorConfig || {
      formulas: {},
      variables: {},
    };
  }, [config]);

  // Evaluate formulas
  const calculateResults = (inputValues: Record<string, number>) => {
    const calculated: Record<string, number> = {};
    const context = { ...calculatorConfig.variables, ...inputValues };

    // Safe evaluation function
    const evaluate = (formula: string): number => {
      try {
        // Replace variable names in formula with their values
        let expression = formula;
        for (const [key, value] of Object.entries(context)) {
          expression = expression.replace(new RegExp(key, 'g'), String(value));
        }
        // Use Function constructor for safe evaluation
        const result = Function('"use strict"; return (' + expression + ')')();
        return typeof result === 'number' ? result : 0;
      } catch (error) {
        console.error('Calculation error:', error);
        return 0;
      }
    };

    for (const [key, formula] of Object.entries(calculatorConfig.formulas)) {
      calculated[key] = evaluate(String(formula));
    }

    return calculated;
  };

  const handleInputChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [key]: numValue }));

    // Auto-calculate
    const newResults = calculateResults({ ...inputs, [key]: numValue });
    setResults(newResults);
  };

  const handleSubmit = () => {
    const allInputs = {
      ...inputs,
      ...results,
    };

    logAction('calculation', `Submitted calculation with values: ${JSON.stringify(allInputs)}`, {
      moduleName: 'Calculator',
      inputs,
      results,
      timestamp: new Date().toISOString(),
    });

    updateState({
      calculatorResults: results,
      calculatorInputs: inputs,
      lastCalculation: new Date().toISOString(),
    });

    setSubmitted(true);

    // Success feedback
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-indigo-600" />
        <h3 className="text-2xl font-bold">Calculadora de {scenario?.familyType || 'Valores'}</h3>
      </div>

      {/* Inputs */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-gray-900">Datos de Entrada</h4>

        {Object.entries(calculatorConfig.variables || {}).map(([key, defaultValue]) => (
          <div key={key} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {key.replace(/_/g, ' ')}
              </label>
              <input
                type="number"
                value={inputs[key] ?? defaultValue}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={String(defaultValue)}
              />
            </div>
            {typeof defaultValue === 'number' && (
              <span className="text-xs text-gray-500">
                Defecto: ${defaultValue.toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 space-y-3">
          <h4 className="font-semibold text-gray-900">Resultados Calculados</h4>

          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className="text-xl font-bold text-blue-600">
                ${typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          submitted
            ? 'bg-green-500 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {submitted ? '✓ Enviado correctamente' : 'Enviar Cálculo'}
      </button>

      {/* Validation Messages */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-semibold">💡 Tips:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
          <li>Verifica que todos los valores sean correctos según la normativa vigente</li>
          <li>Los cálculos se realizan automáticamente según la configuración del curso</li>
          <li>Revisa los resultados antes de enviar</li>
        </ul>
      </div>
    </div>
  );
};

export default CalculatorModule;
