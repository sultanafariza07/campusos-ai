import { query } from '../db/index.js';
import { UserSettings } from '../types/settings';

export async function getSettingsForUser(userId: number): Promise<UserSettings> {
  let { rows } = await query('SELECT * FROM settings WHERE user_id = $1', [userId]);

  if (rows.length === 0) {
    // Create default settings if they don't exist
    const { rows: newRows } = await query(
      'INSERT INTO settings (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    rows = newRows;
  }

  return rows[0];
}

export async function updateSettingsForUser(
  userId: number,
  updateData: Partial<Pick<UserSettings, 'notifications' | 'emailNotifications' | 'aiSuggestions'>>
): Promise<UserSettings | null> {
  const fields: string[] = [];
  const values: (boolean | number)[] = [];
  let paramIndex = 1;

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (fields.length === 0) return null;

  values.push(userId);

  const { rows } = await query(`UPDATE settings SET ${fields.join(', ')} WHERE user_id = $${paramIndex++} RETURNING *`, values);
  return rows[0] || null;
}