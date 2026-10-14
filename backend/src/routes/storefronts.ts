/**
 * Storefront Routes - API endpoints for storefront management
 *
 * This module provides CRUD operations for storefronts with:
 * - Input validation using express-validator
 * - Ownership verification (vendors can only access their own storefronts)
 * - Consistent error handling and response formats
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { StorefrontService } from '../services/StorefrontService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, ValidationError, CreateStorefrontRequest, UpdateStorefrontRequest, SLUG_PATTERN } from '../types';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validation for storefront ID parameter
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid storefront ID')
];

/**
 * Validation for creating a storefront
 */
const validateCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),

  body('slug')
    .trim()
    .toLowerCase()
    .matches(SLUG_PATTERN)
    .withMessage('Slug must be 3-30 lowercase letters, numbers, or dashes'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),

  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone must be in valid international format'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),

  body('timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Timezone must be a valid timezone string'),

  body('avatar_url')
    .optional({ values: 'null' })
    .isURL()
    .withMessage('avatar_url must be a valid URL'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),

  body('theme_color')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('theme_color must be less than 20 characters'),

  body('instagram_handle')
    .optional({ values: 'null' })
    .trim()
    .matches(/^@?[A-Za-z0-9._]{1,30}$/)
    .withMessage('instagram_handle must be a valid Instagram username'),
];

/**
 * Validation for updating a storefront (all fields optional)
 */
const validateUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be less than 100 characters'),

  body('slug')
    .optional()
    .trim()
    .toLowerCase()
    .matches(SLUG_PATTERN)
    .withMessage('Slug must be 3-30 lowercase letters, numbers, or dashes'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),

  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone must be in valid international format'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),

  body('timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Timezone must be a valid timezone string'),

  body('avatar_url')
    .optional({ values: 'null' })
    .isURL()
    .withMessage('avatar_url must be a valid URL'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),

  body('theme_color')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('theme_color must be less than 20 characters'),

  body('instagram_handle')
    .optional({ values: 'null' })
    .trim()
    .matches(/^@?[A-Za-z0-9._]{1,30}$/)
    .withMessage('instagram_handle must be a valid Instagram username'),
];

// ============================================================================
// VALIDATION ERROR HANDLER
// ============================================================================

/**
 * Middleware to handle validation errors
 * Runs after validation middleware to check for errors and return formatted response
 */
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

/**
 * Map service errors to appropriate HTTP responses
 */
const handleServiceError = (error: any, res: Response, next: NextFunction) => {
  if (error.message === 'Storefront not found') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Not found',
      message: 'Storefront not found'
    };
    return res.status(404).json(response);
  }

  if (error.message.includes('Forbidden')) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Forbidden',
      message: 'You do not have permission to access this storefront'
    };
    return res.status(403).json(response);
  }

  if (error.message === 'Slug is already taken' || error.message === 'You already have a booking page') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Conflict',
      message: error.message
    };
    return res.status(409).json(response);
  }

  if (error.message.includes('required') || error.message.startsWith('Invalid slug')) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Bad request',
      message: error.message
    };
    return res.status(400).json(response);
  }

  // Pass unexpected errors to Express error middleware
  next(error);
};

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/storefronts/mine - The authenticated vendor's booking page (null if not created yet)
 */
router.get('/mine',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefront = await StorefrontService.getForVendor(req.user!.userId);

      const response: ApiResponse<typeof storefront> = {
        success: true,
        data: storefront,
        message: storefront ? 'Storefront retrieved successfully' : 'No booking page yet'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/storefronts/:id - Get a specific storefront by ID
 */
router.get('/:id',
  validateId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.id, 10);
      const storefront = await StorefrontService.getById(storefrontId, req.user!.userId);

      const response: ApiResponse<typeof storefront> = {
        success: true,
        data: storefront,
        message: 'Storefront retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * POST /api/storefronts - Create a new storefront
 */
router.post('/',
  validateCreate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontData: CreateStorefrontRequest = req.body;
      const storefront = await StorefrontService.create(req.user!.userId, storefrontData);

      const response: ApiResponse<typeof storefront> = {
        success: true,
        data: storefront,
        message: 'Storefront created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * PUT /api/storefronts/:id - Update an existing storefront
 */
router.put('/:id',
  validateId,
  validateUpdate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.id, 10);
      const updateData: UpdateStorefrontRequest = req.body;
      const storefront = await StorefrontService.update(storefrontId, req.user!.userId, updateData);

      const response: ApiResponse<typeof storefront> = {
        success: true,
        data: storefront,
        message: 'Storefront updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * DELETE /api/storefronts/:id - Soft delete a storefront
 */
router.delete('/:id',
  validateId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.id, 10);
      await StorefrontService.delete(storefrontId, req.user!.userId);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Storefront deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

export default router;
