import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'
import { config } from '../config.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { rateLimit } from '../middleware/rateLimit.js'

export const authRouter = Router()

authRouter.post('/register', rateLimit({ windowMs: 60 * 1000, max: 10 }), asyncHandler(async (req, res) => {
  // Basic validation
  const { name, email, password, branch, year } = req.body
  if (!name || typeof name !== 'string' || name.length > 255) return res.status(400).json({ error: 'Invalid name' })
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' })
  if (!password || typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  if (branch && typeof branch !== 'string') return res.status(400).json({ error: 'Invalid branch' })
  if (year && typeof year !== 'string') return res.status(400).json({ error: 'Invalid year' })
  
  const passwordHash = await bcrypt.hash(password, 10)

  const result = await query<{ id: number }>(`
    INSERT INTO users (name, email, password_hash, branch, year)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [name, email.toLowerCase(), passwordHash, branch || null, year || null])
  
  res.status(201).json({ id: result[0].id })
}))

authRouter.post('/login', rateLimit({ windowMs: 60 * 1000, max: 20 }), asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email is required' })
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'password is required' })

  const users = await query<{ id: number; name: string; email: string; password_hash: string; branch: string | null; year: string | null }>(
    'SELECT id, name, email, password_hash, branch, year FROM users WHERE email=$1 LIMIT 1',
    [email.trim().toLowerCase()]
  )

  const user = users[0]
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' })

  const token = jwt.sign({ sub: String(user.id) }, config.JWT_SECRET as jwt.Secret, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  })

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      branch: user.branch,
      year: user.year,
    }
  })
}))

authRouter.get('/profile', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const rows = await query<{ id: number; name: string; email: string; branch: string | null; year: string | null }>(
    'SELECT id, name, email, branch, year FROM users WHERE id=$1',
    [userId]
  )

  if (!rows[0]) return res.status(404).json({ error: 'user not found' })
  res.json({ user: rows[0] })
}))

authRouter.patch('/profile', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const { name, branch, year } = req.body

  // Validate inputs: only allow valid, non-empty strings.
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'Invalid name' })
  }
  if (branch !== undefined && typeof branch !== 'string') {
    return res.status(400).json({ error: 'Invalid branch' })
  }
  if (year !== undefined && typeof year !== 'string') {
    return res.status(400).json({ error: 'Invalid year' })
  }

  const updates: Record<string, any> = {}
  if (name !== undefined) updates.name = name.trim()
  if (branch !== undefined) updates.branch = branch || null
  if (year !== undefined) updates.year = year || null

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No update fields provided' })
  }

  const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ')
  const values = Object.values(updates)

  const result = await query('UPDATE users SET ' + setClauses + ' WHERE id = $' + (values.length + 1) + ' RETURNING *', [...values, userId])

  res.json({ user: result[0] })
}))
