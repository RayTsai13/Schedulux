/**
 * Page Routes - public booking pages addressed by slug (/@slug on the frontend)
 *
 * No authentication: these power the page a vendor shares in their bio.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import { StorefrontService } from '../services/StorefrontService';
import { DropService } from '../services/DropService';
import { ApiResponse, PublicPage } from '../types';

const router = Router();

const validateSlug = [
  param('slug')
    .trim()
    .toLowerCase()
    .isLength({ min: 1, max: 30 })
    .withMessage('Invalid page handle'),
];

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  if (!validationResult(req).isEmpty()) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Validation failed',
      message: 'Invalid page handle',
    };
    return res.status(400).json(response);
  }
  next();
};

/**
 * GET /api/pages/:slug - Storefront, active services, and upcoming drops with spot counts
 */
router.get('/pages/:slug',
  validateSlug,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = await StorefrontService.getPublicBySlug(req.params.slug);

      if (!page) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Not found',
          message: 'Page not found',
        };
        return res.status(404).json(response);
      }

      const drops = await DropService.getPublicDrops(page.storefront);
      const { storefront } = page;

      const response: ApiResponse<PublicPage> = {
        success: true,
        data: {
          storefront: {
            id: storefront.id,
            slug: storefront.slug,
            name: storefront.name,
            description: storefront.description,
            address: storefront.address,
            city: storefront.city,
            state: storefront.state,
            timezone: storefront.timezone,
            avatar_url: storefront.avatar_url,
            theme_color: storefront.theme_color,
            instagram_handle: storefront.instagram_handle,
          },
          services: page.services,
          drops,
        },
        message: 'Page retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/slugs/:slug/available - Whether a handle can be claimed (onboarding)
 */
router.get('/slugs/:slug/available',
  validateSlug,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const available = await StorefrontService.isSlugAvailable(req.params.slug);

      const response: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available },
        message: available ? 'Handle is available' : 'Handle is taken or invalid',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
