import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import cloudinary from '../config/cloudinary';
import { ApiResponse } from '../types';

const router = Router();

/**
 * POST /api/upload/image - Upload an image to Cloudinary
 * Auth required. Accepts multipart/form-data with an "image" field.
 * Returns the optimized image URL and public_id.
 */
router.post('/image',
  authenticateToken,
  (req: Request, res: Response, next: NextFunction) => {
    uploadSingle(req, res, (err: any) => {
      if (err) {
        const message = err.code === 'LIMIT_FILE_SIZE'
          ? 'File size must be under 5MB'
          : err.message || 'Upload failed';
        return res.status(400).json({
          success: false,
          error: 'Upload error',
          message,
        } as ApiResponse<null>);
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file',
          message: 'No image file provided',
        } as ApiResponse<null>);
      }

      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'schedulux/services',
            transformation: [
              { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });

      const response: ApiResponse<{ url: string; public_id: string }> = {
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
        },
        message: 'Image uploaded successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      next(error);
    }
  }
);

export default router;
