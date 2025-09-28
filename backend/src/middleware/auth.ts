import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
const jwt = require('jsonwebtoken');

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: string;
        email: string;
    };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    message: 'Please provide a valid authentication token'
                });
            }
        
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
        const decoded = jwt.verify(token, secret) as any;

        const user = await UserService.getById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
                message: 'The authenticated user no longer exists'
            });
        }
        
        // Attach user info to request for use in route handlers
        req.user = {
            userId: user.id,
            role: user.role,
            email: user.email
        };

        // Pass control to the next function (the actual route handler)
        next();

    }   catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: 'Please log in again'
        });
    }
};