import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, clearToken as clearJwtToken, setToken as setJwtToken } from '../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  name: string
  email: string
  password: string
  branch: string
  year: string
}

type FormErrors = Partial<Record<keyof FormFields, string>>

// ─── Constants ────────────────────────────────────────────────────────────────

const BRANCHES = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Other',
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = (hasError: boolean): string =>
  `w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-[#E2E8F0] placeholder-[#3B4558] outline-none transition-colors focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 ${
    hasError ? 'border-red-500/60' : 'border-white/10'
  }`

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: 'Weak', color: '#EF4444' },
    { label: 'Fair', color: '#F59E0B' },
    { label: 'Good', color: '#3B82F6' },
    { label: 'Strong', color: '#22C55E' },
  ]
  return { score, ...(levels[score - 1] ?? levels[0]) }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignupPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<FormFields>({
    name: '',
    email: '',
    password: '',
    branch: '',
    year: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const setField = (field: keyof FormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

  const setYear = (year: string) => {
    setForm((prev) => ({ ...prev, year }))
    if (errors.year) setErrors((prev) => ({ ...prev, year: undefined }))
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!form.name.trim()) next.name = 'Full name is required.'
    if (!form.email) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.'
    }
    if (!form.password) {
      next.password = 'Password is required.'
    } else if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters.'
    }
    if (!form.branch) next.branch = 'Please select your branch.'
    if (!form.year) next.year = 'Please select your year.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return

    try {
      // Backend register currently accepts only name/email/password.
      await api.auth.register({
        name: form.name,
        email: form.email,
        password: form.password,
      })

      clearJwtToken()
      const result = await api.auth.login({ email: form.email, password: form.password })
      setJwtToken(result.token)

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setFormError(String(err?.message ?? err))
    }
  }

  const strength = getPasswordStrength(form.password)

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 py-12 pb-[env(safe-area-inset-bottom)] overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-140px] left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(108,99,255,0.16) 0%, rgba(139,92,246,0.07) 45%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-block text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
            Campus<span className="text-[#6C63FF]">OS</span>
          </span>
          <p className="mt-1 text-sm text-[#64748B]">Create your account</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111118] px-6 py-8 shadow-2xl">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#E2E8F0] transition-colors hover:bg-white/10 active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <hr className="flex-1 border-white/10" />
            <span className="text-xs text-[#64748B]">or</span>
            <hr className="flex-1 border-white/10" />
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-[#94A3B8]">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your Name"
              value={form.name}
              onChange={setField('name')}
              className={inputCls(!!errors.name)}
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[#94A3B8]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={setField('email')}
              className={inputCls(!!errors.email)}
            />
            {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[#94A3B8]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={setField('password')}
                className={inputCls(!!errors.password) + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors focus-visible:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>

            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              </div>
            )}

            {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="branch" className="mb-1.5 block text-xs font-medium text-[#94A3B8]">
              Branch
            </label>
            <div className="relative">
              <select
                id="branch"
                value={form.branch}
                onChange={setField('branch')}
                className={
                  inputCls(!!errors.branch) +
                  ' appearance-none pr-9 cursor-pointer' +
                  (!form.branch ? ' text-[#3B4558]' : '')
                }
              >
                <option value="" disabled hidden>
                  Select your branch
                </option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                <ChevronDownIcon />
              </span>
            </div>
            {errors.branch && <p className="mt-1.5 text-xs text-red-400">{errors.branch}</p>}
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-[#94A3B8]">Year</label>
            <div className="flex gap-2">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] ${
                    form.year === y
                      ? 'border-[#6C63FF] bg-[#6C63FF]/15 text-[#A5A0FF]'
                      : 'border-white/10 bg-white/5 text-[#64748B] hover:border-white/20 hover:text-[#94A3B8]'
                  }`}
                >
                  {y.replace(' Year', '')}
                </button>
              ))}
            </div>
            {errors.year && <p className="mt-1.5 text-xs text-red-400">{errors.year}</p>}
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full rounded-xl bg-[#6C63FF] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C63FF]/20 transition-all hover:bg-[#7C6FFF] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111118]"
          >
            Create account
          </button>

          {formError ? <div className="mt-3 text-center text-xs text-red-400">{formError}</div> : null}
        </div>

        <p className="mt-6 text-center text-sm text-[#64748B]">
          Already have an account?{' '}
          <Link to="/" className="font-medium text-[#6C63FF] hover:text-[#8B5CF6] transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
