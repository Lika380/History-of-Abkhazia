import { create } from 'zustand'

// Заглушка на этап 1 (каркас). Форма состояния предварительно согласована
// со схемой Supabase из ТЗ (раздел 7: topic_progress), чтобы на этапе 6
// подключить облако без переписывания компонентов.
export interface TopicProgress {
  topic: string
  totalAnswered: number
  correctCount: number
  lastReviewed: string | null
}

interface ProgressState {
  topicProgress: Record<string, TopicProgress>
  getTopicProgress: (topic: string) => TopicProgress
}

const emptyProgress = (topic: string): TopicProgress => ({
  topic,
  totalAnswered: 0,
  correctCount: 0,
  lastReviewed: null,
})

export const useProgressStore = create<ProgressState>((_set, get) => ({
  topicProgress: {},
  getTopicProgress: (topic) => get().topicProgress[topic] ?? emptyProgress(topic),
}))
