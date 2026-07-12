import { Router } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { getAiReply } from '../services/aiService.js'

export const aiRouter = Router()

aiRouter.use(requireAuth)

type ChatRequestBody = {
  message?: string
}

aiRouter.post('/chat', async (req: AuthedRequest, res) => {
  const userId = req.user!.id

  const { message } = req.body as ChatRequestBody
  const text = typeof message === 'string' ? message.trim() : ''

  if (!text) return res.status(400).json({ error: 'message is required' })

  try {
    const result = await getAiReply({ userId, message: text, timeoutMs: 25_000 })
    return res.json({ reply: result.reply })
  } catch (e: any) {
    const msg = String(e?.message ?? e)

    if (msg.toLowerCase().includes('timeout')) {
      return res.status(504).json({ error: 'AI timeout' })
    }

    // Provider/network errors
    return res.status(502).json({ error: msg || 'AI request failed' })
  }
})

