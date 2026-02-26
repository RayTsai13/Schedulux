import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { DropService } from '../services/DropService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, ValidationError, CreateDropRequest, UpdateDropRequest } from '../types';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateStorefrontId = [
  param('storefrontId')
    .isInt({ min: 1 })
    .withMessage('Invalid storefront ID')
];

const validateDropId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid drop ID')
];

const validateCreate = [
  body('service_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid service ID'),

  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be under 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be under 2000 characters'),

  body('drop_date')
    .isISO8601({ strict: true })
    .withMessage('drop_date must be a valid date (YYYY-MM-DD)'),

  body('start_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('start_time must be in HH:MM or HH:MM:SS format'),

  body('end_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('end_time must be in HH:MM or HH:MM:SS format'),

  body('max_concurrent_appointments')
    .optional()
    .isInt({ min: 1 })
    .withMessage('max_concurrent_appointments must be a positive integer'),

  body('is_published')
    .optional()
    .isBoolean()
    .withMessage('is_published must be a boolean'),
];

const validateUpdate = [
  body('service_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid service ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be under 2000 characters'),

  body('drop_date')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('drop_date must be a valid date (YYYY-MM-DD)'),

  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('start_time must be in HH:MM or HH:MM:SS format'),

  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('end_time must be in HH:MM or HH:MM:SS format'),

  body('max_concurrent_appointments')
    .optional()
    .isInt({ min: 1 })
    .withMessage('max_concurrent_appointments must be a positive integer'),

  body('is_published')
    .optional()
    .isBoolean()
    .withMessage('is_published must be a boolean'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
];

// ============================================================================
// VALIDATION ERROR HANDLER
// ============================================================================

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages: ValidationError[] = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    const response: ApiResponse<ValidationError[]> = {
      success: false,
      data: errorMessages,
      error: 'Validation failed',
      message: 'Please check your input and try again'
    };

    return res.status(400).json(response);
  }

  next();
};

// ============================================================================
// ERROR HANDLER UTILITY
// ============================================================================

const handleServiceError = (error: any, res: Response, next: NextFunction) => {
  if (error.message === 'Drop not found') {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Drop not found'
    });
  }

  if (error.message === 'Storefront not found') {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Storefront not found'
    });
  }

  if (error.message.includes('Forbidden')) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You do not have permission to access this resource'
    });
  }

  if (error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('start_time') ||
      error.message.includes('end_time')) {
    return res.status(400).json({
      success: false,
      error: 'Bad request',
      message: error.message
    });
  }

  next(error);
};

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/storefronts/:storefrontId/drops - Create a new drop (PRIVATE)
 */
router.post('/storefronts/:storefrontId/drops',
  validateStorefrontId,
  validateCreate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const dropData: CreateDropRequest = req.body;
      const drop = await DropService.createDrop(storefrontId, req.user!.userId, dropData);

      const response: ApiResponse<typeof drop> = {
        success: true,
        data: drop,
        message: 'Drop created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /api/storefronts/:storefrontId/drops - Get all drops for vendor (PRIVATE)
 */
router.get('/storefronts/:storefrontId/drops',
  validateStorefrontId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const drops = await DropService.getDropsByStorefront(storefrontId, req.user!.userId);

      const response: ApiResponse<typeof drops> = {
        success: true,
        data: drops,
        message: `Found ${drops.length} drop${drops.length !== 1 ? 's' : ''}`
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /api/storefronts/:storefrontId/drops/public - Get published drops (PUBLIC)
 */
router.get('/storefronts/:storefrontId/drops/public',
  validateStorefrontId,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const drops = await DropService.getPublicDrops(storefrontId);

      const response: ApiResponse<typeof drops> = {
        success: true,
        data: drops,
        message: `Found ${drops.length} upcoming drop${drops.length !== 1 ? 's' : ''}`
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /api/drops/:id - Get a single drop by ID (PRIVATE)
 */
router.get('/drops/:id',
  validateDropId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dropId = parseInt(req.params.id, 10);
      const drop = await DropService.getDropById(dropId, req.user!.userId);

      const response: ApiResponse<typeof drop> = {
        success: true,
        data: drop,
        message: 'Drop retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * PUT /api/drops/:id - Update a drop (PRIVATE)
 */
router.put('/drops/:id',
  validateDropId,
  validateUpdate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dropId = parseInt(req.params.id, 10);
      const updateData: UpdateDropRequest = req.body;
      const drop = await DropService.updateDrop(dropId, req.user!.userId, updateData);

      const response: ApiResponse<typeof drop> = {
        success: true,
        data: drop,
        message: 'Drop updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * DELETE /api/drops/:id - Soft delete a drop (PRIVATE)
 */
router.delete('/drops/:id',
  validateDropId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dropId = parseInt(req.params.id, 10);
      await DropService.deleteDrop(dropId, req.user!.userId);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Drop deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

export default router;
