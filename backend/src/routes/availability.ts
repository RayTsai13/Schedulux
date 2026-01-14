/**
 * Availability Routes - Public API endpoint for fetching available time slots
 *
 * This is a PUBLIC endpoint (no authentication required) that allows clients
 * to view available appointment slots for a storefront's services.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import { AvailabilityService } from '../services/AvailabilityService';
import { ApiResponse } from '../types';
import { AvailabilityResponse } from '../types/availability';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateStorefrontId = [
  param('storefrontId')
    .isInt({ min: 1 })
    .withMessage('Invalid storefront ID'),
];

const validateAvailabilityQuery = [
  query('service_id')
    .isInt({ min: 1 })
    .withMessage('service_id is required and must be a positive integer'),

  query('start_date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('start_date must be in YYYY-MM-DD format'),

  query('end_date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('end_date must be in YYYY-MM-DD format'),
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      if ('path' in err) {
        return { field: err.path, message: err.msg };
      }
      return { field: 'unknown', message: err.msg };
    });

    const response: ApiResponse<null> = {
      success: false,
      error: 'Validation failed',
      message: 'Please check your input and try again',
      data: errorMessages as any,
    };

    return res.status(400).json(response);
  }
  next();
};

/**
 * Handle service errors
 */
const handleServiceError = (
  error: any,
  res: Response,
  next: NextFunction
) => {
  const message = error.message || 'An error occurred';

  if (message === 'Storefront not found' || message === 'Service not found') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Not found',
      message,
    };
    return res.status(404).json(response);
  }

  if (message.includes('does not belong') || message.includes('not active')) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Bad request',
      message,
    };
    return res.status(400).json(response);
  }

  if (message.includes('Date range') || message.includes('Start date')) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Bad request',
      message,
    };
    return res.status(400).json(response);
  }

  // Unknown error
  console.error('Availability error:', error);
  next(error);
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /storefronts/:storefrontId/availability
 *
 * Get available appointment slots for a service over a date range.
 * This is a PUBLIC endpoint - no authentication required.
 *
 * Query Parameters:
 * - service_id: Required. The service to get availability for.
 * - start_date: Required. Start of date range (YYYY-MM-DD in storefront timezone).
 * - end_date: Required. End of date range (YYYY-MM-DD in storefront timezone).
 *
 * Response:
 * - 200: List of available slots with capacity information
 * - 400: Invalid parameters
 * - 404: Storefront or service not found
 */
router.get(
  '/storefronts/:storefrontId/availability',
  validateStorefrontId,
  validateAvailabilityQuery,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const serviceId = parseInt(req.query.service_id as string, 10);
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      const availability = await AvailabilityService.getAvailableSlots(
        storefrontId,
        serviceId,
        startDate,
        endDate
      );

      const response: ApiResponse<AvailabilityResponse> = {
        success: true,
        data: availability,
        message: `Found ${availability.slots.length} available slots`,
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

export default router;
