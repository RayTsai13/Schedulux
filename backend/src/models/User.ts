import { query } from '../config/database';
import { User, CreateUserRequest } from '../types';

export class UserModel {
  static async findById(id: number): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    return result.rows[0] || null;
  }

  static async create(userData: CreateUserRequest & { password_hash: string }): Promise<User> {
    const {
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role,
      timezone = 'UTC'
    } = userData;

    const result = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, timezone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [email, password_hash, first_name, last_name, phone, role, timezone]);

    return result.rows[0];
  }

  static async findByRole(role: string): Promise<User[]> {
    const result = await query('SELECT * FROM users WHERE role = $1 AND deleted_at IS NULL', [role]);
    return result.rows;
  }

  static async update(id: number, updates: Partial<User>): Promise<User | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const result = await query(`
      UPDATE users 
      SET ${setClause}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, values);

    return result.rows[0] || null;
  }

  static async softDelete(id: number): Promise<boolean> {
    const result = await query(`
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `, [id]);

    return result.rows.length > 0;
  }
}
