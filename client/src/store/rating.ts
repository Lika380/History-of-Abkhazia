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
  fetchMyRating: () => Promise<void>
  fetchLeaderboard: () => Promise<void>
  submitAttempt: (topicId: string, score: number, totalQuestions: number) => Promise<void>
}

export const useRatingStore = create<RatingState>((set) => ({
  myTotal: 0,
  byTopic: [],
  myStatus: 'idle',
  leaderboard: [],
  leaderboardStatus: 'idle',

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
      const { leaderboard } = await api.getLeaderboard()
      set({ leaderboard, leaderboardStatus: 'loaded' })
    } catch {
      set({ leaderboardStatus: 'error' })
    }
  },

  submitAttempt: async (topicId, score, totalQuestions) => {
    await api.submitAttempt(topicId, score, totalQuestions)
  },
}))
