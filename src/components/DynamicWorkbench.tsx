import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { msmApi } from '../services/MSMApiClient';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';

// Módulos dinámicos
import CalculatorModule from './modules/CalculatorModule';
import DocumentModule from './modules/DocumentModule';
import InboxModule from './modules/InboxModule';
import ChatIAModule from './modules/ChatIAModule';

interface CourseConfig {
  courseId: string;
  familyType: 'administration' | 'rrhh' | 'it' | 'entrepreneurship';
  uiConfig: {
    layout: 'office' | 'terminal' | 'dashboard' | 'ecommerce';
    primaryColor: string;
    secondaryColor: string;
    theme: 'light' | 'dark';
  };
  activeModules: Array<{
    moduleId: number;
    enabled: boolean;
    config: Record<string, any>;
  }>;
  iaConfig: {
    enabled: boolean;
    provider: string;
    systemPrompt: string;
  };
}

interface SimulationState {
  id?: number;
  studentId: string;
  courseId: string;
  scenarioId: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  currentState: Record<string, any>;
}

interface Module {
  moduleId: number;
  enabled: boolean;
  config: Record<string, any>;
}

const DynamicWorkbench: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const [config, setConfig] = useState<CourseConfig | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<number | null>(null);

  // Load course configuration and start simulation
  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!courseId || !user?.id) return;

        setLoading(true);
        setError(null);

        // Get config
        const configData = await msmApi.getConfig(courseId);
        setConfig(configData);

        // Get scenarios
        const scenarios = await msmApi.getScenarios(courseId);
        if (scenarios.length > 0) {
          setScenario(scenarios[0]);

          // Start simulation
          const sim = await msmApi.startSimulation(user.id, courseId, scenarios[0].id);
          setSimulation(sim);

          // Set first active module
          const firstActiveModule = configData.activeModules.find((m) => m.enabled);
          if (firstActiveModule) {
            setActiveModule(firstActiveModule.moduleId);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading course');
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, user?.id]);

  // Log action
  const logAction = async (
    actionType: string,
    description: string,
    metadata: Record<string, any>
  ) => {
    if (!simulation || !courseId || !user?.id) return;

    try {
      await msmApi.logAction(user.id, courseId, actionType, description, metadata);
    } catch (err) {
      console.error('Error logging action:', err);
    }
  };

  // Update simulation state
  const updateState = async (newState: Record<string, any>) => {
    if (!simulation || !courseId) return;

    try {
      const updated = await msmApi.updateSimulationState(simulation.id!, newState);
      setSimulation(updated);
    } catch (err) {
      console.error('Error updating state:', err);
    }
  };

  // Complete simulation
  const completeSimulation = async () => {
    if (!simulation) return;

    try {
      await msmApi.completeSimulation(simulation.id!, {
        accuracy: 0.92,
        timeSpent: 45,
        tasksCompleted: 5,
        tasksTotal: 5,
        errorCount: 0,
      });

      setSimulation((prev) =>
        prev ? { ...prev, status: 'completed', progress: 100 } : null
      );

      logAction(
        'case_submitted',
        'Student completed simulation',
        { simulationId: simulation.id }
      );
    } catch (err) {
      console.error('Error completing simulation:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Cargando simulación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Error</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!config || !simulation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No course configuration found</p>
      </div>
    );
  }

  // Render appropriate layout based on config
  const renderWorkbench = () => {
    switch (config.uiConfig.layout) {
      case 'office':
        return (
          <OfficeLayout
            config={config}
            simulation={simulation}
            scenario={scenario}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            logAction={logAction}
            updateState={updateState}
            completeSimulation={completeSimulation}
          />
        );
      case 'terminal':
        return (
          <TerminalLayout
            config={config}
            simulation={simulation}
            scenario={scenario}
            logAction={logAction}
            updateState={updateState}
            completeSimulation={completeSimulation}
          />
        );
      case 'dashboard':
        return (
          <DashboardLayout
            config={config}
            simulation={simulation}
            scenario={scenario}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            logAction={logAction}
            updateState={updateState}
            completeSimulation={completeSimulation}
          />
        );
      default:
        return <div>Unknown layout: {config.uiConfig.layout}</div>;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: config.uiConfig.theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
        color: config.uiConfig.theme === 'dark' ? '#ffffff' : '#000000',
      }}
    >
      {renderWorkbench()}
    </div>
  );
};

// Office Layout (Administration, RRHH)
const OfficeLayout: React.FC<any> = ({
  config,
  simulation,
  scenario,
  activeModule,
  setActiveModule,
  logAction,
  updateState,
  completeSimulation,
}) => {
  const moduleComponents: Record<number, React.ReactNode> = {
    1: (
      <CalculatorModule
        scenario={scenario}
        config={config}
        logAction={logAction}
        updateState={updateState}
      />
    ),
    2: (
      <DocumentModule
        scenario={scenario}
        config={config}
        logAction={logAction}
      />
    ),
    3: (
      <InboxModule
        scenario={scenario}
        config={config}
        logAction={logAction}
        updateState={updateState}
      />
    ),
    4: (
      <ChatIAModule
        scenario={scenario}
        config={config}
        logAction={logAction}
        updateState={updateState}
      />
    ),
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div
        className="w-64 border-r p-6"
        style={{ backgroundColor: config.uiConfig.primaryColor }}
      >
        <h1 className="text-white text-2xl font-bold mb-8">FEPEI 360</h1>

        {/* Module Navigation */}
        <div className="space-y-2 mb-8">
          <h3 className="text-white text-sm font-semibold">MÓDULOS</h3>
          {config.activeModules.map((module: Module) => {
            const moduleNames = {
              1: 'Calculadora',
              2: 'Documentos',
              3: 'Inbox',
              4: 'Chat IA',
            };

            return (
              <button
                key={module.moduleId}
                onClick={() => setActiveModule(module.moduleId)}
                className={`w-full text-left px-4 py-2 rounded transition ${
                  activeModule === module.moduleId
                    ? 'bg-white text-indigo-900 font-semibold'
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                {moduleNames[module.moduleId as keyof typeof moduleNames]}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-white">
          <h3 className="text-sm font-semibold mb-2">Progreso</h3>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${simulation.progress}%` }}
            />
          </div>
          <p className="text-xs mt-2">{Math.round(simulation.progress)}% completado</p>
        </div>

        {/* Complete Button */}
        {simulation.status !== 'completed' && (
          <button
            onClick={completeSimulation}
            className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded transition"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Completar
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-2">{scenario?.name}</h2>
          <p className="text-gray-600 mb-6">{scenario?.description}</p>

          {/* Render active module */}
          {activeModule && moduleComponents[activeModule]}
        </div>
      </div>
    </div>
  );
};

// Terminal Layout (IT)
const TerminalLayout: React.FC<any> = ({
  config,
  simulation,
  scenario,
  logAction,
  updateState,
  completeSimulation,
}) => {
  return (
    <div className="flex h-screen bg-black text-green-400 font-mono">
      <div className="flex-1 flex flex-col">
        {/* Terminal Header */}
        <div className="bg-gray-900 border-b border-green-400 p-4">
          <p className="text-sm">user@fepei-simulator ~ % {scenario?.name}</p>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 overflow-auto p-4">
          <ChatIAModule
            scenario={scenario}
            config={config}
            logAction={logAction}
            updateState={updateState}
            isTerminal={true}
          />
        </div>

        {/* Terminal Footer */}
        <div className="bg-gray-900 border-t border-green-400 p-4 flex gap-2">
          <button
            onClick={completeSimulation}
            className="bg-green-400 text-black px-4 py-2 rounded hover:bg-green-300"
          >
            Enviar
          </button>
          <button className="bg-gray-700 text-green-400 px-4 py-2 rounded hover:bg-gray-600">
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Layout (Entrepreneurship)
const DashboardLayout: React.FC<any> = ({
  config,
  simulation,
  scenario,
  activeModule,
  setActiveModule,
  logAction,
  updateState,
  completeSimulation,
}) => {
  const moduleComponents: Record<number, React.ReactNode> = {
    1: (
      <CalculatorModule
        scenario={scenario}
        config={config}
        logAction={logAction}
        updateState={updateState}
      />
    ),
    2: (
      <DocumentModule
        scenario={scenario}
        config={config}
        logAction={logAction}
      />
    ),
    3: (
      <InboxModule
        scenario={scenario}
        config={config}
        logAction={logAction}
        updateState={updateState}
      />
    ),
    4: (
      <ChatIAModule
        scenario={scenario}
        config={config}
        logAction={logAction}
        updateState={updateState}
      />
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
        <h1 className="text-3xl font-bold">{scenario?.name}</h1>
        <p className="text-orange-100">{scenario?.description}</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6 p-8">
        {/* Module Tabs */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-8">
            <h3 className="font-bold text-gray-900 mb-4">Módulos Activos</h3>
            <div className="space-y-2">
              {config.activeModules.map((module: Module) => {
                const moduleNames = {
                  1: 'Inventario',
                  2: 'Documentos',
                  3: 'Pedidos',
                  4: 'Clientes',
                };

                return (
                  <button
                    key={module.moduleId}
                    onClick={() => setActiveModule(module.moduleId)}
                    className={`w-full text-left px-4 py-2 rounded transition ${
                      activeModule === module.moduleId
                        ? `text-white font-semibold`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor:
                        activeModule === module.moduleId
                          ? config.uiConfig.primaryColor
                          : 'transparent',
                    }}
                  >
                    {moduleNames[module.moduleId as keyof typeof moduleNames]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-8">
            {activeModule && moduleComponents[activeModule]}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={completeSimulation}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded transition"
              >
                Finalizar
              </button>
              <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold px-6 py-2 rounded transition">
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicWorkbench;
