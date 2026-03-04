import crypto from 'crypto';
import { query } from '../config/database';

/**
 * PasswordResetToken model — Repository pattern for password_reset_tokens table
 *
 * Handles token lifecycle:
 * - create: invalidate old tokens, generate new 32-byte hex token with 1hr expiry
 * - findValidToken: lookup unexpired, unused tokens
 * - markUsed: mark token as consumed
 */
export class PasswordResetToken {
    /**
     * Create a new password reset token for a user.
     * Invalidates any existing unused tokens for that user first.
     */
    static async create(userId: number): Promise<string> {
        // Invalidate any existing unused tokens for this user
        await query(
            `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
            [userId]
        );

        // Generate a cryptographically secure 32-byte hex token
        const token = crypto.randomBytes(32).toString('hex');

        // Token expires in 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
            [userId, token, expiresAt]
        );

        return token;
    }

    /**
     * Find a valid (unused + unexpired) token and return associated user_id.
     * Returns null if token is invalid, expired, or already used.
     */
    static async findValidToken(token: string): Promise<{ user_id: number } | null> {
        const result = await query(
            `SELECT user_id FROM password_reset_tokens
       WHERE token = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return { user_id: result.rows[0].user_id };
    }

    /**
     * Mark a token as used (consumed).
     */
    static async markUsed(token: string): Promise<void> {
        await query(
            `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE token = $1`,
            [token]
        );
    }
}
