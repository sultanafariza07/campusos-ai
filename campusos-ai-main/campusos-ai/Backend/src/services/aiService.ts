// Fetch-based call (no OpenAI SDK dependency required).
// This avoids runtime crashes and missing type dependencies.

export type GetAiReplyParams = {
  userId: number
  message: string
  timeoutMs?: number
}

// Env vars:
// - OPENAI_API_KEY (required)
// - OPENAI_BASE_URL (optional; defaults to https://api.openai.com/v1)
// - OPENAI_MODEL (optional; default: gpt-4o-mini)

const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

const withTimeout = async <T,>(p: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('AI timeout')), timeoutMs)

    p
      .then((v) => {
        clearTimeout(t)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(t)
        reject(e)
      })
  })
}

const getSystemPrompt = () =>
  'You are CampusOS AI, a helpful and friendly AI assistant for students. Provide concise, accurate, and actionable guidance.'

export const getAiReply = async (
  { userId, message, timeoutMs = 25_000 }: GetAiReplyParams,
): Promise<{ reply: string }> => {
  const trimmed = message.trim()
  if (!trimmed) return { reply: '' }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Missing OPENAI_API_KEY on server')
  }

  const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')

  const completionPromise = fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: `UserId: ${userId}\nUser message: ${trimmed}` },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  }).then(async (r) => {
    const data: any = await r.json().catch(() => ({}))
    if (!r.ok) {
      const errMsg = data?.error?.message || `LLM request failed: ${r.status}`
      throw new Error(errMsg)
    }
    return data
  })

  try {
    const completion: any = await withTimeout(completionPromise, timeoutMs)
    const reply: string | undefined = completion?.choices?.[0]?.message?.content
    return { reply: reply || "I'm sorry, I couldn't generate a response. Please try again." }
  } catch (err) {
    const msg = String((err as any)?.message ?? err)
    if (msg.toLowerCase().includes('timeout')) throw new Error('AI timeout')

    console.error('Error getting ai reply:', err)
    throw new Error('Failed to get response from AI service.')
  }
}

