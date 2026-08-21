import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError, NetworkError } from '../lib/api'
import { useAuthStore } from '../store/auth'

const RESEND_COOLDOWN_SECONDS = 60

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: 'Введите корректный email',
  invalid_request: 'Введите email и код',
  no_pending_code: 'Сначала запросите код',
  expired: 'Код истёк, запросите новый',
  too_many_attempts: 'Слишком много попыток, запросите новый код',
  invalid_code: 'Неверный код',
  email_send_failed: 'Не удалось отправить письмо, попробуйте позже',
  network_error: 'Не удалось подключиться к серверу. Проверьте интернет и попробуйте снова',
  unknown_error: 'Что-то пошло не так, попробуйте ещё раз',
}

function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.message === 'cooldown') {
      const retryAfterSeconds = (err.data as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds
      return retryAfterSeconds
        ? `Код уже отправлен, попробуйте через ${retryAfterSeconds} сек.`
        : 'Код уже отправлен, попробуйте позже'
    }
    return ERROR_MESSAGES[err.message] ?? ERROR_MESSAGES.unknown_error
  }
  if (err instanceof NetworkError) return ERROR_MESSAGES.network_error
  return ERROR_MESSAGES.unknown_error
}

export default function Login() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const requestCode = useAuthStore((s) => s.requestCode)
  const verifyCode = useAuthStore((s) => s.verifyCode)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function sendCode() {
    setError(null)
    setSubmitting(true)
    try {
      await requestCode(email)
      setStep('code')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setError(messageFor(err))
      if (err instanceof ApiError && err.message === 'cooldown') {
        const retryAfterSeconds = (err.data as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds
        if (retryAfterSeconds) setCooldown(retryAfterSeconds)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleRequestCode(e: FormEvent) {
    e.preventDefault()
    void sendCode()
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await verifyCode(email, code)
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/stats'
      navigate(from, { replace: true })
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-(--color-ink)">Вход</h1>

      {step === 'email' && (
        <form onSubmit={handleRequestCode} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-(--color-muted)">Email</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-(--color-ink) outline-none focus:border-(--color-brand-green)"
            />
          </label>

          {error && <p className="text-sm text-(--color-brand-red)">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-(--color-brand-green) px-4 py-3 font-medium text-(--color-surface) disabled:opacity-60"
          >
            {submitting ? 'Отправка…' : 'Получить код'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
          <p className="text-sm text-(--color-muted)">
            Код отправлен на {email}
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-(--color-muted)">Код из письма</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-center text-lg tracking-[0.3em] text-(--color-ink) outline-none focus:border-(--color-brand-green)"
            />
          </label>

          {error && <p className="text-sm text-(--color-brand-red)">{error}</p>}

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="rounded-xl bg-(--color-brand-green) px-4 py-3 font-medium text-(--color-surface) disabled:opacity-60"
          >
            {submitting ? 'Проверка…' : 'Войти'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
              className="text-(--color-muted)"
            >
              Изменить email
            </button>

            <button
              type="button"
              disabled={cooldown > 0 || submitting}
              onClick={() => void sendCode()}
              className="text-(--color-brand-green) disabled:text-(--color-muted)"
            >
              {submitting ? 'Отправка…' : cooldown > 0 ? `Повторить через ${cooldown}с` : 'Отправить код ещё раз'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
