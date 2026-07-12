import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api, clearToken, getToken } from '../lib/api'
import { HiCheckCircle, HiOutlinePaperAirplane, HiOutlineUser, HiOutlineSparkles, HiOutlineX } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

function isAuthError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('token') || m.includes('authorization') || m.includes('unauthorized') || m.includes('401')
}

const AiChatPage: React.FC = () => {
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-1',
      role: 'assistant',
      content: "👋 Hi! I'm CampusOS AI. Ask me anything about your studies.",
      timestamp: new Date().toISOString(),
    },
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const token = useMemo(() => getToken(), [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages, isLoading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()

    if (!text || isLoading) return

    // Protected route: backend will return 401 if token missing/invalid.
    const authToken = token ?? getToken()
    if (!authToken) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const { reply } = await api.ai.chat({ message: text })

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      const msg = String(err?.message ?? err)
      const errorMessage = isAuthError(msg)
        ? 'Session expired. Please log in again.'
        : 'Sorry, something went wrong. Please check your connection and try again.'

      if (isAuthError(msg)) {
        clearToken()
        navigate('/', { replace: true })
        return
      }

      setError(errorMessage)
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-900 text-white">
      <header className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700 flex items-center">
        <HiOutlineSparkles className="w-6 h-6 text-purple-400 mr-3" />
        <h1 className="text-xl font-bold">CampusOS AI Assistant</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-6 text-center">
            <p className="text-sm text-[#94A3B8]">No messages yet.</p>
          </div>
        ) : null}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' ? (
              <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center">
                <HiOutlineSparkles className="w-5 h-5 text-white" />
              </div>
            ) : null}

            <div
              className={`max-w-md lg:max-w-2xl rounded-2xl p-3.5 ${
                msg.role === 'user' ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'
              }`}
            >
              <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
            </div>

            {msg.role === 'user' ? (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center">
                <HiOutlineUser className="w-5 h-5 text-white" />
              </div>
            ) : null}
          </div>
        ))}

        {isLoading ? (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center">
              <HiOutlineSparkles className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-700 rounded-2xl p-3.5 rounded-bl-none">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-[bounce_0.9s_infinite]" style={{ animationDelay: '0ms' }} />
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-[bounce_0.9s_infinite]" style={{ animationDelay: '120ms' }} />
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-[bounce_0.9s_infinite]" style={{ animationDelay: '240ms' }} />
                <span className="text-xs text-gray-300 ml-2">CampusOS AI is typing…</span>
              </div>
              <style>{`
                @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.6; } 40% { transform: translateY(-6px); opacity: 1; } }
              `}</style>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
            <HiOutlineX className="w-4 h-4" />
            {error}
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-gray-800/70 border-t border-gray-700">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="bg-purple-600 text-white rounded-full p-3 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <HiOutlinePaperAirplane className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  )
}

export default AiChatPage

