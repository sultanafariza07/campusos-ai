import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, clearToken } from '../lib/api'
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineRefresh,
} from 'react-icons/hi'

type Note = {
  id: number
  title: string
  content: string
  updatedAt?: string | null
}

function clampContentPreview(text: string) {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim()
  return normalized
}

function isAuthErrorMessage(message: string) {
  const m = message.toLowerCase()
  return m.includes('token') || m.includes('authorization') || m.includes('unauthorized') || m.includes('401')
}

function Toast({
  kind,
  text,
}: {
  kind: 'success' | 'error'
  text: string
}) {
  const bg = kind === 'success' ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'
  const fg = kind === 'success' ? 'text-green-200' : 'text-red-200'
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-2xl border ${bg} px-4 py-3 shadow-xl`}> 
      <p className={`text-xs font-semibold ${fg}`}>{text}</p>
    </div>
  )
}

export default function NoteEditorPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const isNew = !id || id === 'new'
  const noteId = useMemo(() => {
    if (isNew) return null
    const n = Number(id)
    return Number.isFinite(n) ? n : null
  }, [id, isNew])

  const [loading, setLoading] = useState(!isNew)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const [titleError, setTitleError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (isNew) {
        setLoading(false)
        return
      }
      if (!noteId) {
        setFetchError('Invalid note id')
        setLoading(false)
        return
      }
      setLoading(true)
      setFetchError(null)
      try {
        const res = await api.notes.get(noteId)
        if (!mounted) return
        const n = res.note as any
        setTitle(String(n.title ?? ''))
        setContent(String(n.content ?? ''))
      } catch (e: any) {
        const msg = String(e?.message ?? e)
        if (!mounted) return
        if (isAuthErrorMessage(msg)) {
          clearToken()
          navigate('/', { replace: true })
          return
        }
        setFetchError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [isNew, noteId, navigate])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(t)
  }, [toast])

  const onBack = () => navigate('/notes')

  const validateTitle = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setTitleError('Title is required')
      return false
    }
    setTitleError(null)
    return true
  }

  const onSave = async () => {
    setSaveError(null)
    if (!validateTitle()) return

    const trimmedTitle = title.trim()
    const trimmedContent = content ?? ''

    try {
      setSaving(true)

      if (isNew) {
        await api.notes.create({
          title: trimmedTitle,
          content: trimmedContent,
        } as any)
        setToast({ kind: 'success', text: 'Note saved' })
        navigate('/notes', { replace: true })
        return
      }

      if (!noteId) return
      await api.notes.update(noteId, {
        title: trimmedTitle,
        content: trimmedContent,
      } as any)

      setToast({ kind: 'success', text: 'Note saved' })
      navigate('/notes', { replace: true })
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      if (isAuthErrorMessage(msg)) {
        clearToken()
        navigate('/', { replace: true })
        return
      }
      setSaveError(msg)
      setToast({ kind: 'error', text: 'Couldn’t save note' })
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!noteId) return
    setDeleteConfirmOpen(false)
    try {
      await api.notes.delete(noteId)
      setToast({ kind: 'success', text: 'Note deleted' })
      navigate('/notes', { replace: true })
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      if (isAuthErrorMessage(msg)) {
        clearToken()
        navigate('/', { replace: true })
        return
      }
      setToast({ kind: 'error', text: msg || 'Couldn’t delete note' })
    }
  }

  const preview = useMemo(() => clampContentPreview(content).slice(0, 60), [content])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] px-4 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-32 rounded bg-white/10 animate-pulse" />
            <div className="h-7 w-20 rounded bg-white/10 animate-pulse" />
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4 shadow-xl space-y-3">
            <div className="h-10 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-40 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] px-4 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-sm">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 shadow-xl">
            <p className="text-sm font-semibold text-red-200">Couldn’t load note</p>
            <p className="mt-1 text-xs text-red-200/80">{fetchError}</p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6C63FF]/20 hover:bg-[#7C6FFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
              >
                <HiOutlineRefresh className="w-4 h-4" /> Retry
              </button>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#A5A0FF] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] px-4 pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))] overflow-x-hidden">
      {toast && <Toast kind={toast.kind} text={toast.text} />}

      <div className="mx-auto max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#E2E8F0] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
          >
            <HiOutlineArrowLeft className="w-4 h-4" /> Back
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <HiOutlineTrash className="w-4 h-4" /> Delete
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4 shadow-xl">
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#94A3B8]">Title</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError(null)
              }}
              placeholder="e.g., Normalization & Keys"
              className={`mt-1 w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-[#E2E8F0] placeholder-[#3B4558] outline-none transition-colors focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 ${
                titleError ? 'border-red-500/60' : 'border-white/10'
              }`}
            />
            {titleError && <p className="mt-1.5 text-xs text-red-400">{titleError}</p>}
          </div>

          <div className="mb-2">
            <label className="text-xs font-semibold text-[#94A3B8]">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
              rows={14}
              className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#E2E8F0] placeholder-[#3B4558] outline-none transition-colors focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20"
            />
            <p className="mt-2 text-[11px] text-[#64748B]">Preview: {preview || '—'}</p>
          </div>

          {saveError && (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
              <p className="text-xs font-semibold text-red-200">Couldn’t save</p>
              <p className="mt-1 text-[11px] text-red-200/80">{saveError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-[#6C63FF] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C63FF]/20 transition-all hover:bg-[#7C6FFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : isNew ? 'Save note' : 'Update note'}
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#16161F] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">Delete this note?</h3>
            <p className="text-sm text-[#64748B] mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

