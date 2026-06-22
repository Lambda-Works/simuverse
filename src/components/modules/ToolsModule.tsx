'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileText, Code2 } from 'lucide-react';

interface ToolsModuleProps {
  courseFamily?: string;
  tools?: string[];
  onCalculate?: (data: Record<string, any>) => void;
}

const ToolsModule: React.FC<ToolsModuleProps> = ({ courseFamily = 'general', tools = [] }) => {
  const [calculatorInputs, setCalculatorInputs] = useState<Record<string, string>>({});
  const [codeInput, setCodeInput] = useState('');
  const [results, setResults] = useState<Record<string, any>>({});

  const handleCalculatorChange = (key: string, value: string) => {
    setCalculatorInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    // Simulación de cálculo
    if (courseFamily === 'administracion') {
      const baseSalary = parseFloat(calculatorInputs.base_salary || '0');
      const days = parseFloat(calculatorInputs.days || '22');
      const extras = parseFloat(calculatorInputs.extra_hours || '0');

      const dailySalary = baseSalary / 30;
      const basicPay = dailySalary * days;
      const extraPay = extras * (dailySalary / 8) * 1.5; // Hora extra a 150%
      const socialCharges = (basicPay + extraPay) * 0.16; // 16% de aportes
      const netPay = basicPay + extraPay - socialCharges;

      setResults({
        daily_salary: dailySalary.toFixed(2),
        basic_pay: basicPay.toFixed(2),
        extra_pay: extraPay.toFixed(2),
        social_charges: socialCharges.toFixed(2),
        net_pay: netPay.toFixed(2),
      });
    }
  };

  const handleValidateCode = () => {
    // Simulación de validación
    const hasFunction = codeInput.includes('def ') || codeInput.includes('function');
    const hasReturn = codeInput.includes('return ');
    const isValid = hasFunction && hasReturn;

    setResults({
      code_valid: isValid,
      has_function: hasFunction,
      has_return: hasReturn,
      message: isValid ? 'Código válido' : 'Código incompleto o inválido',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          <CardTitle>Módulo de Herramientas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Calculadora</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span className="hidden sm:inline">Código</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Resultados</span>
            </TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4">
            {courseFamily === 'administracion' ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Salario Base Mensual ($)</label>
                  <Input
                    type="number"
                    placeholder="85000"
                    value={calculatorInputs.base_salary || ''}
                    onChange={(e) => handleCalculatorChange('base_salary', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Días Trabajados</label>
                  <Input
                    type="number"
                    placeholder="22"
                    value={calculatorInputs.days || ''}
                    onChange={(e) => handleCalculatorChange('days', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Horas Extras</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={calculatorInputs.extra_hours || ''}
                    onChange={(e) => handleCalculatorChange('extra_hours', e.target.value)}
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No hay calculadora disponible para este curso.</p>
            )}
            <Button onClick={handleCalculate} className="w-full bg-green-600 hover:bg-green-700">
              Calcular
            </Button>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Ingresa tu código Python</label>
              <Textarea
                placeholder="def mi_funcion():\n    return 'resultado'"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={handleValidateCode} className="w-full bg-purple-600 hover:bg-purple-700">
              Validar Código
            </Button>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {Object.keys(results).length > 0 ? (
              <div className="space-y-2 bg-gray-100 p-4 rounded">
                {Object.entries(results).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="font-medium text-sm">{key.replace(/_/g, ' ').toUpperCase()}:</span>
                    <span className="text-sm">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                Ejecuta un cálculo o validación para ver resultados
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ToolsModule;
