import { Router } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const assistantRouter = Router()

// Phase 4: AI Assistant
// This implementation uses an LLM provider via API key.
// It can be swapped later without changing the frontend contract.

assistantRouter.use(requireAuth)

type ChatRequest = {
  message?: string
}

assistantRouter.post('/chat', async (req: AuthedRequest, res) => {
  const userId = req.user!.id
  const { message } = req.body as ChatRequest

  if (!message?.trim()) return res.status(400).json({ error: 'message is required' })

  // Provider: OpenAI-compatible chat completions.
  // To keep this repo lightweight, we support a configurable endpoint.
  // Required env vars:
  // - OPENAI_API_KEY
  // - OPENAI_MODEL (optional, default: gpt-4o-mini)
  // Optional:
  // - OPENAI_BASE_URL (optional, default: https://api.openai.com/v1)
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.trim().length === 0) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY on server' })
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')

  const prompt =
    `You are CampusOS AI, a helpful assistant for college productivity.\n` +
    `UserId: ${userId}\n` +
    `User message: ${message.trim()}\n\n` +
    `Respond concisely with actionable guidance.`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are CampusOS AI.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    })

    const data: any = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errMsg = data?.error?.message || `LLM request failed: ${response.status}`
      return res.status(502).json({ error: errMsg })
    }

    const text: string | undefined = data?.choices?.[0]?.message?.content
    return res.json({ reply: text ?? '' })
  } catch (e: any) {
    return res.status(502).json({ error: e?.message ?? 'AI request failed' })
  }
})

