import { Router, Request, Response } from 'express';

const router = Router();

/**
 * MINISTRY ENDPOINTS (STUB)
 * 
 * Las funcionalidades de Requisitos del Ministerio aún están en desarrollo.
 * Estas rutas requieren:
 * - Tabla de KPI (para criterios de evaluación)
 * - Tabla de MinistryRequirement (para requisitos por curso)
 * - Tabla de Task (para tareas dentro de escenarios)
 * 
 * Por ahora, los cursos almacenan eval_criteria en JSON.
 */

// Placeholder: Ministry requirements endpoint
router.get('/requirements', (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Ministry requirements endpoints are under development',
    status: 'coming_soon'
  });
});

// Placeholder: Create ministry requirement
router.post('/requirements', (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Ministry requirements endpoints are under development',
    status: 'coming_soon'
  });
});

// Placeholder: Get KPIs
router.get('/kpis', (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'KPI endpoints are under development',
    status: 'coming_soon'
  });
});

// Health check for ministry endpoints
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ministry_endpoints_stub',
    message: 'Ministry module is under development - using JSON-based eval_criteria for now'
  });
});

export default router;
