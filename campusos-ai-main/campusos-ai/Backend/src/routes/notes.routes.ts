import { Router } from 'express'
import { query } from '../db/index.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const notesRouter = Router()

notesRouter.use(requireAuth)

notesRouter.get('/', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const rows = await query<any>(
    'SELECT id, title, content, updated_at AS updatedAt FROM notes WHERE user_id=$1 ORDER BY updated_at DESC',
    [userId]
  )
  return res.json({ notes: rows })
})


notesRouter.get('/:id', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const noteId = Number(req.params.id)
  if (!Number.isFinite(noteId)) return res.status(400).json({ error: 'invalid id' })

  const rows = await query<any>(
    'SELECT id, title, content, updated_at AS updatedAt FROM notes WHERE id=$1 AND user_id=$2',
    [noteId, userId]
  )

  if (!rows[0]) return res.status(404).json({ error: 'note not found' })
  return res.json({ note: rows[0] })
})


// POST /api/notes (create)
notesRouter.post('/', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const { title, content } = req.body as { title?: string; content?: string }

  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })

  const trimmedTitle = title.trim()
  const trimmedContent = (content ?? '').trim()

  const rows = await query<any>(
    'INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING id, title, content, updated_at AS updatedAt',
    [trimmedTitle, trimmedContent, userId]
  )

  return res.status(201).json({ note: rows[0] })
})


// PUT /api/notes/:id (update)
notesRouter.put('/:id', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const noteId = Number(req.params.id)
  if (!Number.isFinite(noteId)) return res.status(400).json({ error: 'invalid id' })

  const { title, content } = req.body as { title?: string; content?: string }
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })

  const trimmedTitle = title.trim()
  const trimmedContent = (content ?? '').trim()

  const rows = await query<any>(
    'UPDATE notes SET title=$1, content=$2, updated_at=NOW() WHERE id=$3 AND user_id=$4 RETURNING id, title, content, updated_at AS updatedAt',
    [trimmedTitle, trimmedContent, noteId, userId]
  )

  if (!rows[0]) return res.status(404).json({ error: 'note not found' })
  return res.json({ note: rows[0] })
})

notesRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const noteId = Number(req.params.id)
  if (!Number.isFinite(noteId)) return res.status(400).json({ error: 'invalid id' })

  await query('DELETE FROM notes WHERE id=$1 AND user_id=$2', [noteId, userId])
  return res.status(204).send()
})


