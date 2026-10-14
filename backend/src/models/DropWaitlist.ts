import { query } from '../config/database';
import { DropWaitlistEntry } from '../types';

export class DropWaitlistModel {

  /**
   * Add someone to a drop's waitlist. Re-joining with the same email is a no-op.
   * @returns true if a new entry was created
   */
  static async add(dropId: number, name: string, email: string): Promise<boolean> {
    const result = await query(
      `INSERT INTO drop_waitlist (drop_id, name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (drop_id, lower(email)) DO NOTHING
       RETURNING id`,
      [dropId, name, email]
    );
    return result.rows.length > 0;
  }

  /**
   * Claim the entries that haven't been notified yet, marking them notified in the
   * same statement so concurrent cancellations can't email the same person twice.
   */
  static async claimUnnotified(dropId: number): Promise<DropWaitlistEntry[]> {
    const result = await query(
      `UPDATE drop_waitlist
       SET notified_at = CURRENT_TIMESTAMP
       WHERE drop_id = $1 AND notified_at IS NULL
       RETURNING *`,
      [dropId]
    );
    return result.rows;
  }

  /**
   * Waitlist sizes for several drops at once (drops with no entries are omitted)
   */
  static async countByDropIds(dropIds: number[]): Promise<Map<number, number>> {
    if (dropIds.length === 0) return new Map();
    const result = await query(
      `SELECT drop_id, COUNT(*)::int AS count
       FROM drop_waitlist
       WHERE drop_id = ANY($1::int[])
       GROUP BY drop_id`,
      [dropIds]
    );
    return new Map(result.rows.map((r: { drop_id: number; count: number }) => [r.drop_id, r.count]));
  }
}
