/**
 * Marketplace Routes - Public Discovery API
 *
 * These endpoints are PUBLIC (no authentication required) to enable
 * frictionless storefront discovery for potential clients.
 *
 * Endpoints:
 * - GET /api/marketplace/search - Search for storefronts
 * - GET /api/marketplace/storefronts/:id - Get storefront details
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, param, validationResult } from 'express-validator';
import { MarketplaceService } from '../services/MarketplaceService';
import { ApiResponse } from '../types';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateSearch = [
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  query('radius')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 miles'),

  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),

  query('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),

  query('query')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must be less than 200 characters'),

  query('location_type')
    .optional()
    .isIn(['fixed', 'mobile', 'hybrid'])
    .withMessage('Location type must be fixed, mobile, or hybrid'),

  query('profile_type')
    .optional()
    .isIn(['individual', 'business'])
    .withMessage('Profile type must be individual or business'),

  query('verified_only')
    .optional()
    .isBoolean()
    .withMessage('Verified_only must be a boolean'),

  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),

  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),

  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

const validateStorefrontId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid storefront ID')
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
      data: errorMessages as any
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

  // Unknown error
  console.error('Marketplace error:', error);
  next(error);
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/marketplace/search
 *
 * Public storefront search (no authentication required)
 *
 * Query Parameters:
 * - latitude, longitude, radius: Geographic search
 * - city, state: Text-based fallback search
 * - query: Free-text search (name, description)
 * - location_type: Filter by fixed/mobile/hybrid
 * - profile_type: Filter by individual/business
 * - verified_only: Show only verified vendors
 * - category: Filter by service category
 * - min_price, max_price: Price range filter
 * - limit, offset: Pagination
 *
 * Response:
 * - 200: Search results with storefront data
 * - 400: Invalid parameters
 */
router.get(
  '/search',
  validateSearch,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse query parameters
      const searchQuery: any = {};

      if (req.query.latitude) searchQuery.latitude = parseFloat(req.query.latitude as string);
      if (req.query.longitude) searchQuery.longitude = parseFloat(req.query.longitude as string);
      if (req.query.radius) searchQuery.radius = parseInt(req.query.radius as string);
      if (req.query.city) searchQuery.city = req.query.city as string;
      if (req.query.state) searchQuery.state = req.query.state as string;
      if (req.query.query) searchQuery.query = req.query.query as string;
      if (req.query.location_type) searchQuery.location_type = req.query.location_type as string;
      if (req.query.profile_type) searchQuery.profile_type = req.query.profile_type as string;
      if (req.query.verified_only) searchQuery.verified_only = req.query.verified_only === 'true';
      if (req.query.category) searchQuery.category = req.query.category as string;
      if (req.query.min_price) searchQuery.min_price = parseFloat(req.query.min_price as string);
      if (req.query.max_price) searchQuery.max_price = parseFloat(req.query.max_price as string);
      if (req.query.limit) searchQuery.limit = parseInt(req.query.limit as string);
      if (req.query.offset) searchQuery.offset = parseInt(req.query.offset as string);

      const result = await MarketplaceService.searchStorefronts(searchQuery);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `Found ${result.storefronts.length} storefronts`
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

/**
 * GET /api/marketplace/storefronts/:id
 *
 * Get public storefront details with service listings (no auth required)
 *
 * Response:
 * - 200: Storefront details with services
 * - 404: Storefront not found or inactive
 */
router.get(
  '/storefronts/:id',
  validateStorefrontId,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storefrontId = parseInt(req.params.id);

      const storefront = await MarketplaceService.getPublicStorefront(storefrontId);

      if (!storefront) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Not found',
          message: 'Storefront not found or is not active'
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<typeof storefront> = {
        success: true,
        data: storefront,
        message: 'Storefront retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
);

export default router;
