import { query } from '../db/index.js';
import type { StudySession } from '../types/studyPlanner';

export async function getSessionsForUser(userId: number): Promise<StudySession[]> {
  const { rows } = await query(
    'SELECT id, user_id AS "userId", subject, topic, TO_CHAR(study_date, \'YYYY-MM-DD\') AS "studyDate", completed, created_at AS "createdAt", updated_at AS "updatedAt" FROM study_sessions WHERE user_id = $1 ORDER BY study_date DESC, created_at DESC',
    [userId]
  );
  return rows;
}

export async function createSessionForUser(
  userId: number,
  sessionData: { subject: string; topic: string; studyDate: string }
): Promise<StudySession> {
  const { subject, topic, studyDate } = sessionData;
  const { rows } = await query(
    'INSERT INTO study_sessions (user_id, subject, topic, study_date) VALUES ($1, $2, $3, $4) RETURNING id, user_id AS "userId", subject, topic, TO_CHAR(study_date, \'YYYY-MM-DD\') AS "studyDate", completed, created_at AS "createdAt", updated_at AS "updatedAt"',
    [userId, subject, topic, studyDate]
  );
  return rows[0];
}

export async function updateSessionForUser(
  userId: number,
  sessionId: number,
  updateData: Partial<{ subject: string; topic: string; studyDate: string; completed: boolean }>
): Promise<StudySession | null> {
  const fields: string[] = [];
  const values: (string | boolean | number)[] = [];
  let paramIndex = 1;

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbKey = key === 'studyDate' ? 'study_date' : key;
      fields.push(`${dbKey} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (fields.length === 0) return null;

  values.push(sessionId, userId);

  const { rows } = await query(
    `UPDATE study_sessions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING id, user_id AS "userId", subject, topic, TO_CHAR(study_date, \'YYYY-MM-DD\') AS "studyDate", completed, created_at AS "createdAt", updated_at AS "updatedAt"`,
    values
  );

  return rows[0] || null;
}

export async function deleteSessionForUser(
  userId: number,
  sessionId: number
): Promise<boolean> {
  const result = await query(
    'DELETE FROM study_sessions WHERE id = $1 AND user_id = $2',
    [sessionId, userId]
  );
  return result.rowCount > 0;
}