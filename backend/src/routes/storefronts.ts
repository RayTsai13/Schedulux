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
import { ApiResponse, ValidationError, CreateStorefrontRequest, UpdateStorefrontRequest } from '../types';

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

  // Marketplace fields
  body('profile_type')
    .optional()
    .isIn(['individual', 'business'])
    .withMessage('profile_type must be individual or business'),

  body('location_type')
    .optional()
    .isIn(['fixed', 'mobile', 'hybrid'])
    .withMessage('location_type must be fixed, mobile, or hybrid'),

  body('service_radius')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('service_radius must be between 1 and 100 miles'),

  body('service_area_city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('service_area_city must be less than 100 characters'),

  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('avatar_url must be a valid URL'),

  // Geolocation fields (Phase 3: Marketplace Discovery)
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters')
];

/**
 * Validation for updating a storefront (all fields optional)
 */
const validateUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),

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

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

  // Marketplace fields
  body('profile_type')
    .optional()
    .isIn(['individual', 'business'])
    .withMessage('profile_type must be individual or business'),

  body('location_type')
    .optional()
    .isIn(['fixed', 'mobile', 'hybrid'])
    .withMessage('location_type must be fixed, mobile, or hybrid'),

  body('service_radius')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('service_radius must be between 1 and 100 miles'),

  body('service_area_city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('service_area_city must be less than 100 characters'),

  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('avatar_url must be a valid URL'),

  // Geolocation fields (Phase 3: Marketplace Discovery)
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters')
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

  if (error.message.includes('required')) {
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
 * GET /api/storefronts - Get all storefronts for the authenticated vendor
 */
router.get('/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefronts = await StorefrontService.getAllByVendor(req.user!.userId);

      const response: ApiResponse<typeof storefronts> = {
        success: true,
        data: storefronts,
        message: `Found ${storefronts.length} storefront${storefronts.length !== 1 ? 's' : ''}`
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
