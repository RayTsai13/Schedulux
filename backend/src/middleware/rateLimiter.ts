import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../types';

// Strict limiter for auth endpoints (login, register, forgot-password)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        message: 'Too many attempts. Please try again in 15 minutes.',
    } as ApiResponse<null>,
});

// General API limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        message: 'Too many requests. Please slow down.',
    } as ApiResponse<null>,
});
