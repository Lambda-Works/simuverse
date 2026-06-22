import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export class RoleMiddleware {
  /**
   * Require a specific role or roles
   */
  static requireRole(...requiredRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: `Forbidden. Required roles: ${requiredRoles.join(', ')}. Your role: ${req.user.role}`,
        });
      }

      next();
    };
  }

  /**
   * Admin only
   */
  static adminOnly = this.requireRole(UserRole.ADMIN);

  /**
   * Teacher or Admin
   */
  static teacherOrAdmin = this.requireRole(UserRole.TEACHER, UserRole.ADMIN);

  /**
   * Student only
   */
  static studentOnly = this.requireRole(UserRole.STUDENT);
}
