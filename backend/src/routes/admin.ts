import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { StorefrontModel } from '../models/Storefront';
import { AppointmentModel } from '../models/Appointment';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [totalUsers, usersByRole, totalStorefronts, totalAppointments, appointmentsByStatus] =
      await Promise.all([
        UserModel.count(),
        UserModel.countByRole(),
        StorefrontModel.countAll(),
        AppointmentModel.countAll(),
        AppointmentModel.countByStatus(),
      ]);

    const byRole: Record<string, number> = {};
    for (const row of usersByRole) {
      byRole[row.role] = row.count;
    }

    const byStatus: Record<string, number> = {};
    for (const row of appointmentsByStatus) {
      byStatus[row.status] = row.count;
    }

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, byRole },
        storefronts: { total: totalStorefronts },
        appointments: { total: totalAppointments, byStatus },
      },
      message: 'Stats retrieved',
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch stats' });
  }
});

// GET /api/admin/storefronts?limit=20&offset=0
router.get('/storefronts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
    const offset = parseInt(String(req.query.offset || '0'), 10);

    const [storefronts, total] = await Promise.all([
      StorefrontModel.findAllAdmin(limit, offset),
      StorefrontModel.countAll(),
    ]);

    res.json({
      success: true,
      data: { storefronts, total, limit, offset },
      message: 'Storefronts retrieved',
    });
  } catch (error) {
    console.error('Admin storefronts error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch storefronts' });
  }
});

// PATCH /api/admin/storefronts/:id/verify
router.patch('/storefronts/:id/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { is_verified } = req.body;

    if (typeof is_verified !== 'boolean') {
      return res.status(400).json({ success: false, data: null, message: 'is_verified must be a boolean' });
    }

    const storefront = await StorefrontModel.setVerified(id, is_verified);
    if (!storefront) {
      return res.status(404).json({ success: false, data: null, message: 'Storefront not found' });
    }

    res.json({ success: true, data: storefront, message: `Storefront ${is_verified ? 'verified' : 'unverified'}` });
  } catch (error) {
    console.error('Admin verify error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to update verification' });
  }
});

export default router;
