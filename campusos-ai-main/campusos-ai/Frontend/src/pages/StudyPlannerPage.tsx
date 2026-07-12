import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken } from '../lib/api'

import {
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineX,
} from 'react-icons/hi'

type StudySession = {
  id: number
  subject: string
  topic: string
  studyDate: string // YYYY-MM-DD
  completed: boolean
  createdAt: string
}

type SessionDraft = {
  subject: string
  topic: string
  studyDate: string
  completed: boolean
}

function isAuthError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('token') || m.includes('authorization') || m.includes('unauthorized') || m.includes('401')
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toISODateLocal(d: Date) {
  // Convert local date to YYYY-MM-DD (avoids UTC shifting)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseISODateToLocal(iso: string): Date {
  // iso YYYY-MM-DD -> local date
  const [y, m, d] = iso.split('-').map((x) => Number(x))
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function formatPretty(iso: string) {
  const d = parseISODateToLocal(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function ModalShell({
  title,
  children,
  onClose,
  primaryText,
  onPrimary,
  primaryDisabled,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  primaryText: string
  onPrimary: () => void
  primaryDisabled?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.10] bg-[#0F0F16] shadow-2xl overflow-hidden animate-[fadeIn_160ms_ease-out]">
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.10] bg-white/[0.03] text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
            aria-label="Close"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4">{children}</div>

        <div className="px-4 py-4 border-t border-white/[0.07] flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-3 text-xs font-semibold text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={primaryDisabled}
            onClick={onPrimary}
            className="flex-1 rounded-xl bg-[#6C63FF] px-3 py-3 text-xs font-semibold text-white shadow-lg shadow-[#6C63FF]/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
          >
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
  error,
  required,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
  error?: string | null
  required?: boolean
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
          {label} {required ? <span className="text-[#6C63FF]">*</span> : null}
        </span>
        {error ? <span className="text-[10px] text-red-300">{error}</span> : null}
      </div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-3 text-sm text-white placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
      />
    </label>
  )
}

function CalendarDay({
  date,
  isToday,
  hasSessions,
  selected,
  onClick,
}: {
  date: string
  isToday: boolean
  hasSessions: boolean
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'relative flex flex-col items-center justify-center rounded-2xl px-1 py-2 border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]'
      }
      style={{
        background: selected ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.03)',
        borderColor: selected ? 'rgba(108,99,255,0.45)' : 'rgba(255,255,255,0.07)',
      }}
      aria-label={`Select ${date}`}
    >
      <span
        className="text-[12px] font-semibold"
        style={{ color: selected ? '#A5A0FF' : isToday ? '#6C63FF' : '#E2E8F0' }}
      >
        {Number(date.slice(-2))}
      </span>
      {hasSessions ? (
        <span
          className="absolute bottom-2 h-[6px] w-[6px] rounded-full"
          style={{ background: '#6C63FF', boxShadow: '0 0 0 4px rgba(108,99,255,0.12)' }}
          aria-hidden="true"
        />
      ) : null}
      {isToday ? (
        <span
          className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full"
          style={{ background: '#6C63FF', opacity: 0.8 }}
          aria-hidden="true"
        />
      ) : null}
    </button>
  )
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-5 text-center shadow-xl">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C63FF]/12 ring-1 ring-[#6C63FF]/20"
        aria-hidden="true"
      >
        <HiOutlineCalendar className="w-5 h-5 text-[#6C63FF]" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-xs text-[#64748B]">{subtitle}</p>
    </div>
  )
}

export default function StudyPlannerPage() {
  const navigate = useNavigate()

  const todayISO = useMemo(() => toISODateLocal(new Date()), [])

  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() } // month 0-11
  })

  const [selectedDate, setSelectedDate] = useState<string>(todayISO)

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<SessionDraft>({ subject: '', topic: '', studyDate: todayISO, completed: false })
  const [draftTouched, setDraftTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.studyPlanner.list()
      const mapped: StudySession[] = (res.sessions ?? []).map((s: any) => ({
        id: Number(s.id),
        subject: String(s.subject ?? ''),
        topic: String(s.topic ?? ''),
        studyDate: String(s.studyDate ?? s.study_date ?? ''),
        completed: Boolean(s.completed),
        createdAt: String(s.createdAt ?? s.created_at ?? ''),
      }))
      setSessions(mapped)
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      setError(msg)
      if (isAuthError(msg)) {
        clearToken()
        navigate('/', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sessionsByDate = useMemo(() => {
    const m = new Map<string, StudySession[]>()
    for (const s of sessions) {
      const arr = m.get(s.studyDate) ?? []
      arr.push(s)
      m.set(s.studyDate, arr)
    }
    for (const [k, arr] of m) {
      arr.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      m.set(k, arr)
    }
    return m
  }, [sessions])

  const todaySessions = useMemo(() => sessionsByDate.get(todayISO) ?? [], [sessionsByDate, todayISO])

  const upcoming = useMemo(() => {
    const t = todayISO
    return sessions
      .filter((s) => s.studyDate >= t)
      .sort((a, b) => a.studyDate.localeCompare(b.studyDate) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  }, [sessions, todayISO])

  const upcomingCount = useMemo(() => upcoming.filter((s) => s.studyDate > todayISO && !s.completed).length, [upcoming, todayISO])

  const nextStudyDate = useMemo(() => {
    const next = sessions
      .filter((s) => s.studyDate >= todayISO && !s.completed)
      .sort((a, b) => a.studyDate.localeCompare(b.studyDate) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0]
    return next?.studyDate ?? null
  }, [sessions, todayISO])

  const selectedSessions = useMemo(() => sessionsByDate.get(selectedDate) ?? [], [sessionsByDate, selectedDate])

  const hasSessions = (date: string) => (sessionsByDate.get(date)?.length ?? 0) > 0

  const titleError = useMemo(() => {
    if (!draftTouched) return null
    const s = draft.subject.trim()
    if (!s) return 'Subject is required'
    return null
  }, [draft.subject, draftTouched])

  const topicError = useMemo(() => {
    if (!draftTouched) return null
    const t = draft.topic.trim()
    if (!t) return 'Topic is required'
    return null
  }, [draft.topic, draftTouched])

  const dateError = useMemo(() => {
    if (!draftTouched) return null
    if (!draft.studyDate) return 'Study date is required'
    return null
  }, [draft.studyDate, draftTouched])

  const openAdd = (forDate?: string) => {
    setEditingId(null)
    setDraft({ subject: '', topic: '', studyDate: forDate ?? selectedDate, completed: false })
    setDraftTouched(false)
    setShowAddEdit(true)
  }

  const openEdit = (s: StudySession) => {
    setEditingId(s.id)
    setDraft({ subject: s.subject, topic: s.topic, studyDate: s.studyDate, completed: s.completed })
    setDraftTouched(false)
    setShowAddEdit(true)
  }

  const closeAddEdit = () => {
    if (submitting) return
    setShowAddEdit(false)
    setEditingId(null)
  }

  const toggleCompleted = async (id: number) => {
    const current = sessions.find((s) => s.id === id)
    if (!current) return
    const nextCompleted = !current.completed

    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, completed: nextCompleted } : s)))

    try {
      await api.studyPlanner.update(id, { completed: nextCompleted })
      setToast({ kind: 'success', message: nextCompleted ? 'Marked complete' : 'Marked incomplete' })
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !nextCompleted } : s)))
      if (isAuthError(msg)) {
        clearToken()
        navigate('/', { replace: true })
      } else {
        setToast({ kind: 'error', message: msg })
      }
    }
  }

  const submitAddEdit = async () => {
    setDraftTouched(true)
    const subject = draft.subject.trim()
    const topic = draft.topic.trim()
    const studyDate = draft.studyDate

    if (!subject) return
    if (!topic) return
    if (!studyDate) return

    setSubmitting(true)
    try {
      if (editingId == null) {
        const res = await api.studyPlanner.create({
          subject,
          topic,
          study_date: studyDate,
          completed: draft.completed,
        })
        const created = res.session
        const mapped: StudySession = {
          id: Number(created.id),
          subject: String(created.subject ?? ''),
          topic: String(created.topic ?? ''),
studyDate: String(created.studyDate ?? ''),
          completed: Boolean(created.completed),
          createdAt: String(created.createdAt ?? ''),
        }
        setSessions((prev) => [mapped, ...prev].sort((a, b) => a.studyDate.localeCompare(b.studyDate) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')))
        setToast({ kind: 'success', message: 'Study session created' })
      } else {
        const res = await api.studyPlanner.update(editingId, {
          subject,
          topic,
          study_date: studyDate,
          completed: draft.completed,
        })
        const updated = res.session
        const mapped: StudySession = {
          id: Number(updated.id),
          subject: String(updated.subject ?? ''),
          topic: String(updated.topic ?? ''),
          studyDate: String(updated.studyDate ?? updated.study_date ?? ''),
          completed: Boolean(updated.completed),
          createdAt: String(updated.createdAt ?? updated.created_at ?? ''),
        }
        setSessions((prev) => prev.map((s) => (s.id === mapped.id ? mapped : s)).sort((a, b) => a.studyDate.localeCompare(b.studyDate) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')))
        setToast({ kind: 'success', message: 'Study session updated' })
      }
      setShowAddEdit(false)
      setEditingId(null)
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      if (isAuthError(msg)) {
        clearToken()
        navigate('/', { replace: true })
        return
      }
      setToast({ kind: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const requestDelete = (id: number) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (deletingId == null) return
    setSubmitting(true)
    try {
      await api.studyPlanner.delete(deletingId)
      setSessions((prev) => prev.filter((s) => s.id !== deletingId))
      setToast({ kind: 'success', message: 'Study session deleted' })
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      if (isAuthError(msg)) {
        clearToken()
        navigate('/', { replace: true })
        return
      }
      setToast({ kind: 'error', message: msg })
    } finally {
      setSubmitting(false)
      setShowDeleteConfirm(false)
      setDeletingId(null)
    }
  }

  const calendar = useMemo(() => {
    const { year, month } = calendarMonth
    const first = new Date(year, month, 1)
    const firstWeekday = first.getDay() // 0 Sunday

    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: string[] = []

    // Start from Monday-style week labels? We'll keep simple: Sun..Sat.
    // Add leading blanks as empty strings.
    for (let i = 0; i < firstWeekday; i++) cells.push('')
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toISODateLocal(new Date(year, month, d)))
    }

    // Fill to 42 cells (6 weeks)
    while (cells.length < 42) cells.push('')

    return cells
  }, [calendarMonth])

  const monthLabel = useMemo(() => {
    const d = new Date(calendarMonth.year, calendarMonth.month, 1)
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }, [calendarMonth])

  const goPrev = () => {
    setCalendarMonth((m) => {
      const y = m.month === 0 ? m.year - 1 : m.year
      const mo = m.month === 0 ? 11 : m.month - 1
      return { year: y, month: mo }
    })
  }

  const goNext = () => {
    setCalendarMonth((m) => {
      const y = m.month === 11 ? m.year + 1 : m.year
      const mo = m.month === 11 ? 0 : m.month + 1
      return { year: y, month: mo }
    })
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] px-4 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] overflow-x-hidden">
      {toast ? (
        <div className="fixed top-[calc(env(safe-area-inset-top)+12px)] left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-sm" role="status">
          <div
            className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur bg-[#0F0F16]/90 flex items-start gap-3 ${
              toast.kind === 'success' ? 'border-green-500/20 text-green-100' : 'border-red-500/20 text-red-100'
            }`}
          >
            <div
              className={`mt-0.5 h-9 w-9 rounded-2xl flex items-center justify-center ${
                toast.kind === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}
            >
              {toast.kind === 'success' ? (
                <HiOutlineCheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <HiOutlineX className="w-4 h-4 text-red-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold">{toast.kind === 'success' ? 'Success' : 'Error'}</p>
              <p className="mt-1 text-[12px] text-[#E2E8F0]">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-auto inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.10] bg-white/[0.03] text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
              aria-label="Dismiss"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto max-w-sm space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
            Study Planner
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">Your sessions, organized by date.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111118] px-5 py-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineCalendar className="w-4 h-4 text-[#6C63FF]" />
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Today</p>
          </div>
          {todaySessions.length === 0 ? (
            <p className="text-xs text-[#64748B]">No study sessions scheduled for today.</p>
          ) : (
            <p className="text-xs text-[#E2E8F0]">
              {todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} today.
            </p>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.05] py-2 text-center">
              <p className="text-base font-bold text-white">{todaySessions.filter((s) => s.completed).length}</p>
              <p className="text-[10px] text-[#4B5563] mt-0.5">Done</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.05] py-2 text-center">
              <p className="text-base font-bold text-white">{upcomingCount}</p>
              <p className="text-[10px] text-[#4B5563] mt-0.5">Upcoming</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.05] py-2 text-center">
              <p className="text-base font-bold text-white">{nextStudyDate ? 'Next' : '—'}</p>
              <p className="text-[10px] text-[#4B5563] mt-0.5">{nextStudyDate ? formatPretty(nextStudyDate) : 'All done'}</p>
            </div>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => openAdd(todayISO)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6C63FF] px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-[#6C63FF]/20 hover:bg-[#7C6FFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
            >
              <HiOutlinePlus className="w-4 h-4" /> Add Study Session
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Calendar</p>
              <p className="text-sm text-[#E2E8F0] font-medium mt-1">{monthLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.10] bg-white/[0.03] text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                aria-label="Previous month"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.10] bg-white/[0.03] text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
              <div key={d} className="text-[10px] text-[#64748B] font-semibold">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendar.map((date, idx) => {
              if (!date) {
                return <div key={idx} aria-hidden="true" />
              }
              const isToday = date === todayISO
              const selected = date === selectedDate
              return (
                <CalendarDay
                  key={date}
                  date={date}
                  isToday={isToday}
                  hasSessions={hasSessions(date)}
                  selected={selected}
                  onClick={() => setSelectedDate(date)}
                />
              )
            })}
          </div>
        </div>

        {/* Sessions list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest">Sessions</p>
              <p className="text-sm text-[#E2E8F0] font-medium mt-1">{formatPretty(selectedDate)}</p>
            </div>
            <button
              type="button"
              onClick={() => openAdd(selectedDate)}
              className="inline-flex items-center gap-2 text-xs text-[#6C63FF] hover:text-[#A5A0FF] transition-colors focus-visible:outline-none"
            >
              <HiOutlinePlus className="w-4 h-4" /> Add
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4 shadow-xl overflow-hidden"
                >
                  <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-white/8 animate-pulse" />
                  <div className="mt-4 h-3 w-full rounded bg-white/8 animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState title="Couldn’t load study planner" subtitle={error} />
          ) : selectedSessions.length === 0 ? (
            <EmptyState title="No sessions on this day" subtitle="Add one to start planning your study." />
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <HiOutlineClock className="w-4 h-4 text-[#6C63FF]" />
                        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{s.subject}</p>
                      </div>
                      <p className={`mt-2 text-sm font-semibold truncate ${s.completed ? 'line-through text-[#3B4558]' : 'text-white'}`}>
                        {s.topic}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleCompleted(s.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                        >
                          <HiOutlineCheckCircle className="w-4 h-4" style={{ color: s.completed ? '#6C63FF' : '#64748B' }} />
                          {s.completed ? 'Completed' : 'Mark done'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/[0.10] bg-white/[0.03] text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                        aria-label="Edit study session"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(s.id)}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        aria-label="Delete study session"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddEdit ? (
          <ModalShell
            title={editingId == null ? 'Add Study Session' : 'Edit Study Session'}
            onClose={closeAddEdit}
            primaryText={editingId == null ? 'Create' : 'Save'}
            onPrimary={() => void submitAddEdit()}
            primaryDisabled={submitting}
          >
            <div className="space-y-4">
              <TextField
                label="Subject"
                value={draft.subject}
                placeholder="e.g., Data Structures"
                required
                error={titleError}
                onChange={(v) => {
                  setDraft((d) => ({ ...d, subject: v }))
                  setDraftTouched(true)
                }}
              />

              <TextField
                label="Topic"
                value={draft.topic}
                placeholder="e.g., Trees & Traversals"
                required
                error={topicError}
                onChange={(v) => {
                  setDraft((d) => ({ ...d, topic: v }))
                  setDraftTouched(true)
                }}
              />

              <label className="block">
                <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest flex items-baseline justify-between">
                  <span>
                    Study Date <span className="text-[#6C63FF]">*</span>
                  </span>
                  {dateError ? <span className="text-[10px] text-red-300">{dateError}</span> : null}
                </div>
                <input
                  type="date"
                  value={draft.studyDate}
                  onChange={(e) => {
                    const v = e.target.value
                    setDraft((d) => ({ ...d, studyDate: v }))
                    setDraftTouched(true)
                  }}
                  className="mt-2 w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-3 text-sm text-white placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3">
                <span className="text-xs font-semibold text-[#E2E8F0]">Completed</span>
                <input
                  type="checkbox"
                  checked={draft.completed}
                  onChange={(e) => setDraft((d) => ({ ...d, completed: e.target.checked }))}
                  className="h-5 w-5 accent-[#6C63FF]"
                />
              </label>
            </div>
          </ModalShell>
        ) : null}

        {showDeleteConfirm ? (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center px-4 py-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-2xl border border-white/[0.10] bg-[#0F0F16] shadow-2xl overflow-hidden animate-[fadeIn_160ms_ease-out]">
              <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Delete study session</h2>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs text-[#E2E8F0]">
                  This will permanently remove the session. This action can’t be undone.
                </p>
              </div>
              <div className="px-4 py-4 border-t border-white/[0.07] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (submitting) return
                    setShowDeleteConfirm(false)
                    setDeletingId(null)
                  }}
                  className="flex-1 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-3 text-xs font-semibold text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void confirmDelete()}
                  className="flex-1 rounded-xl bg-red-500/15 px-3 py-3 text-xs font-semibold text-red-200 shadow-lg shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    </div>
  )
}

