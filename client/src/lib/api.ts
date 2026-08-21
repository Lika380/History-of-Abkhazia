export interface User {
  id: number
  email: string
  name: string | null
}

export class ApiError extends Error {
  status: number
  data: unknown
  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

export class NetworkError extends Error {}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const REQUEST_TIMEOUT_MS = 15000

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    })
  } catch {
    throw new NetworkError('network_error')
  } finally {
    clearTimeout(timeout)
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? 'unknown_error', body)
  }
  return body as T
}

export const api = {
  requestCode: (email: string) =>
    apiFetch<{ ok: true }>('/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyCode: (email: string, code: string) =>
    apiFetch<{ user: User }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  me: () => apiFetch<{ user: User }>('/auth/me'),

  logout: () => apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' }),

  updateName: (name: string) =>
    apiFetch<{ name: string }>('/auth/name', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  getCharacter: () => apiFetch<{ characterId: string | null }>('/character'),

  setCharacter: (characterId: string) =>
    apiFetch<{ characterId: string }>('/character', {
      method: 'PUT',
      body: JSON.stringify({ characterId }),
    }),

  submitAttempt: (topicId: string, score: number, totalQuestions: number) =>
    apiFetch<{ ok: true }>('/rating/attempts', {
      method: 'POST',
      body: JSON.stringify({ topicId, score, totalQuestions }),
    }),

  getMyRating: () =>
    apiFetch<{
      total: number
      byTopic: { topicId: string; total: number; attempts: number; bestScore: number; totalQuestions: number }[]
    }>('/rating/me'),

  getLeaderboard: () =>
    apiFetch<{ leaderboard: { rank: number; name: string; email: string; total: number }[] }>(
      '/rating/leaderboard',
    ),
}
