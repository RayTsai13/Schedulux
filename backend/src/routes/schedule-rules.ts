/**
 * Schedule Rules Routes - API endpoints for vendor availability management
 *
 * Schedule rules define when a vendor is available (e.g., "Mondays 9-5")
 * or specific overrides (e.g., "Closed Jan 1st").
 * Routes are nested under storefronts for creation/listing, but use rule ID for updates/deletes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ScheduleRuleService } from '../services/ScheduleRuleService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, ValidationError, CreateScheduleRuleRequest, UpdateScheduleRuleRequest } from '../types';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateStorefrontId = [
  param('storefrontId')
    .isInt({ min: 1 })
    .withMessage('Invalid storefront ID')
];

const validateRuleId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid schedule rule ID')
];

const validateCreate = [
  body('service_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid service ID'),

  body('rule_type')
    .isIn(['weekly', 'daily', 'monthly'])
    .withMessage('rule_type must be weekly, daily, or monthly'),

  body('priority')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Priority must be a positive integer'),

  body('day_of_week')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('day_of_week must be between 0 (Sunday) and 6 (Saturday)'),

  body('specific_date')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('specific_date must be a valid date (YYYY-MM-DD)'),

  body('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('month must be between 1 and 12'),

  body('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('year must be between 2000 and 2100'),

  body('start_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('start_time must be in HH:MM or HH:MM:SS format'),

  body('end_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('end_time must be in HH:MM or HH:MM:SS format'),

  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available must be a boolean'),

  body('max_concurrent_appointments')
    .optional()
    .isInt({ min: 1 })
    .withMessage('max_concurrent_appointments must be a positive integer'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

const validateUpdate = [
  body('service_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid service ID'),

  body('rule_type')
    .optional()
    .isIn(['weekly', 'daily', 'monthly'])
    .withMessage('rule_type must be weekly, daily, or monthly'),

  body('priority')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Priority must be a positive integer'),

  body('day_of_week')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 6 })
    .withMessage('day_of_week must be between 0 (Sunday) and 6 (Saturday)'),

  body('specific_date')
    .optional({ nullable: true })
    .isISO8601({ strict: true })
    .withMessage('specific_date must be a valid date (YYYY-MM-DD)'),

  body('month')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 12 })
    .withMessage('month must be between 1 and 12'),

  body('year')
    .optional({ nullable: true })
    .isInt({ min: 2000, max: 2100 })
    .withMessage('year must be between 2000 and 2100'),

  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('start_time must be in HH:MM or HH:MM:SS format'),

  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('end_time must be in HH:MM or HH:MM:SS format'),

  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available must be a boolean'),

  body('max_concurrent_appointments')
    .optional()
    .isInt({ min: 1 })
    .withMessage('max_concurrent_appointments must be a positive integer'),

  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
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
  if (error.message === 'Schedule rule not found') {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Schedule rule not found'
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
 * GET /api/storefronts/:storefrontId/rules - Get all schedule rules for a storefront (PUBLIC)
 * Returns only active rules for customer view
 */
router.get('/storefronts/:storefrontId/rules',
  validateStorefrontId,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const rules = await ScheduleRuleService.getPublicByStorefront(storefrontId);

      const response: ApiResponse<typeof rules> = {
        success: true,
        data: rules,
        message: `Found ${rules.length} schedule rule${rules.length !== 1 ? 's' : ''}`
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /api/storefronts/:storefrontId/rules/all - Get ALL schedule rules including inactive (PRIVATE)
 * For vendor management view
 */
router.get('/storefronts/:storefrontId/rules/all',
  validateStorefrontId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const rules = await ScheduleRuleService.getAllByStorefront(storefrontId, req.user!.userId);

      const response: ApiResponse<typeof rules> = {
        success: true,
        data: rules,
        message: `Found ${rules.length} schedule rule${rules.length !== 1 ? 's' : ''}`
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * POST /api/storefronts/:storefrontId/rules - Create a new schedule rule (PRIVATE)
 */
router.post('/storefronts/:storefrontId/rules',
  validateStorefrontId,
  validateCreate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const ruleData: CreateScheduleRuleRequest = req.body;
      const rule = await ScheduleRuleService.create(storefrontId, req.user!.userId, ruleData);

      const response: ApiResponse<typeof rule> = {
        success: true,
        data: rule,
        message: 'Schedule rule created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /api/rules/:id - Get a single schedule rule by ID (PUBLIC)
 */
router.get('/rules/:id',
  validateRuleId,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ruleId = parseInt(req.params.id, 10);
      const rule = await ScheduleRuleService.getById(ruleId);

      const response: ApiResponse<typeof rule> = {
        success: true,
        data: rule,
        message: 'Schedule rule retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * PUT /api/rules/:id - Update a schedule rule (PRIVATE)
 */
router.put('/rules/:id',
  validateRuleId,
  validateUpdate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ruleId = parseInt(req.params.id, 10);
      const updateData: UpdateScheduleRuleRequest = req.body;
      const rule = await ScheduleRuleService.update(ruleId, req.user!.userId, updateData);

      const response: ApiResponse<typeof rule> = {
        success: true,
        data: rule,
        message: 'Schedule rule updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * DELETE /api/rules/:id - Soft delete a schedule rule (PRIVATE)
 */
router.delete('/rules/:id',
  validateRuleId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ruleId = parseInt(req.params.id, 10);
      await ScheduleRuleService.delete(ruleId, req.user!.userId);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Schedule rule deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

export default router;
