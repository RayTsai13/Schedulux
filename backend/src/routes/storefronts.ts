import { Router, Response } from 'express';
import { StorefrontModel } from '../models/Storefront';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Middleware guarantees req.user exists and is valid
        const storefronts = await StorefrontModel.findByVendorId(req.user!.userId);

        const response: ApiResponse<typeof storefronts> = {
            success: true,
            data: storefronts,
            message: `Found ${storefronts.length} storefronts`
        };

        res.status(200).json(response);
    }   catch (error) {
        console.error('Error fetching storefronts:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
            message: 'Unable to fetch storefronts at this time'
        });
    }
});

export default router;