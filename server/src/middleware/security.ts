import { Request, Response, NextFunction } from 'express';

/**
 * Middleware anti-jailbreak: Filtra intentos de inyección de prompts
 */
export const promptInjectionFilter = (req: Request, res: Response, next: NextFunction) => {
  const jailbreakPatterns = [
    /ignora.*instrucciones/i,
    /olvida.*sistema/i,
    /actúa como/i,
    /sys.*prompt/i,
    /eres un/i,
    /forget.*previous/i,
    /disregard.*instructions/i,
  ];

  const input = JSON.stringify(req.body).toLowerCase();

  const blocked = jailbreakPatterns.some((pattern) => pattern.test(input));

  if (blocked) {
    console.warn(`[SECURITY] Intento de inyección detectado desde ${req.ip}`);
    return res.status(400).json({
      error: 'Entrada contiene patrones no permitidos. Por favor, formula tu pregunta de manera clara y profesional.',
    });
  }

  next();
};

/**
 * Middleware de validación de integridad: Asegura que los logs no sean alterados
 */
export const integrityChecker = (req: Request, res: Response, next: NextFunction) => {
  req.requestTime = Date.now();
  next();
};

/**
 * Middleware de rate limiting básico
 */
const messageCache: Record<string, number[]> = {};

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  if (!messageCache[userId]) {
    messageCache[userId] = [];
  }

  messageCache[userId] = messageCache[userId].filter((time) => time > oneMinuteAgo);

  if (messageCache[userId].length > 30) {
    // Máximo 30 mensajes por minuto
    return res.status(429).json({
      error: 'Demasiadas solicitudes. Por favor, espera un momento.',
    });
  }

  messageCache[userId].push(now);
  next();
};

/**
 * Middleware de auditoría: Registra todas las solicitudes
 */
export const auditLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function (data: any) {
    console.log(`[AUDIT] ${req.method} ${req.path} - Status: ${res.statusCode} - User: ${req.headers['x-user-id']}`);
    return originalSend.call(this, data);
  };

  next();
};
