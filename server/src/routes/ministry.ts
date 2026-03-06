import { Router, Request, Response } from 'express';
import { ministryRequirementService } from '../services/MinistryRequirementService';
import { kpiService } from '../services/KPIService';
import { taskService } from '../services/TaskService';
import { notificationService } from '../services/NotificationService';
import multer, { StorageEngine } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const router = Router();

// Configurar multer para upload de archivos
const uploadDir = path.join(process.cwd(), 'uploads', 'ministry-requirements');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const hash = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${hash}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

/**
 * POST /api/admin/ministry-requirements
 * Subir requisitos ministeriales
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { course_id } = req.body;
    const user_id = (req as any).user?.user_id;

    if (!course_id || !user_id || !req.file) {
      return res.status(400).json({
        error: 'course_id, user_id, y file requeridos'
      });
    }

    // Obtener extensión
    const ext = path.extname((req.file as any).originalname).toLowerCase();
    const fileType = getFileType(ext);

    // Crear requisito
    const requirement = await ministryRequirementService.createRequirement({
      course_id,
      uploaded_by_id: user_id,
      file_name: (req.file as any).originalname,
      file_type: fileType,
      file_size_bytes: (req.file as any).size,
      file_path: (req.file as any).path
    });

    // Procesar en background (extraer KPIs, generar tareas)
    setTimeout(() => {
      ministryRequirementService.processRequirement(requirement.id)
        .catch((err: any) => console.error('Error processing requirement:', err));
    }, 0);

    res.status(201).json({
      message: 'Archivo subido y procesando',
      requirement: {
        id: requirement.id,
        status: requirement.status,
        file_name: requirement.file_name
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/ministry-requirements/:requirement_id
 * Obtener detalles de un requisito
 */
router.get('/:requirement_id', async (req: Request, res: Response) => {
  try {
    const requirement = await ministryRequirementService.getRequirementById(
      req.params.requirement_id
    );

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    res.json(requirement);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/ministry-requirements/course/:course_id
 * Listar requisitos de un curso
 */
router.get('/course/:course_id', async (req: Request, res: Response) => {
  try {
    const requirements = await ministryRequirementService.getRequirementsByCourse(
      req.params.course_id
    );

    res.json(requirements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/ministry-requirements/:requirement_id/activate
 * Activar requisito (hacer disponibles sus KPIs y tareas)
 */
router.post('/:requirement_id/activate', async (req: Request, res: Response) => {
  try {
    const activated = await ministryRequirementService.activateRequirement(
      req.params.requirement_id
    );

    res.json({
      message: 'Requirement activated',
      requirement: activated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/admin/ministry-requirements/:requirement_id/archive
 * Archivar requisito
 */
router.post('/:requirement_id/archive', async (req: Request, res: Response) => {
  try {
    const archived = await ministryRequirementService.archiveRequirement(
      req.params.requirement_id
    );

    res.json({
      message: 'Requirement archived',
      requirement: archived
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/ministry-requirements/:requirement_id/stats
 * Obtener estadísticas
 */
router.get('/:requirement_id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await ministryRequirementService.getRequirementStats(
      req.params.requirement_id
    );

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ========== KPIs ==========
 */

/**
 * GET /api/admin/kpis
 * Listar KPIs de un curso
 */
router.get('/kpis/course/:course_id', async (req: Request, res: Response) => {
  try {
    const kpis = await kpiService.getKPIsByCourse(req.params.course_id);
    res.json(kpis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ========== TASKS ==========
 */

/**
 * GET /api/admin/tasks
 * Listar tareas de un curso
 */
router.get('/tasks/course/:course_id', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as any;
    const tasks = await taskService.getTasksByCourse(
      req.params.course_id,
      type
    );

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/student/tasks/next
 * Obtener próxima tarea para estudiante
 */
router.get('/next', async (req: Request, res: Response) => {
  try {
    const { course_id } = req.query;
    const user_id = (req as any).user?.user_id;

    if (!course_id || !user_id) {
      return res.status(400).json({
        error: 'course_id requerido'
      });
    }

    // TODO: Obtener tareas completadas del estudiante desde assessments
    const completedTaskIds: string[] = [];

    const nextTask = await taskService.getNextTaskForStudent(
      course_id as string,
      completedTaskIds
    );

    if (!nextTask) {
      return res.status(404).json({
        message: 'No more tasks available'
      });
    }

    res.json(nextTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ========== NOTIFICATIONS ==========
 */

/**
 * GET /api/notifications
 * Obtener notificaciones del usuario
 */
router.get('', async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user?.user_id;
    const limit = req.query.limit as any || 50;

    if (!user_id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const notifications = await notificationService.getUserNotifications(
      user_id,
      parseInt(limit)
    );

    const unreadCount = await notificationService.countUnread(user_id);

    res.json({
      notifications,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/:notification_id/read
 * Marcar notificación como leída
 */
router.put('/:notification_id/read', async (req: Request, res: Response) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.notification_id
    );

    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marcar todas como leídas
 */
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user?.user_id;

    if (!user_id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await notificationService.markAllAsRead(user_id);

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper method
function getFileType(
  ext: string
): 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg' | 'txt' {
  const map: any = {
    '.pdf': 'pdf',
    '.docx': 'docx',
    '.xlsx': 'xlsx',
    '.xls': 'xlsx',
    '.png': 'png',
    '.jpg': 'jpg',
    '.jpeg': 'jpg',
    '.txt': 'txt'
  };

  return map[ext.toLowerCase()] || 'txt';
}

export default router;
