import { Router } from 'express'
import { query } from '../db/index.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const studyPlannerRouter = Router()

studyPlannerRouter.use(requireAuth)

type CreateStudyPlannerBody = {
  subject?: string
  topic?: string
  study_date?: string
  completed?: boolean
}

type UpdateStudyPlannerBody = {
  subject?: string
  topic?: string
  study_date?: string | null
  completed?: boolean
}

function parseRequiredString(v: unknown): string | null {
  return typeof v === 'string' ? v.trim() : null
}

function parseStudyDate(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  const d = new Date(`${s}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  // Keep original YYYY-MM-DD if user provided it; otherwise normalize.
  return s
}

studyPlannerRouter.get('/', async (req: AuthedRequest, res) => {
  const userId = req.user!.id

  const rows = await query<any>(
    'SELECT id, subject, topic, study_date AS studyDate, completed, created_at AS createdAt FROM study_planner WHERE user_id=$1 ORDER BY study_date ASC, created_at DESC',
    [userId]
  )

  return res.json({ sessions: rows })
})

studyPlannerRouter.post('/', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const { subject, topic, study_date, completed } = req.body as CreateStudyPlannerBody

  const tSubject = parseRequiredString(subject)
  const tTopic = parseRequiredString(topic)
  const tStudyDate = parseStudyDate(study_date)

  if (!tSubject) return res.status(400).json({ error: 'subject is required' })
  if (!tTopic) return res.status(400).json({ error: 'topic is required' })
  if (!tStudyDate) return res.status(400).json({ error: 'studyDate is required' })

  const rows = await query<any>(
    'INSERT INTO study_planner (subject, topic, study_date, completed, user_id) VALUES ($1, $2, $3, COALESCE($4,false), $5) RETURNING id, subject, topic, study_date AS studyDate, completed, created_at AS createdAt',
    [tSubject, tTopic, tStudyDate, typeof completed === 'boolean' ? completed : false, userId]
  )

  return res.status(201).json({ session: rows[0] })
})

studyPlannerRouter.put('/:id', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const sessionId = Number(req.params.id)
  if (!Number.isFinite(sessionId)) return res.status(400).json({ error: 'invalid id' })

  const { subject, topic, study_date, completed } = req.body as UpdateStudyPlannerBody

  const tSubject = subject === undefined ? undefined : parseRequiredString(subject)
  const tTopic = topic === undefined ? undefined : parseRequiredString(topic)
  const tStudyDate = study_date === undefined ? undefined : parseStudyDate(study_date)

  if (tSubject !== undefined && !tSubject) return res.status(400).json({ error: 'subject cannot be empty' })
  if (tTopic !== undefined && !tTopic) return res.status(400).json({ error: 'topic cannot be empty' })
  if (tStudyDate !== undefined && !tStudyDate) return res.status(400).json({ error: 'studyDate cannot be empty' })

  const rows = await query<any>(
    `UPDATE study_planner
     SET subject = COALESCE($1, subject),
         topic = COALESCE($2, topic),
         study_date = COALESCE($3, study_date),
         completed = COALESCE($4, completed)
     WHERE id=$5 AND user_id=$6
     RETURNING id, subject, topic, study_date AS studyDate, completed, created_at AS createdAt`,
    [
      tSubject ?? null,
      tTopic ?? null,
      tStudyDate ?? null,
      typeof completed === 'boolean' ? completed : null,
      sessionId,
      userId,
    ]
  )

  if (!rows[0]) return res.status(404).json({ error: 'study session not found' })
  return res.json({ session: rows[0] })
})

studyPlannerRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const sessionId = Number(req.params.id)
  if (!Number.isFinite(sessionId)) return res.status(400).json({ error: 'invalid id' })

  await query('DELETE FROM study_planner WHERE id=$1 AND user_id=$2', [sessionId, userId])
  return res.status(204).send()
})

