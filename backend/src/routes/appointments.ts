/**
 * Appointment Routes - API endpoints for booking management
 *
 * - Guests book without an account (POST /appointments) and manage their
 *   booking with the secret token they receive (/bookings/:token)
 * - Vendors (authenticated) view storefront appointments, approve, decline,
 *   cancel, complete, and mark no-show
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppointmentService } from '../services/AppointmentService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { bookingLimiter } from '../middleware/rateLimiter';
import { ApiResponse, Appointment, ManagedAppointment } from '../types';

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

  body('drop_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('drop_id must be a positive integer'),

  body('guest_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('guest_name is required and must be less than 100 characters'),

  body('guest_email')
    .trim()
    .isEmail()
    .isLength({ max: 255 })
    .withMessage('guest_email must be a valid email address'),

  body('guest_phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[+()\-.\s\d]{7,30}$/)
    .withMessage('guest_phone must be a valid phone number'),
];

const validateManageToken = [
  param('token')
    .isHexadecimal()
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid booking link'),
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
    .isIn(['confirmed', 'cancelled', 'completed', 'no_show', 'declined'])
    .withMessage('status must be one of: confirmed, cancelled, completed, no_show, declined'),

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

// Validation for approval workflow endpoints
const validateApprovalNotes = [
  body('vendor_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('vendor_notes must be less than 1000 characters'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('reason must be less than 1000 characters'),
];

const validateQueryParams = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'declined'])
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
    // Same response for unknown tokens and missing rows, so tokens can't be probed
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
      message.includes('can only cancel') ||
      message.includes('Cannot approve') ||
      message.includes('Cannot decline') ||
      message.includes('Only vendors can') ||
      message.includes('Cannot reschedule')) {
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
 * Book a slot as a guest (no account required).
 *
 * Body:
 * - storefront_id: Required. Storefront to book at.
 * - service_id: Required. Service to book.
 * - start_datetime: Required. ISO 8601 datetime for the appointment start.
 * - guest_name, guest_email: Required. Contact details.
 * - guest_phone: Optional.
 * - client_notes: Optional. Notes for the vendor.
 * - drop_id: Optional. The drop this booking is for.
 *
 * Response:
 * - 201: Appointment created; includes manage_token for /bookings/:token
 * - 400: Invalid parameters
 * - 404: Storefront or service not found
 * - 409: Slot not available (conflict)
 * - 429: Too many bookings from this IP
 */
router.post(
  '/appointments',
  bookingLimiter,
  validateCreateAppointment,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        storefront_id,
        service_id,
        start_datetime,
        client_notes,
        drop_id,
        guest_name,
        guest_email,
        guest_phone,
      } = req.body;

      const appointment = await AppointmentService.createAppointment(
        { name: guest_name, email: guest_email, phone: guest_phone || undefined },
        storefront_id,
        service_id,
        start_datetime,
        client_notes,
        drop_id
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

// ============================================================================
// GUEST SELF-SERVICE ROUTES (authorized by manage token)
// ============================================================================

/**
 * GET /bookings/:token
 *
 * View a booking using its manage token.
 */
router.get(
  '/bookings/:token',
  validateManageToken,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointment = await AppointmentService.getByManageToken(req.params.token);

      const response: ApiResponse<ManagedAppointment> = {
        success: true,
        data: appointment,
        message: 'Booking retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * POST /bookings/:token/cancel
 *
 * Guest cancels their booking.
 */
router.post(
  '/bookings/:token/cancel',
  bookingLimiter,
  validateManageToken,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointment = await AppointmentService.cancelByManageToken(req.params.token);

      const response: ApiResponse<ManagedAppointment> = {
        success: true,
        data: appointment,
        message: 'Booking cancelled',
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * POST /bookings/:token/reschedule
 *
 * Atomically cancel the booking and rebook at a new time.
 *
 * Body:
 * - start_datetime: Required. ISO 8601 datetime for the new start.
 *
 * Response:
 * - 200: { cancelled, new } — the new booking has a new manage_token
 * - 409: New slot not available (original booking untouched)
 */
router.post(
  '/bookings/:token/reschedule',
  bookingLimiter,
  validateManageToken,
  [
    body('start_datetime')
      .isISO8601()
      .withMessage('start_datetime must be a valid ISO 8601 datetime'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AppointmentService.rescheduleByManageToken(
        req.params.token,
        req.body.start_datetime
      );

      const response: ApiResponse<{ cancelled: ManagedAppointment; new: ManagedAppointment }> = {
        success: true,
        data: result,
        message: 'Booking rescheduled successfully',
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

// ============================================================================
// VENDOR ROUTES
// ============================================================================

/**
 * GET /appointments/:id
 *
 * Get a single appointment by ID (vendor who owns the storefront).
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
 * Update appointment status (vendor only): confirm, cancel, complete, or mark no-show.
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

// ============================================================================
// APPROVAL WORKFLOW ROUTES
// ============================================================================

/**
 * POST /appointments/:id/approve
 *
 * Approve a pending appointment request (vendor only).
 * Transitions the appointment from 'pending' to 'confirmed'.
 *
 * Body:
 * - vendor_notes: Optional. Notes to send to the client
 *
 * Response:
 * - 200: Appointment approved successfully
 * - 400: Appointment not in pending state
 * - 401: Not authenticated
 * - 403: Not the owner of the storefront
 * - 404: Appointment not found
 */
router.post(
  '/appointments/:id/approve',
  validateAppointmentId,
  validateApprovalNotes,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const appointmentId = parseInt(req.params.id, 10);
      const vendorId = req.user!.userId;
      const { vendor_notes } = req.body;

      const appointment = await AppointmentService.approveRequest(
        appointmentId,
        vendorId,
        vendor_notes
      );

      const response: ApiResponse<Appointment> = {
        success: true,
        data: appointment,
        message: 'Appointment approved successfully',
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * POST /appointments/:id/decline
 *
 * Decline a pending appointment request (vendor only).
 * Transitions the appointment from 'pending' to 'declined'.
 *
 * Body:
 * - reason: Optional. Reason for declining (visible to client)
 *
 * Response:
 * - 200: Appointment declined successfully
 * - 400: Appointment not in pending state
 * - 401: Not authenticated
 * - 403: Not the owner of the storefront
 * - 404: Appointment not found
 */
router.post(
  '/appointments/:id/decline',
  validateAppointmentId,
  validateApprovalNotes,
  handleValidationErrors,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const appointmentId = parseInt(req.params.id, 10);
      const vendorId = req.user!.userId;
      const { reason } = req.body;

      const appointment = await AppointmentService.declineRequest(
        appointmentId,
        vendorId,
        reason
      );

      const response: ApiResponse<Appointment> = {
        success: true,
        data: appointment,
        message: 'Appointment declined',
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

export default router;
