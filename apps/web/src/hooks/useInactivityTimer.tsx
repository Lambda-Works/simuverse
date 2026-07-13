'use client'

import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ─── Configuración ────────────────────────────────────────────────────────────
const INACTIVITY_LIMIT_MS   = 2 * 60 * 60 * 1000;  // 2 horas
const WARNING_BEFORE_MS     = 5 * 60 * 1000;         // aviso 5 min antes
const CHECK_INTERVAL_MS     = 30 * 1000;              // chequea cada 30 seg

// Rutas donde NO se cierra la sesión automáticamente (usuario trabajando)
const SIMULATION_PATH_PREFIX = '/simulation/';

// ─── Contexto ─────────────────────────────────────────────────────────────────
interface InactivityContextType {
  resetTimer: () => void;
  showWarning: boolean;
  minutesLeft: number;
  extendSession: () => void;
}

const InactivityContext = createContext<InactivityContextType | undefined>(undefined);

export const useInactivity = () => {
  const ctx = useContext(InactivityContext);
  if (!ctx) throw new Error('useInactivity must be used within InactivityProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const InactivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();

  const lastActivityRef = useRef<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(5);

  const isOnSimulation = pathname.startsWith(SIMULATION_PATH_PREFIX);

  // Reiniciar el contador de actividad
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  }, []);

  // Extender sesión: el usuario vio el aviso y quiso continuar
  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  }, []);

  // Registrar cualquier interacción del usuario como actividad
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus'];

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      // Cerrar el warning si el usuario vuelve a interactuar
      setShowWarning(false);
    };

    activityEvents.forEach(evt =>
      document.addEventListener(evt, handleActivity, { passive: true })
    );

    return () => {
      activityEvents.forEach(evt =>
        document.removeEventListener(evt, handleActivity)
      );
    };
  }, [isAuthenticated]);

  // Chequear inactividad periódicamente
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = INACTIVITY_LIMIT_MS - elapsed;

      if (remaining <= 0) {
        // Tiempo agotado
        if (isOnSimulation) {
          // En simulación: no cerrar, solo mostrar aviso permanente
          setMinutesLeft(0);
          setShowWarning(true);
        } else {
          // Fuera de simulación: cerrar sesión
          setShowWarning(false);
          signOut();
        }
        return;
      }

      if (remaining <= WARNING_BEFORE_MS) {
        // Mostrar advertencia 5 minutos antes
        const minsLeft = Math.ceil(remaining / 60000);
        setMinutesLeft(minsLeft);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, isOnSimulation, signOut]);

  return (
    <InactivityContext.Provider value={{ resetTimer, showWarning, minutesLeft, extendSession }}>
      {children}
      {/* Warning banner */}
      {isAuthenticated && showWarning && (
        <InactivityWarningBanner
          minutesLeft={minutesLeft}
          isOnSimulation={isOnSimulation}
          onExtend={extendSession}
          onLogout={signOut}
        />
      )}
    </InactivityContext.Provider>
  );
};

// ─── Banner de advertencia ────────────────────────────────────────────────────
interface BannerProps {
  minutesLeft: number;
  isOnSimulation: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

const InactivityWarningBanner: React.FC<BannerProps> = ({
  minutesLeft,
  isOnSimulation,
  onExtend,
  onLogout,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{ zIndex: 9999 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-lg bg-amber-50 border border-amber-300 rounded-xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
    >
      {/* Ícono */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
        ⏰
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        {minutesLeft > 0 ? (
          <>
            <p className="font-semibold text-amber-900 text-sm">
              Sesión por vencer en {minutesLeft} min{minutesLeft !== 1 ? 'utos' : 'uto'}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {isOnSimulation
                ? 'Estás en una simulación. Tu progreso está guardado, pero recordá guardar antes de salir.'
                : 'Por inactividad tu sesión se cerrará automáticamente.'}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-amber-900 text-sm">
              Sesión inactiva hace más de 2 horas
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Estás en una simulación, por eso no cerramos la sesión automáticamente.
              Guardá tu trabajo y cerrá sesión cuando termines.
            </p>
          </>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onExtend}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition"
        >
          Seguir activo
        </button>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-400 hover:bg-amber-100 text-amber-800 transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
