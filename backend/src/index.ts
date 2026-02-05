/**
 * Express.js Server Setup
 * 
 * This file sets up the main Express server for the Schedulux application.
 * It includes all necessary middleware, routes, and error handling.
 */

// Import required Node.js and third-party modules
import { Application, Request, Response, NextFunction } from 'express';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

/**
 * Custom HTTP Request Logging Utility
 * 
 * This replaces Morgan (a popular but JavaScript-only logging library).
 * 
 * What Morgan would do:
 * - Log in Apache "Combined Log Format": 
 *   127.0.0.1 - - [20/Aug/2025:10:30:45 +0000] "GET /api/users HTTP/1.1" 200 1234
 * - Fixed format, minimal customization
 * - Requires separate @types/morgan package for TypeScript
 * 
 * What this custom logger does:
 * - Modern ISO timestamp format: [2025-08-20T10:30:45.123Z]
 * - Color-coded status indicators: 🟢 (success), 🟡 (redirect), 🔴 (error)
 * - Response time measurement in milliseconds
 * - Full TypeScript integration (no external dependencies)
 * - Easy to customize and extend
 */
const logRequest = (req: Request, res: Response, next: NextFunction) => {
  // Record when the request started (for calculating response time)
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // LOG 1: Incoming request (when it arrives)
  // This tells us someone made a request, before we process it
  console.log(`[${timestamp}] 📥 ${req.method} ${req.originalUrl} - ${req.ip || 'unknown'}`);
  
  // Capture the original response.end() function
  // We need to "hijack" this function to know when the response is complete
  const originalEnd = res.end.bind(res);
  
  // Override res.end() to add our logging when the response is sent
  // res.end() is called by Express when it's done sending the response
  res.end = ((...args: any[]) => {
    // Calculate how long the request took to process
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Color-code the status for quick visual scanning:
    // 🟢 = 200-299 (success)
    // 🟡 = 300-399 (redirects) 
    // 🔴 = 400+ (client/server errors)
    const statusColor = statusCode >= 400 ? '🔴' : statusCode >= 300 ? '🟡' : '🟢';
    
    // LOG 2: Completed response (when we're done)
    // This tells us the final outcome and how long it took
    console.log(`[${new Date().toISOString()}] ${statusColor} ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`);
    
    // Call the original end function to actually send the response
    // Without this, the response would never be sent to the client
    return originalEnd(...args);
  }) as any; // TypeScript assertion: Express has complex overloaded types for res.end
  
  // Pass control to the next middleware in the chain
  next();
};

// Import our custom modules
import { query } from './config/database';
import { ApiResponse, ApiError } from './types';
import authRoutes from './routes/auth';

// Load environment variables from .env file into process.env
dotenv.config();

// Create Express application instance
// This is the main app object that will handle all HTTP requests
const app: Application = express();

// Define the port number for the server
// Use PORT from environment variables, or default to 3000 if not specified
// parseInt() converts the string to a number, || provides fallback
const PORT = parseInt(process.env.PORT || '3000', 10);

// Define allowed origins for CORS (Cross-Origin Resource Sharing)
// In development, we allow localhost on common ports
// In production, you should specify your actual frontend domain
const allowedOrigins = [
  'http://localhost:3000',    // React development server default
  'http://localhost:3001',    // Alternative React port
  'http://localhost:5173',    // Vite development server default
  'http://localhost:5174',    // Vite development server alternative port
  'http://localhost:8080',    // Vue CLI default
  'http://127.0.0.1:3000',   // Alternative localhost format
];

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================
// Middleware functions execute in order for EVERY REQUEST
// They can modify request/response objects or terminate the request cycle

// 1. Security Headers Middleware
// helmet() adds various HTTP headers to help secure the app
// It helps prevent common vulnerabilities like XSS, clickjacking, etc.
app.use(helmet({
  // Configure Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],                   // Only allow resources from same origin by default
      styleSrc: ["'self'", "'unsafe-inline'"],  // Allow inline styles (needed for some frameworks)
      scriptSrc: ["'self'"],                    // Only allow scripts from same origin
      imgSrc: ["'self'", "data:", "https:"],    // Allow images from same origin, data URLs, and HTTPS
    },
  },
  // Enable cross-origin embedder policy
  crossOriginEmbedderPolicy: false,             // Disable for development (enable in production)
}));

// 2. CORS (Cross-Origin Resource Sharing) Middleware
// This allows frontend applications running on different ports/domains to access our API
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);  // Allow the request
    } else {
      callback(new Error('Not allowed by CORS'));  // Reject the request
    }
  },
  credentials: true,  // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],  // Allowed headers
}));

// 3. Request Logging Middleware (Custom TypeScript Implementation)
// Instead of using morgan which requires separate type definitions,
// we implement our own logging middleware with TypeScript support
// This logs HTTP requests with timestamps, status codes, and response times
app.use(logRequest);

// 4. Body Parsing Middleware
// express.json() parses incoming JSON payloads and makes them available in req.body
// limit: '10mb' sets maximum payload size to prevent abuse
// strict: true only accepts arrays and objects (not primitives)
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  // Custom error handling for JSON parsing errors
  verify: (req: Request, res: Response, buf: Buffer) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      // If JSON is invalid, we'll handle this in the error middleware
      throw new Error('Invalid JSON payload');
    }
  }
}));

// 5. URL-encoded Body Parsing Middleware
// express.urlencoded() parses form data (application/x-www-form-urlencoded)
// extended: true allows rich objects and arrays to be encoded
// This is useful for HTML forms
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// 6. Request Timestamp Middleware (Custom)
// This adds a timestamp to every request for logging purposes
// It demonstrates how to create custom middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Add timestamp to request object (extend the Request type if needed)
  (req as any).timestamp = new Date().toISOString();
  
  // Call next() to pass control to the next middleware
  // If you don't call next(), the request will hang
  next();
});

// ============================================================================
// HEALTH CHECK ROUTE
// ============================================================================
// A simple health check endpoint to verify the server is running
// This is useful for monitoring systems and deployment verification

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connectivity
    // This ensures both the server and database are working
    await query('SELECT 1 as test');
    
    // If we reach here, everything is working
    const response: ApiResponse<{ status: string; timestamp: string; uptime: number }> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()  // Server uptime in seconds
      },
      message: 'Server and database are running correctly'
    };
    
    // Send successful response with 200 status code
    res.status(200).json(response);
    
  } catch (error) {
    // If database connection fails, return error response
    console.error('Health check failed:', error);
    
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Database connection failed',
      message: 'Server is running but database is not accessible'
    };
    
    // Send error response with 503 (Service Unavailable) status code
    res.status(503).json(errorResponse);
  }
});

// ============================================================================
// API ROUTES
// ============================================================================
// Mount API routes under /api prefix
// This creates a clear separation between API endpoints and other routes

import storefrontRoutes from './routes/storefronts';
import serviceRoutes from './routes/services';
import scheduleRuleRoutes from './routes/schedule-rules';
import availabilityRoutes from './routes/availability';
import appointmentRoutes from './routes/appointments';
import marketplaceRoutes from './routes/marketplace';

// Authentication routes - handles user registration and login
app.use('/api/auth', authRoutes);

// Storefront routes - handles business location management
app.use('/api/storefronts', storefrontRoutes);

// Service routes - handles vendor service offerings
// Note: Routes are mounted at /api for both /storefronts/:id/services and /services/:id
app.use('/api', serviceRoutes);

// Schedule rules routes - handles vendor availability patterns
// Note: Routes are mounted at /api for both /storefronts/:id/rules and /rules/:id
app.use('/api', scheduleRuleRoutes);

// Availability routes - public endpoint for fetching available time slots
app.use('/api', availabilityRoutes);

// Appointment routes - handles booking management
// Note: Routes are mounted at /api for /appointments and /storefronts/:id/appointments
app.use('/api', appointmentRoutes);

// Marketplace routes - public discovery endpoints (no auth required)
// Note: Routes are mounted at /api/marketplace for public storefront search
app.use('/api/marketplace', marketplaceRoutes);

// Basic API info endpoint
app.get('/api', (req: Request, res: Response) => {
  const response: ApiResponse<{ name: string; version: string; description: string }> = {
    success: true,
    data: {
      name: 'Schedulux API',
      version: '1.0.0',
      description: 'REST API for appointment scheduling system'
    },
    message: 'Welcome to the Schedulux API'
  };
  
  res.json(response);
});

// ============================================================================
// 404 HANDLER
// ============================================================================
// This middleware catches all requests that don't match any route above
// It must be placed after all other routes but before error handling middleware

app.use('*', (req: Request, res: Response) => {
  const errorResponse: ApiResponse<null> = {
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  };
  
  // Send 404 (Not Found) status code
  res.status(404).json(errorResponse);
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
// Express error handling middleware must have 4 parameters: (err, req, res, next)
// This catches any errors thrown by previous middleware or routes

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.ip
  });

  // Determine error status code
  let statusCode = 500;  // Default to Internal Server Error
  let errorMessage = 'Internal Server Error';

  // Handle specific error types
  if (err.message === 'Invalid JSON payload') {
    statusCode = 400;  // Bad Request
    errorMessage = 'Invalid JSON in request body';
  } else if (err.message.includes('CORS')) {
    statusCode = 403;  // Forbidden
    errorMessage = 'CORS policy violation';
  } else if (err.message.includes('request entity too large')) {
    statusCode = 413;  // Payload Too Large
    errorMessage = 'Request payload too large';
  }

  // Create standardized error response
  const errorResponse: ApiResponse<null> = {
    success: false,
    error: errorMessage,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred while processing your request'  // Generic message in production
      : err.message  // Detailed message in development
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
});

// ============================================================================
// GRACEFUL SHUTDOWN HANDLING
// ============================================================================
// Handle process termination signals gracefully
// This ensures the server closes database connections and completes ongoing requests

const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close the server first (stop accepting new connections)
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);  // Exit with error code
    }
    
    console.log('Server closed successfully');
    
    // Here you could close database connections, cleanup resources, etc.
    // For example: await database.end();
    
    console.log('Graceful shutdown completed');
    process.exit(0);  // Exit successfully
  });
  
  // Force shutdown after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// ============================================================================
// SERVER STARTUP
// ============================================================================
// Start the HTTP server

const server = app.listen(PORT, () => {
  // This callback runs when the server successfully starts
  console.log('============================================');
  console.log('🚀 Schedulux Server Started');
  console.log('============================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API base URL: http://localhost:${PORT}/api`);
  console.log('============================================');
  
  // Log some system information
  console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  console.log(`⏱️  Startup time: ${Date.now() - (process.uptime() * 1000)} ms`);
  console.log('✅ Server ready to accept connections');
});

// Handle server startup errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Register shutdown handlers for different signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));  // Termination request
process.on('SIGINT', () => gracefulShutdown('SIGINT'));    // Interrupt signal (Ctrl+C)

// Don't handle SIGUSR2 in development - nodemon uses it for restarts
// Only handle SIGUSR2 in production
if (process.env.NODE_ENV === 'production') {
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));  // User-defined signal
}

// Handle uncaught exceptions (should not happen in production)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Export the Express app for testing purposes
export default app;
