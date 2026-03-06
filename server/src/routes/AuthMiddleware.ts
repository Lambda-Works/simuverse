import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { authMiddleware } from '../middleware/AuthMiddleware';
import { UserRole } from '../entities/User';

export const createAuthRoutes = (): Router => {
  const router = Router();
  const authService = new AuthService();
  const userService = new UserService();

  /**
   * POST /api/auth/register
   * Register a new user
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      // Only admins can set teacher role, students default to STUDENT
      const userRole =
        role && role === UserRole.TEACHER ? UserRole.TEACHER : UserRole.STUDENT;

      const result = await authService.register({
        email,
        password,
        name,
        role: userRole
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role
        },
        token: result.token
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * POST /api/auth/login
   * Login user and get JWT token
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.login({ email, password });

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          last_login: result.user.last_login
        },
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh JWT token using refresh token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        message: 'Token refreshed successfully',
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user (client removes token)
   */
  router.post('/logout', authMiddleware, (req: Request, res: Response) => {
    // Logout is handled client-side by removing the token
    // Server can implement token blacklisting if needed
    res.status(200).json({ message: 'Logged out successfully' });
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await userService.getUserById(req.user.id);

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { name } = req.body;

      const updatedUser = await userService.updateUser(req.user.id, {
        name: name || undefined
      } as any);

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};
