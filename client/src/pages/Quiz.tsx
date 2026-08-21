import { useParams } from 'react-router-dom'
import topics from '../data/topics.json'

export default function Quiz() {
  const { topicId } = useParams()
  const topic = topics.find((t) => t.id === topicId)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-(--color-ink)">
        {topic ? topic.title : 'Тест'}
      </h1>
      <p className="text-(--color-muted)">
        Банк вопросов ещё не подключён — наполнение запланировано на этап 2
        (см. ТЗ, раздел 8).
      </p>
    </div>
  )
}
