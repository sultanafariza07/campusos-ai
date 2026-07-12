import { query } from '../db/index.js'
import type { Task } from '../types/tasks'

export async function getTasksForUser(userId: number): Promise<Task[]> {
  const rows = await query<any>(
    'SELECT id, title, description, due_date AS "dueDate", completed, created_at AS "createdAt" FROM tasks WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  )
  return rows;
}

export async function createTaskForUser(
  userId: number,
  taskData: { title: string; description: string | null; dueDate: string | null }
): Promise<Task> {
  const { title, description, dueDate } = taskData;
  const res = await query<Task>(
    'INSERT INTO tasks (user_id, title, description, due_date) VALUES ($1, $2, $3, $4) RETURNING id, title, description, due_date AS "dueDate", completed, created_at AS "createdAt"',
    [userId, title, description, dueDate]
  );
  return res[0];
}

export async function updateTaskForUser(
  userId: number,
  taskId: number,
  updateData: {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    completed?: boolean;
  }
): Promise<Task | null> {
  const { title, description, dueDate, completed } = updateData;

  // Build the query dynamically
  const fields: string[] = [];
  const values: (string | boolean | number | null)[] = [];
  let paramIndex = 1;

  if (title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (dueDate !== undefined) {
    fields.push(`due_date = $${paramIndex++}`);
    values.push(dueDate);
  }
  if (completed !== undefined) {
    fields.push(`completed = $${paramIndex++}`);
    values.push(completed);
  }

  if (fields.length === 0) return null;

  values.push(taskId, userId);

  const res = await query<Task>(
    `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING id, title, description, due_date AS "dueDate", completed, created_at AS "createdAt"`,
    values
  );

  return res[0] || null;
}

export async function deleteTaskForUser(userId: number, taskId: number): Promise<boolean> {
  const res = await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
  return res.rowCount > 0;
}
