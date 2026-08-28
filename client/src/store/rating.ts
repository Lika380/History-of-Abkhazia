import { create } from 'zustand'
import { api } from '../lib/api'

interface TopicRating {
  topicId: string
  total: number
  attempts: number
  bestScore: number
  totalQuestions: number
}

interface LeaderboardEntry {
  rank: number
  name: string
  email: string
  total: number
}

type RatingStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface RatingState {
  myTotal: number
  byTopic: TopicRating[]
  myStatus: RatingStatus
  leaderboard: LeaderboardEntry[]
  leaderboardStatus: RatingStatus
  seasonYear: number | null
  fetchMyRating: () => Promise<void>
  fetchLeaderboard: () => Promise<void>
  submitAttempt: (topicId: string, score: number, totalQuestions: number) => Promise<{ counted: boolean }>
  resetMine: () => void
}

export const useRatingStore = create<RatingState>((set) => ({
  myTotal: 0,
  byTopic: [],
  myStatus: 'idle',
  leaderboard: [],
  leaderboardStatus: 'idle',
  seasonYear: null,

  fetchMyRating: async () => {
    set({ myStatus: 'loading' })
    try {
      const { total, byTopic } = await api.getMyRating()
      set({ myTotal: total, byTopic, myStatus: 'loaded' })
    } catch {
      set({ myStatus: 'error' })
    }
  },

  fetchLeaderboard: async () => {
    set({ leaderboardStatus: 'loading' })
    try {
      const { leaderboard, seasonYear } = await api.getLeaderboard()
      set({ leaderboard, seasonYear, leaderboardStatus: 'loaded' })
    } catch {
      set({ leaderboardStatus: 'error' })
    }
  },

  submitAttempt: async (topicId, score, totalQuestions) => {
    const { counted } = await api.submitAttempt(topicId, score, totalQuestions)
    return { counted }
  },

  resetMine: () => set({ myTotal: 0, byTopic: [], myStatus: 'idle' }),
}))
