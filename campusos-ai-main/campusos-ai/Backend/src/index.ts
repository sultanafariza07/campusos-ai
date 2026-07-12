import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { config } from './config.js'
import { authRouter } from './routes/auth.routes.js'
import { notesRouter } from './routes/notes.routes.js'
import { tasksRouter } from './routes/tasks.routes.js'
import { assistantRouter } from './routes/assistant.routes.js'
import { aiRouter } from './routes/ai.routes.js'
import { studyPlannerRouter } from './routes/studyPlanner.routes.js'
import { errorHandler } from './middleware/errorHandler.js'


const app = express()


app.use(helmet())
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/notes', notesRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/assistant', assistantRouter)
app.use('/api/ai', aiRouter)
app.use('/api/study-planner', studyPlannerRouter)


app.get('/', (_req: express.Request, res: express.Response) => {

  res.json({
    message: 'CampusOS AI Backend Running 🚀',
  })
})

// Custom error handler (must be after routes, before generic handler)
app.use(errorHandler)

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled backend error:', err)

  if (res.headersSent) return

  const message =
    err?.message ||
    (typeof err === 'string' ? err : null) ||
    'Internal server error'

  res.status(500).json({
    error: 'Internal server error',
    message,
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  })
})

// Basic 404 handler (must be the last `app.use`)
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
})


app.listen(config.PORT, () => {
  console.log(`CampusOS AI Backend listening on http://localhost:${config.PORT}`)
})
