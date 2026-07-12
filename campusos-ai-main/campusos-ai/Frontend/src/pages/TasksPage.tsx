import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../lib/api';
import {
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiCheckCircle,
} from 'react-icons/hi';

type Task = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
};

type TaskDraft = {
  title: string;
  description: string;
  dueDate: string | null;
};

function isAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('token') ||
    m.includes('authorization') ||
    m.includes('unauthorized') ||
    m.includes('401')
  );
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return 'No due date';
  try {
    const d = new Date(dueDate + 'T00:00:00'); // Treat as local date
    if (isNaN(d.getTime())) return String(dueDate);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return String(dueDate);
  }
}

function trimInput(s: string): string {
  return (s ?? '').trim();
}

function ModalShell({
  title,
  children,
  onClose,
  primaryText,
  onPrimary,
  primaryDisabled,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  primaryText: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.10] bg-[#16161F] shadow-2xl overflow-hidden animate-[fadeIn_160ms_ease-out]">
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
            aria-label="Close"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4">{children}</div>

        <div className="px-4 py-4 border-t border-white/[0.07] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={primaryDisabled}
            onClick={onPrimary}
            className="flex-1 rounded-xl bg-[#6C63FF] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C63FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
  error,
  required,
  multiline,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  error?: string | null;
  required?: boolean;
  multiline?: boolean;
}) {
  const commonClasses =
    'mt-2 w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-3 text-sm text-white placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]';
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
          {label} {required ? <span className="text-[#6C63FF]">*</span> : null}
        </span>
        {error ? <span className="text-[10px] text-red-300">{error}</span> : null}
      </div>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${commonClasses} min-h-[84px]`}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={commonClasses}
        />
      )}
    </label>
  );
}

function Toast({
  kind,
  message,
  onDismiss,
}: {
  kind: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`fixed top-[calc(env(safe-area-inset-top)+12px)] left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-sm`}
      role="status"
    >
      <div
        className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur bg-[#16161F]/90 flex items-start gap-3 ${
          kind === 'success'
            ? 'border-green-500/20 text-green-100'
            : 'border-red-500/20 text-red-100'
        }`}
      >
        <div
          className={`mt-0.5 h-9 w-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            kind === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}
        >
          {kind === 'success' ? (
            <HiCheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <HiOutlineX className="w-4 h-4 text-red-300" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold">
            {kind === 'success' ? 'Success' : 'Error'}
          </p>
          <p className="mt-1 text-[12px] text-[#E2E8F0]">{message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto inline-flex items-center justify-center h-9 w-9 rounded-xl text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] flex-shrink-0"
          aria-label="Dismiss"
        >
          <HiOutlineX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [draft, setDraft] = useState<TaskDraft>({ title: '', description: '', dueDate: null })
  const [draftTouched, setDraftTouched] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.tasks.list()
      const mapped: Task[] = (res.tasks ?? []).map((t: any) => ({
        id: Number(t.id),
        title: String(t.title ?? ''),
        description: (t.description ?? null) as string | null,
        dueDate: (t.dueDate ?? t.due_date ?? null) as string | null,
        completed: Boolean(t.completed),
        createdAt: (t.createdAt ?? t.created_at ?? null) as string | null,
      }))
      setTasks(mapped)
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

  const pendingCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks])
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks])

  const openAdd = () => {
    setEditingId(null)
    setDraft({ title: '', description: '', dueDate: null })
    setDraftTouched(false)
    setShowAddEdit(true)
  }

  const openEdit = (task: Task) => {
    setEditingId(task.id)
    setDraft({
      title: task.title ?? '',
      description: task.description ?? '',
      dueDate: task.dueDate ?? null,
    })
    setDraftTouched(false)
    setShowAddEdit(true)
  }

  const closeAddEdit = () => {
    if (submitting) return
    setShowAddEdit(false)
    setEditingId(null)
  }

  const titleError = useMemo(() => {
    if (!draftTouched) return null
    const t = trimInput(draft.title)
    if (!t) return 'Title is required'
    return null
  }, [draft.title, draftTouched])

  const dueDateValue = useMemo(() => {
    return draft.dueDate ?? ''
  }, [draft.dueDate])

  const onSubmitAddEdit = async () => {
    setDraftTouched(true)
    const trimmedTitle = trimInput(draft.title)
    const trimmedDescription = trimInput(draft.description)

    if (!trimmedTitle) return

    setSubmitting(true)
    try {
      if (editingId == null) {
        const res = await api.tasks.create({
          title: trimmedTitle,
          description: trimmedDescription || null,
          dueDate: draft.dueDate,
        } as any)
        const created: Task = {
          id: Number(res.task.id),
          title: String(res.task.title),
          description: (res.task.description ?? null) as string | null,
          dueDate: (res.task.dueDate ?? null) as string | null,
          completed: Boolean(res.task.completed),
          createdAt: (res.task.createdAt ?? res.task.created_at ?? null) as string | null,
        }
        setTasks((prev) => [created, ...prev])
        setToast({ kind: 'success', message: 'Task created' })
      } else {
        const res = await api.tasks.update(editingId, {
          title: trimmedTitle,
          description: trimmedDescription,
          dueDate: draft.dueDate,
        } as any)
        const updated: Task = {
          id: Number(res.task.id),
          title: String(res.task.title),
          description: (res.task.description ?? null) as string | null,
          dueDate: (res.task.dueDate ?? null) as string | null,
          completed: Boolean(res.task.completed),
          createdAt: (res.task.createdAt ?? res.task.created_at ?? null) as string | null,
        }
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')))
        setToast({ kind: 'success', message: 'Task updated' })
      }

      setShowAddEdit(false)
      setEditingId(null)
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      setToast({ kind: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleTask = async (id: number) => {
    const current = tasks.find((t) => t.id === id)
    if (!current) return
    const nextCompleted = !current.completed

    // optimistic
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)))

    try {
      await api.tasks.update(id, { completed: nextCompleted } as any)
      setToast({ kind: 'success', message: nextCompleted ? 'Marked complete' : 'Marked incomplete' })
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !nextCompleted } : t)))
      if (isAuthError(msg)) {
        clearToken()
        navigate('/', { replace: true })
        return
      }
      setToast({ kind: 'error', message: msg })
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
      await api.tasks.delete(deletingId)
      setTasks((prev) => prev.filter((t) => t.id !== deletingId))
      setToast({ kind: 'success', message: 'Task deleted' })
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

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => (a.completed === b.completed) ? (b.createdAt?.localeCompare(a.createdAt ?? '') ?? 0) : a.completed ? 1 : -1), [tasks]);

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] px-4 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] overflow-x-hidden">
      {toast ? (
        <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} />
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-110px] left-1/2 -translate-x-1/2 w-[480px] h-[340px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.16) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative mx-auto max-w-sm space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
            Tasks
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">Assignments and to-dos for your day.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4 shadow-xl">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.05] py-2 text-center">
              <p className="text-base font-bold text-white">{pendingCount}</p>
              <p className="text-[10px] text-[#4B5563] mt-0.5">Pending</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.05] py-2 text-center">
              <p className="text-base font-bold text-white">{completedCount}</p>
              <p className="text-[10px] text-[#4B5563] mt-0.5">Completed</p>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={openAdd}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6C63FF] px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-[#6C63FF]/20 hover:bg-[#7C6FFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
            >
              <HiOutlinePlus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest">Your tasks</h2>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 text-xs text-[#6C63FF] hover:text-[#A5A0FF] transition-colors focus-visible:outline-none"
            >
              <HiOutlineRefresh className="w-4 h-4" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4 shadow-xl overflow-hidden">
                  <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-white/8 animate-pulse" />
                  <div className="mt-4 h-3 w-full rounded bg-white/8 animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 shadow-xl">
              <p className="text-sm font-semibold text-red-200">Couldn’t load tasks</p>
              <p className="mt-2 text-xs text-red-200/80">{error}</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-5 text-center shadow-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C63FF]/12 ring-1 ring-[#6C63FF]/20">
                <HiOutlineClock className="w-5 h-5 text-[#6C63FF]" />
              </div>
              <p className="mt-4 text-sm font-semibold text-white">No tasks yet</p>
              <p className="mt-2 text-xs text-[#64748B]">Add a task to get started.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111118] shadow-xl overflow-hidden">
              {sortedTasks.map((task) => (
                <div key={task.id} className="px-4 py-3 border-b border-white/[0.05] last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => void toggleTask(task.id)}
                        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                        className="mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] rounded-full"
                      >
                        {task.completed ? (
                          <HiCheckCircle className="w-5 h-5 text-[#6C63FF]" />
                        ) : (
                          <HiOutlineCheckCircle className="w-5 h-5 text-[#3B4558] hover:text-[#6C63FF] transition-colors" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium leading-snug ${
                            task.completed ? 'line-through text-[#3B4558]' : 'text-[#E2E8F0]'
                          }`}
                        >
                          {task.title}
                        </p>

                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-[#4B5563]">
                            <HiOutlineClock className="w-3.5 h-3.5" />
                            {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
                          </span>
                          {task.description ? (
                            <span className="text-xs text-[#64748B] truncate max-w-[180px]">{task.description}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(task)}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/[0.10] bg-white/[0.03] text-[#E2E8F0] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                        aria-label="Edit task"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(task.id)}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        aria-label="Delete task"
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

      </div>

      {showAddEdit ? (
        <ModalShell
          title={editingId == null ? 'Add Task' : 'Edit Task'}
          onClose={closeAddEdit}
          primaryText={editingId == null ? 'Create' : 'Save'}
          onPrimary={() => void onSubmitAddEdit()}
          primaryDisabled={submitting}
        >
          <div className="space-y-4">
            <TextField
              label="Title"
              value={draft.title}
              placeholder="e.g., Submit OS assignment"
              required
              error={titleError}
              onChange={(v) => {
                setDraft((d) => ({ ...d, title: v }))
                setDraftTouched(true)
              }}
            />

            <TextField
              label="Description"
              value={draft.description}
              placeholder="Optional details"
              onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
              multiline
            />

            <label className="block">
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Due Date</div>
              <input
                type="date"
                value={dueDateValue}
                onChange={(e) => {
                  const v = e.target.value
                  setDraft((d) => ({ ...d, dueDate: v ? v : null }))
                }}
                className="mt-2 w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-3 text-sm text-white placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
              />
            </label>
          </div>
        </ModalShell>
      ) : null}

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.10] bg-[#16161F] shadow-2xl overflow-hidden animate-[fadeIn_160ms_ease-out]">
            <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Delete task</h2>
            </div>
            <div className="px-4 py-4">
              <p className="text-sm text-[#94A3B8]">
                This will permanently remove the task. This action can’t be undone.
              </p>
            </div>
            <div className="px-4 py-4 border-t border-white/[0.07] flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (submitting) return
                  setShowDeleteConfirm(false)
                  setDeletingId(null)
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void confirmDelete()}
                className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
