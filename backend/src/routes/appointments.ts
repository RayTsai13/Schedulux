/**
 * Appointment Routes - API endpoints for booking management
 *
 * All routes require authentication:
 * - Clients can book, view their appointments, and cancel
 * - Vendors can view storefront appointments, confirm, complete, and mark no-show
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppointmentService } from '../services/AppointmentService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, Appointment } from '../types';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateCreateAppointment = [
  body('storefront_id')
    .isInt({ min: 1 })
    .withMessage('storefront_id is required and must be a positive integer'),

  body('service_id')
    .isInt({ min: 1 })
    .withMessage('service_id is required and must be a positive integer'),

  body('start_datetime')
    .isISO8601()
    .withMessage('start_datetime must be a valid ISO 8601 datetime'),

  body('client_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('client_notes must be less than 1000 characters'),
];

const validateAppointmentId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid appointment ID'),
];

const validateStorefrontId = [
  param('storefrontId')
    .isInt({ min: 1 })
    .withMessage('Invalid storefront ID'),
];

const validateStatusUpdate = [
  body('status')
    .isIn(['confirmed', 'cancelled', 'completed', 'no_show'])
    .withMessage('status must be one of: confirmed, cancelled, completed, no_show'),

  body('vendor_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('vendor_notes must be less than 1000 characters'),

  body('internal_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('internal_notes must be less than 1000 characters'),
];

const validateQueryParams = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
    .withMessage('Invalid status filter'),

  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('upcoming must be a boolean'),

  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date'),
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

  if (message === 'Storefront not found' ||
      message === 'Service not found' ||
      message === 'Appointment not found') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Not found',
      message,
    };
    return res.status(404).json(response);
  }

  if (message.includes('Forbidden')) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Forbidden',
      message: 'You do not have permission to perform this action',
    };
    return res.status(403).json(response);
  }

  if (message.includes('no longer available') ||
      message.includes('Maximum concurrent') ||
      message.includes('outside working hours')) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Conflict',
      message,
    };
    return res.status(409).json(response);
  }

  if (message.includes('Cannot book') ||
      message.includes('does not belong') ||
      message.includes('not active') ||
      message.includes('Cannot transition') ||
      message.includes('can only cancel')) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Bad request',
      message,
    };
    return res.status(400).json(response);
  }

  // Unknown error
  console.error('Appointment error:', error);
  next(error);
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /appointments
 *
 * Create a new appointment (book a slot).
 * Requires authentication.
 *
 * Body:
 * - storefront_id: Required. Storefront to book at.
 * - service_id: Required. Service to book.
 * - start_datetime: Required. ISO 8601 datetime for the appointment start.
 * - client_notes: Optional. Notes for the vendor.
 *
 * Response:
 * - 201: Appointment created successfully
 * - 400: Invalid parameters
 * - 401: Not authenticated
 * - 404: Storefront or service not found
 * - 409: Slot not available (conflict)
 */
router.post(
  '/appointments',
  validateCreateAppointment,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.userId;
      const { storefront_id, service_id, start_datetime, client_notes } = req.body;

      const appointment = await AppointmentService.createAppointment(
        clientId,
        storefront_id,
        service_id,
        start_datetime,
        client_notes
      );

      const response: ApiResponse<Appointment> = {
        success: true,
        data: appointment,
        message: 'Appointment booked successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /appointments
 *
 * Get the current user's appointments (as a client).
 * Requires authentication.
 *
 * Query Parameters:
 * - status: Optional. Filter by status (pending, confirmed, etc.)
 * - upcoming: Optional. Only show future appointments (true/false)
 *
 * Response:
 * - 200: List of appointments
 * - 401: Not authenticated
 */
router.get(
  '/appointments',
  validateQueryParams,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.userId;
      const options: any = {};

      if (req.query.status) {
        options.status = req.query.status as string;
      }

      if (req.query.upcoming === 'true') {
        options.upcoming = true;
      }

      if (req.query.start_date) {
        options.startDate = new Date(req.query.start_date as string);
      }

      if (req.query.end_date) {
        options.endDate = new Date(req.query.end_date as string);
      }

      const appointments = await AppointmentService.getClientAppointments(
        clientId,
        options
      );

      const response: ApiResponse<Appointment[]> = {
        success: true,
        data: appointments,
        message: `Found ${appointments.length} appointments`,
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /appointments/:id
 *
 * Get a single appointment by ID.
 * User must be the client who booked it or the vendor who owns the storefront.
 *
 * Response:
 * - 200: Appointment details
 * - 401: Not authenticated
 * - 403: Not authorized to view
 * - 404: Appointment not found
 */
router.get(
  '/appointments/:id',
  validateAppointmentId,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const appointmentId = parseInt(req.params.id, 10);
      const userId = req.user!.userId;

      const appointment = await AppointmentService.getAppointmentById(
        appointmentId,
        userId
      );

      if (!appointment) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Not found',
          message: 'Appointment not found',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<Appointment> = {
        success: true,
        data: appointment,
        message: 'Appointment retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * PATCH /appointments/:id/status
 *
 * Update appointment status.
 * - Clients can cancel their pending/confirmed appointments
 * - Vendors can confirm, cancel, complete, or mark no-show
 *
 * Body:
 * - status: Required. New status (confirmed, cancelled, completed, no_show)
 * - vendor_notes: Optional. Notes visible to client
 * - internal_notes: Optional. Private notes for vendor
 *
 * Response:
 * - 200: Status updated successfully
 * - 400: Invalid status transition
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: Appointment not found
 */
router.patch(
  '/appointments/:id/status',
  validateAppointmentId,
  validateStatusUpdate,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const appointmentId = parseInt(req.params.id, 10);
      const userId = req.user!.userId;
      const { status, vendor_notes, internal_notes } = req.body;

      const notes: { vendor_notes?: string; internal_notes?: string } = {};
      if (vendor_notes) notes.vendor_notes = vendor_notes;
      if (internal_notes) notes.internal_notes = internal_notes;

      const appointment = await AppointmentService.updateStatus(
        appointmentId,
        userId,
        status,
        Object.keys(notes).length > 0 ? notes : undefined
      );

      const response: ApiResponse<Appointment> = {
        success: true,
        data: appointment,
        message: `Appointment ${status} successfully`,
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /storefronts/:storefrontId/appointments
 *
 * Get all appointments for a storefront (vendor access only).
 * Requires authentication and ownership of the storefront.
 *
 * Query Parameters:
 * - status: Optional. Filter by status
 * - start_date: Optional. Filter by start date (ISO 8601)
 * - end_date: Optional. Filter by end date (ISO 8601)
 *
 * Response:
 * - 200: List of appointments
 * - 401: Not authenticated
 * - 403: Not owner of storefront
 * - 404: Storefront not found
 */
router.get(
  '/storefronts/:storefrontId/appointments',
  validateStorefrontId,
  validateQueryParams,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.storefrontId, 10);
      const vendorId = req.user!.userId;

      const options: any = {};

      if (req.query.status) {
        options.status = req.query.status as string;
      }

      if (req.query.start_date) {
        options.startDate = new Date(req.query.start_date as string);
      }

      if (req.query.end_date) {
        options.endDate = new Date(req.query.end_date as string);
      }

      const appointments = await AppointmentService.getStorefrontAppointments(
        storefrontId,
        vendorId,
        options
      );

      const response: ApiResponse<Appointment[]> = {
        success: true,
        data: appointments,
        message: `Found ${appointments.length} appointments`,
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

export default router;
