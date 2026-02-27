import multer from 'multer';
import { Request } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

export const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('image');
