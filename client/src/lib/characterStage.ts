import { SECTION_COUNT, sectionTopicIds } from './materialTopics'

export const EPOCH_COUNT = SECTION_COUNT

interface TopicProgress {
  topicId: string
  bestScore: number
  totalQuestions: number
}

export function completedEpochsCount(byTopic: TopicProgress[]): number {
  let count = 0
  for (let sectionIndex = 0; sectionIndex < SECTION_COUNT; sectionIndex++) {
    const allPerfect = sectionTopicIds(sectionIndex).every((id) => {
      const entry = byTopic.find((t) => t.topicId === id)
      return !!entry && entry.totalQuestions > 0 && entry.bestScore === entry.totalQuestions
    })
    if (!allPerfect) break
    count++
  }
  return count
}
