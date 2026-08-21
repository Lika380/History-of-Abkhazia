import { create } from 'zustand'
import { api, ApiError, NetworkError, type User } from '../lib/api'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'network_error'

interface AuthState {
  user: User | null
  status: AuthStatus
  error: string | null
  fetchMe: () => Promise<void>
  requestCode: (email: string) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
  updateName: (name: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  fetchMe: async () => {
    set({ status: 'loading' })
    try {
      const { user } = await api.me()
      set({ user, status: 'authenticated' })
    } catch (err) {
      if (err instanceof NetworkError) {
        set({ user: null, status: 'network_error' })
      } else {
        set({ user: null, status: 'unauthenticated' })
      }
    }
  },

  requestCode: async (email) => {
    set({ error: null })
    try {
      await api.requestCode(email)
    } catch (err) {
      set({ error: err instanceof ApiError || err instanceof NetworkError ? err.message : 'unknown_error' })
      throw err
    }
  },

  verifyCode: async (email, code) => {
    set({ error: null })
    try {
      const { user } = await api.verifyCode(email, code)
      set({ user, status: 'authenticated' })
    } catch (err) {
      set({ error: err instanceof ApiError || err instanceof NetworkError ? err.message : 'unknown_error' })
      throw err
    }
  },

  logout: async () => {
    await api.logout().catch(() => {})
    set({ user: null, status: 'unauthenticated' })
  },

  updateName: async (name) => {
    const { name: saved } = await api.updateName(name)
    set((state) => ({ user: state.user ? { ...state.user, name: saved } : state.user }))
  },
}))
