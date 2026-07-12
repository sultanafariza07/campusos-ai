import { Router } from 'express'
import { query } from '../db/index.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { getTasksForUser } from '../services/tasksService.js'


export const tasksRouter = Router()

tasksRouter.use(requireAuth)

tasksRouter.get('/', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const rows = await getTasksForUser(userId)

  return res.json({ tasks: rows })
})


tasksRouter.post('/', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const { title, description, due_date, completed } = req.body as {
    title?: string
    description?: string
    due_date?: string
    completed?: boolean
  }

  const trimmedTitle = typeof title === 'string' ? title.trim() : ''
  const trimmedDescription = typeof description === 'string' ? description.trim() : ''

  if (!trimmedTitle) return res.status(400).json({ error: 'title is required' })

  const due = due_date ? String(due_date) : null
  const rows = await query<any>(
    'INSERT INTO tasks (title, description, due_date, completed, user_id) VALUES ($1, $2, $3, COALESCE($4,false), $5) RETURNING id, title, description, due_date AS dueDate, completed, created_at AS createdAt',
    [
      trimmedTitle,
      trimmedDescription,
      due,
      typeof completed === 'boolean' ? completed : false,
      userId,
    ]
  )

  return res.status(201).json({ task: rows[0] })
})

tasksRouter.put('/:id', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const taskId = Number(req.params.id)
  if (!Number.isFinite(taskId)) return res.status(400).json({ error: 'invalid id' })

  const { title, description, due_date, completed } = req.body as {
    title?: string
    description?: string
    due_date?: string | null
    completed?: boolean
  }

  const trimmedTitle = typeof title === 'string' ? title.trim() : undefined
  const trimmedDescription = typeof description === 'string' ? description.trim() : undefined

  if (typeof title === 'string' && !trimmedTitle) {
    return res.status(400).json({ error: 'title cannot be empty' })
  }

  const rows = await query<any>(
    `UPDATE tasks
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         due_date = COALESCE($3, due_date),
         completed = COALESCE($4, completed)
     WHERE id=$5 AND user_id=$6
     RETURNING id, title, description, due_date AS dueDate, completed, created_at AS createdAt`,
    [
      trimmedTitle ?? null,
      trimmedDescription ?? null,
      due_date ?? null,
      typeof completed === 'boolean' ? completed : null,
      taskId,
      userId,
    ]
  )

  if (!rows[0]) return res.status(404).json({ error: 'task not found' })
  return res.json({ task: rows[0] })
})

tasksRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const taskId = Number(req.params.id)
  if (!Number.isFinite(taskId)) return res.status(400).json({ error: 'invalid id' })

  await query(
    'DELETE FROM tasks WHERE id=$1 AND user_id=$2',
    [taskId, userId]
  )

  return res.status(204).send()
})

