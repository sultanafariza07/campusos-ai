import { query } from '../db/index.js';
import { AnalyticsData } from '../types/analytics';

export async function getAnalyticsForUser(userId: number): Promise<AnalyticsData> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const tasksPromise = query(
    'SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed FROM tasks WHERE user_id = $1',
    [userId]
  );

  const notesPromise = query('SELECT COUNT(*) as total FROM notes WHERE user_id = $1', [userId]);

  const aiChatsPromise = query('SELECT COUNT(*) as total FROM ai_chats WHERE user_id = $1', [userId]);

  const studySessionsPromise = query(
    'SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed FROM study_sessions WHERE user_id = $1',
    [userId]
  );

  const weeklyActivityPromise = query(`
    WITH all_days AS (
      SELECT generate_series(date_trunc('week', NOW()), date_trunc('week', NOW()) + interval '6 days', '1 day')::date AS day
    )
    SELECT
      TO_CHAR(d.day, 'Dy') as day,
      COALESCE(t.count, 0) as tasks,
      COALESCE(n.count, 0) as notes,
      COALESCE(s.count, 0) as study
    FROM all_days d
    LEFT JOIN (SELECT created_at::date, COUNT(*) FROM tasks WHERE user_id = $1 AND created_at >= date_trunc('week', NOW()) GROUP BY 1) t ON t.created_at = d.day
    LEFT JOIN (SELECT created_at::date, COUNT(*) FROM notes WHERE user_id = $1 AND created_at >= date_trunc('week', NOW()) GROUP BY 1) n ON n.created_at = d.day
    LEFT JOIN (SELECT created_at::date, COUNT(*) FROM study_sessions WHERE user_id = $1 AND created_at >= date_trunc('week', NOW()) GROUP BY 1) s ON s.created_at = d.day
    ORDER BY d.day;
  `, [userId]);

  const [
    tasksResult,
    notesResult,
    aiChatsResult,
    studySessionsResult,
    weeklyActivityResult,
  ] = await Promise.all([
    tasksPromise,
    notesPromise,
    aiChatsPromise,
    studySessionsPromise,
    weeklyActivityPromise,
  ]);

  const tasksCompleted = Number(tasksResult.rows[0].completed || 0);
  const tasksTotal = Number(tasksResult.rows[0].total || 0);
  const notesCreated = Number(notesResult.rows[0].total || 0);
  const aiChats = Number(aiChatsResult.rows[0].total || 0);
  const studySessionsCompleted = Number(studySessionsResult.rows[0].completed || 0);
  const studySessionsTotal = Number(studySessionsResult.rows[0].total || 0);

  const tasksPending = tasksTotal - tasksCompleted;
  const studySessionsPending = studySessionsTotal - studySessionsCompleted;

  // Productivity Score Calculation
  const score =
    tasksCompleted * 2 +
    studySessionsCompleted * 2 +
    notesCreated +
    Math.floor(aiChats / 10);

  const productivityScore = Math.min(100, Math.round(score));

  return {
    tasksCompleted,
    tasksPending,
    notesCreated,
    aiChats,
    studySessionsCompleted,
    studySessionsPending,
    productivityScore,
    weeklyActivity: weeklyActivityResult.rows.map(r => ({
        day: r.day.trim(),
        tasks: Number(r.tasks),
        notes: Number(r.notes),
        study: Number(r.study)
    })),
  };
}