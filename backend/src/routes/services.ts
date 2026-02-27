/**
 * Service Routes - API endpoints for service management
 *
 * Services are the offerings a vendor provides (e.g., "Haircut - 30min").
 * Routes are nested under storefronts for creation/listing, but use service ID for updates/deletes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ServiceService } from '../services/ServiceService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, ValidationError, CreateServiceRequest, UpdateServiceRequest } from '../types';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateStorefrontId = [
  param('storefrontId')
    .isInt({ min: 1 })
    .withMessage('Invalid storefront ID')
];

const validateServiceId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid service ID')
];

const validateCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be less than 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  body('duration_minutes')
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),

  body('buffer_time_minutes')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Buffer time must be between 0 and 120 minutes'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),

  body('image_url')
    .optional({ values: 'null' })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('Image URL must be a valid HTTPS URL')
    .isLength({ max: 500 })
    .withMessage('Image URL must be less than 500 characters')
];

const validateUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  body('duration_minutes')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),

  body('buffer_time_minutes')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Buffer time must be between 0 and 120 minutes'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

  body('image_url')
    .optional({ values: 'null' })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('Image URL must be a valid HTTPS URL')
    .isLength({ max: 500 })
    .withMessage('Image URL must be less than 500 characters')
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
  if (error.message === 'Service not found') {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Service not found'
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

  if (error.message.includes('required') || error.message.includes('must be')) {
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
 * GET /api/storefronts/:storefrontId/services - Get all services for a storefront (PUBLIC)
 * Returns only active services for customer view
 */
router.get('/storefronts/:storefrontId/services',
  validateStorefrontId,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const services = await ServiceService.getPublicByStorefront(storefrontId);

      const response: ApiResponse<typeof services> = {
        success: true,
        data: services,
        message: `Found ${services.length} service${services.length !== 1 ? 's' : ''}`
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /api/storefronts/:storefrontId/services/all - Get ALL services including inactive (PRIVATE)
 * For vendor management view
 */
router.get('/storefronts/:storefrontId/services/all',
  validateStorefrontId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const services = await ServiceService.getAllByStorefront(storefrontId, req.user!.userId);

      const response: ApiResponse<typeof services> = {
        success: true,
        data: services,
        message: `Found ${services.length} service${services.length !== 1 ? 's' : ''}`
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * POST /api/storefronts/:storefrontId/services - Create a new service (PRIVATE)
 */
router.post('/storefronts/:storefrontId/services',
  validateStorefrontId,
  validateCreate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const serviceData: CreateServiceRequest = req.body;
      const service = await ServiceService.create(storefrontId, req.user!.userId, serviceData);

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
        message: 'Service created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /api/services/:id - Get a single service by ID (PUBLIC)
 */
router.get('/services/:id',
  validateServiceId,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceId = parseInt(req.params.id, 10);
      const service = await ServiceService.getById(serviceId);

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
        message: 'Service retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * PUT /api/services/:id - Update a service (PRIVATE)
 */
router.put('/services/:id',
  validateServiceId,
  validateUpdate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const serviceId = parseInt(req.params.id, 10);
      const updateData: UpdateServiceRequest = req.body;
      const service = await ServiceService.update(serviceId, req.user!.userId, updateData);

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
        message: 'Service updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * DELETE /api/services/:id - Soft delete a service (PRIVATE)
 */
router.delete('/services/:id',
  validateServiceId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const serviceId = parseInt(req.params.id, 10);
      await ServiceService.delete(serviceId, req.user!.userId);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Service deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

export default router;
