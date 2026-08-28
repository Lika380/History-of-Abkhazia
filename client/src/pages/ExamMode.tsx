import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import examSections from '../data/examSections.json'
import { useAuthStore } from '../store/auth'
import { useRatingStore } from '../store/rating'
import { materialTopics, materialTopicId, sectionTitles, SECTION_COUNT } from '../lib/materialTopics'
import { type DragMatchPair } from '../components/DragMatch'
import DragMatchGame from '../components/DragMatchGame'

const DRAG_TOPICS = materialTopics.slice(0, 20)

const MODE_CARDS = [
  { mode: 1 as const, title: 'Тесты по каждой теме', image: '/test1.webp' },
  { mode: 2 as const, title: 'Перетаскивание', image: '/test2.webp' },
  { mode: 3 as const, title: '1 минута: проверь себя', image: '/test3.webp' },
]

// Перетаскивание не влияет на рейтинг — вопросы пока сделаны только для
// первого блока, остальные блоки открываются, но показывают заглушку.
const PALEOLIT_PAIRS: DragMatchPair[] = [
  { id: 'paleolit', term: 'Палеолит', definition: 'Древнейший период человеческой истории' },
  { id: 'ashel', term: 'Ашель', definition: 'Ранний период палеолита в Абхазии' },
  { id: 'muste', term: 'Мустье', definition: 'Средний период палеолита в Абхазии' },
  { id: 'yashtukh', term: 'Яштух', definition: 'Стоянка мирового значения на окраине Сухума' },
  { id: 'arhantropy', term: 'Архантропы', definition: 'Люди раннего палеолита' },
  { id: 'neandertalcy', term: 'Неандертальцы', definition: 'Люди среднего палеолита' },
  { id: 'neoantropy', term: 'Неоантропы', definition: 'Люди позднего палеолита (Homo sapiens)' },
  { id: 'evropeoidnaya', term: 'Европеоидная', definition: 'Раса, к которой относится древнее население Абхазии' },
  { id: 'rubilo', term: 'Ручное рубило', definition: 'Характерное орудие раннего палеолита' },
  { id: 'ashel-vremya', term: '400–300 тыс. лет назад', definition: 'Начало ашельской эпохи в Абхазии' },
  { id: 'stoyanka', term: 'Стоянка', definition: 'Памятник, дошедший до нас в неизменном виде' },
  { id: 'mestonahozhdenie', term: 'Местонахождение', definition: 'Памятник в переотложенном природой состоянии' },
  { id: 'rodovoy-stroy', term: 'Родовой строй', definition: 'Общественный строй позднего палеолита' },
  { id: 'pervobytnoe-stado', term: 'Первобытное стадо', definition: 'Общественный строй раннего и среднего палеолита' },
]

const DRAG_ROUNDS = 15
const DRAG_PAIRS_PER_ROUND = 4
const DRAG_MAX_MISTAKES = 5

interface ChoiceQuestion {
  type: 'choice'
  question: string
  options: string[]
  correctIndex: number
}

interface FillQuestion {
  type: 'fill'
  question: string
  answers: string[]
}

type ExamQuestion = ChoiceQuestion | FillQuestion

const questionsBySection = examSections as Record<string, Record<string, ExamQuestion[]>>

// «1 минута: проверь себя» не влияет на рейтинг — считаем только количество
// правильных ответов за минуту, а личный рекорд храним локально в браузере,
// а не на сервере. Вопросы разбиты по эпохам (разделам); пока готовы только
// для первой эпохи — остальные эпохи открыты, но без вопросов.
const CHOICE_QUESTIONS_BY_SECTION: ChoiceQuestion[][] = Array.from({ length: SECTION_COUNT }, (_, sectionIndex) =>
  Object.values(questionsBySection[String(sectionIndex)] ?? {})
    .flat()
    .filter((q): q is ChoiceQuestion => q.type === 'choice'),
)

const SPEED_DURATION = 60
function speedRecordKey(sectionIdx: number) {
  return `examSpeedRecord_${sectionIdx}`
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

type Mode = 1 | 2 | 3

export default function ExamMode() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [sectionIndex, setSectionIndex] = useState<number | null>(null)
  const [itemNumber, setItemNumber] = useState<number | null>(null)
  const [dragTopicIndex, setDragTopicIndex] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [fillValue, setFillValue] = useState('')
  const [fillChecked, setFillChecked] = useState(false)
  const [finished, setFinished] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'not_counted' | 'error'>('idle')

  const [speedSectionIndex, setSpeedSectionIndex] = useState<number | null>(null)
  const [speedRunning, setSpeedRunning] = useState(false)
  const [speedTimeLeft, setSpeedTimeLeft] = useState(SPEED_DURATION)
  const [speedAnswered, setSpeedAnswered] = useState(0)
  const [speedQuestion, setSpeedQuestion] = useState<ChoiceQuestion | null>(null)
  const [speedFinished, setSpeedFinished] = useState(false)
  const [speedRecords, setSpeedRecords] = useState<Record<number, number>>({})

  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated')
  const byTopic = useRatingStore((s) => s.byTopic)
  const submitAttempt = useRatingStore((s) => s.submitAttempt)
  const fetchMyRating = useRatingStore((s) => s.fetchMyRating)

  const questions =
    sectionIndex !== null && itemNumber !== null
      ? (questionsBySection[String(sectionIndex)]?.[String(itemNumber)] ?? [])
      : []
  const question = questions[index]
  const currentTopicId = sectionIndex !== null && itemNumber !== null ? materialTopicId(sectionIndex, itemNumber) : null

  function isTopicPassed(topicId: string) {
    const entry = byTopic.find((t) => t.topicId === topicId)
    return !!entry && entry.totalQuestions > 0 && entry.bestScore === entry.totalQuestions
  }

  useEffect(() => {
    if (!finished || !currentTopicId || !isAuthenticated) return
    setSaveStatus('saving')
    submitAttempt(currentTopicId, score, questions.length)
      .then(({ counted }) => {
        setSaveStatus(counted ? 'saved' : 'not_counted')
        if (counted) fetchMyRating()
      })
      .catch(() => setSaveStatus('error'))
  }, [finished, currentTopicId, isAuthenticated, score, questions.length, submitAttempt, fetchMyRating])

  useEffect(() => {
    const records: Record<number, number> = {}
    for (let i = 0; i < SECTION_COUNT; i++) {
      const stored = Number(localStorage.getItem(speedRecordKey(i)) ?? 0)
      if (!Number.isNaN(stored)) records[i] = stored
    }
    setSpeedRecords(records)
  }, [])

  const speedAnsweredRef = useRef(0)
  useEffect(() => {
    speedAnsweredRef.current = speedAnswered
  }, [speedAnswered])

  useEffect(() => {
    if (!speedRunning) return
    if (speedTimeLeft <= 0) {
      setSpeedRunning(false)
      setSpeedFinished(true)
      const sectionIdx = speedSectionIndexRef.current ?? 0
      setSpeedRecords((prev) => {
        const next = Math.max(prev[sectionIdx] ?? 0, speedAnsweredRef.current)
        localStorage.setItem(speedRecordKey(sectionIdx), String(next))
        return { ...prev, [sectionIdx]: next }
      })
      return
    }
    const timer = setTimeout(() => setSpeedTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [speedRunning, speedTimeLeft])

  const speedQueueRef = useRef<ChoiceQuestion[]>([])
  const speedSectionIndexRef = useRef<number | null>(null)

  function drawSpeedQuestion() {
    if (speedQueueRef.current.length === 0) {
      const pool = CHOICE_QUESTIONS_BY_SECTION[speedSectionIndexRef.current ?? 0]
      let deck = shuffle(pool)
      if (speedQuestion && deck[0] === speedQuestion) {
        deck = [...deck.slice(1), deck[0]]
      }
      speedQueueRef.current = deck
    }
    return speedQueueRef.current.shift()!
  }

  function startSpeedRun(sectionIdx: number) {
    speedSectionIndexRef.current = sectionIdx
    setSpeedSectionIndex(sectionIdx)
    setSpeedAnswered(0)
    setSpeedTimeLeft(SPEED_DURATION)
    setSpeedFinished(false)
    speedQueueRef.current = []
    setSpeedQuestion(drawSpeedQuestion())
    setSpeedRunning(true)
  }

  function selectSpeedEpoch(sectionIdx: number) {
    if (CHOICE_QUESTIONS_BY_SECTION[sectionIdx].length === 0) {
      setSpeedSectionIndex(sectionIdx)
      return
    }
    startSpeedRun(sectionIdx)
  }

  function answerSpeed(selectedIndex: number) {
    if (speedQuestion && selectedIndex === speedQuestion.correctIndex) {
      setSpeedAnswered((a) => a + 1)
    }
    setSpeedQuestion(drawSpeedQuestion())
  }

  function exitSpeedMode() {
    setSpeedRunning(false)
    setSpeedFinished(false)
    setSpeedSectionIndex(null)
    setMode(null)
  }

  function resetRun() {
    setIndex(0)
    setScore(0)
    setSelectedOption(null)
    setFillValue('')
    setFillChecked(false)
    setFinished(false)
    setSaveStatus('idle')
  }

  function selectMode(m: Mode) {
    setMode(m)
    setSectionIndex(null)
    setItemNumber(null)
    setDragTopicIndex(null)
    resetRun()
  }

  function selectMaterialTopic(section: number, item: number) {
    setSectionIndex(section)
    setItemNumber(item)
    resetRun()
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelectedOption(null)
    setFillValue('')
    setFillChecked(false)
  }

  function answerChoice(optionIndex: number) {
    if (selectedOption !== null || question.type !== 'choice') return
    setSelectedOption(optionIndex)
    if (optionIndex === question.correctIndex) setScore((s) => s + 1)
  }

  function checkFill() {
    if (fillChecked || question.type !== 'fill') return
    setFillChecked(true)
    if (question.answers.some((a) => normalize(a) === normalize(fillValue))) {
      setScore((s) => s + 1)
    }
  }

  // Шаг 0: выбор варианта тренажёра
  if (mode === null) {
    return (
      <div className="flex min-h-[75svh] flex-col gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">Тренажёр</h1>
        </Link>
        <div className="flex flex-1 flex-col gap-3" style={{ backgroundColor: '#f5f4f4' }}>
          {MODE_CARDS.map((card) => (
            <button
              key={card.mode}
              onClick={() => selectMode(card.mode)}
              className="flex flex-1 items-center justify-center"
            >
              <img src={card.image} alt={card.title} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  if ((mode === 2 || mode === 3) && !isAuthenticated) {
    const title = mode === 2 ? 'Перетаскивание' : '1 минута: проверь себя'
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setMode(null)} className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">{title}</h1>
        </button>
        <p className="text-(--color-muted)">
          <Link to="/login" className="text-(--color-brand-green)">
            Войдите
          </Link>
          , чтобы играть.
        </p>
      </div>
    )
  }

  // Вариант 3: 1 минута — проверь себя
  if (mode === 3) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={exitSpeedMode} className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">1 минута: проверь себя</h1>
        </button>

        {speedFinished ? (
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
            <p className="text-lg font-medium text-(--color-ink)">Результат: {speedAnswered}</p>
            <p className="mt-1 text-sm text-(--color-muted)">
              Рекорд: {speedRecords[speedSectionIndex ?? 0] ?? 0}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => startSpeedRun(speedSectionIndex ?? 0)}
                className="rounded-xl bg-(--color-brand-green) px-4 py-3 font-medium text-(--color-surface)"
              >
                Ещё раз
              </button>
              <button
                onClick={() => {
                  setSpeedFinished(false)
                  setSpeedSectionIndex(null)
                }}
                className="rounded-xl border border-(--color-border) px-4 py-3 font-medium text-(--color-ink)"
              >
                Выбрать эпоху
              </button>
            </div>
          </div>
        ) : speedRunning && speedQuestion ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm text-(--color-muted)">
              <span>Осталось: {speedTimeLeft} сек</span>
              <span>Ответов: {speedAnswered}</span>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
              <p className="font-medium text-(--color-ink)">{speedQuestion.question}</p>
            </div>
            <div className="flex flex-col gap-2">
              {speedQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => answerSpeed(i)}
                  className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3 text-left"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : speedSectionIndex !== null ? (
          <div className="flex flex-col gap-3">
            <p className="text-(--color-muted)">Вопросы для этой эпохи скоро появятся.</p>
            <button
              onClick={() => setSpeedSectionIndex(null)}
              className="self-start rounded-xl border border-(--color-border) px-4 py-3 font-medium text-(--color-ink)"
            >
              Выбрать эпоху
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sectionTitles.map((title, i) => (
              <button
                key={i}
                onClick={() => selectSpeedEpoch(i)}
                className="flex flex-col gap-1 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 text-left text-(--color-ink)"
              >
                <span className="font-medium">{title}</span>
                <span className="text-xs text-(--color-muted)">Рекорд: {speedRecords[i] ?? 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Вариант 1: выбор темы
  if (mode === 1 && sectionIndex === null) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setMode(null)} className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">Тесты</h1>
        </button>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {materialTopics.map((topic, i) => {
            const passed = isTopicPassed(materialTopicId(topic.sectionIndex, topic.itemNumber))
            return (
              <button
                key={`${topic.sectionIndex}-${topic.itemNumber}`}
                onClick={() => selectMaterialTopic(topic.sectionIndex, topic.itemNumber)}
                className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center ${
                  passed
                    ? 'border-(--color-brand-green) bg-(--color-brand-green-light)'
                    : 'border-(--color-border) bg-(--color-surface)'
                }`}
              >
                {passed && (
                  <span className="absolute top-1 right-1 text-xs text-(--color-brand-green)">✓</span>
                )}
                <span className="text-lg font-semibold text-(--color-brand-green)">{i + 1}</span>
                <span className="line-clamp-3 text-[11px] leading-tight text-(--color-ink)">{topic.title}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Вариант 2: сетка из 20 блоков «Перетаскивание», открываются по очереди
  if (mode === 2 && dragTopicIndex === null) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setMode(null)} className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">Перетаскивание</h1>
        </button>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {DRAG_TOPICS.map((topic, i) => {
            const passed = isTopicPassed(materialTopicId(topic.sectionIndex, topic.itemNumber))
            const prevPassed =
              i === 0 || isTopicPassed(materialTopicId(DRAG_TOPICS[i - 1].sectionIndex, DRAG_TOPICS[i - 1].itemNumber))
            const locked = !prevPassed
            return (
              <button
                key={`${topic.sectionIndex}-${topic.itemNumber}`}
                onClick={() => !locked && setDragTopicIndex(i)}
                disabled={locked}
                className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center ${
                  passed
                    ? 'border-(--color-brand-green) bg-(--color-brand-green-light)'
                    : locked
                      ? 'border-(--color-border) bg-(--color-surface-alt)'
                      : 'border-(--color-border) bg-(--color-surface)'
                }`}
              >
                {passed && <span className="absolute top-1 right-1 text-xs text-(--color-brand-green)">✓</span>}
                {locked ? (
                  <img src="/key.webp" alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <span className="text-lg font-semibold text-(--color-brand-green)">{i + 1}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Вариант 2: тема выбрана. Реальное перетаскивание пока есть только в
  // первом блоке — не влияет на рейтинг, ничего никуда не отправляется.
  if (mode === 2 && dragTopicIndex !== null) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setDragTopicIndex(null)} className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">Блок {dragTopicIndex + 1}</h1>
        </button>
        {dragTopicIndex === 0 ? (
          <DragMatchGame
            pool={PALEOLIT_PAIRS}
            rounds={DRAG_ROUNDS}
            pairsPerRound={DRAG_PAIRS_PER_ROUND}
            maxMistakes={DRAG_MAX_MISTAKES}
          />
        ) : (
          <p className="text-(--color-muted)">Перетаскивание для этого блока скоро появится.</p>
        )}
      </div>
    )
  }

  const title = materialTopics.find((t) => t.sectionIndex === sectionIndex && t.itemNumber === itemNumber)?.title ?? ''
  const goBack = () => {
    setSectionIndex(null)
    setItemNumber(null)
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={goBack} className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">{title}</h1>
        </button>
        <p className="text-(--color-muted)">Вопросы для этой темы скоро появятся.</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={goBack} className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">{title}</h1>
        </button>
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-lg font-medium text-(--color-ink)">
            Результат: {score} из {questions.length}
          </p>
          {isAuthenticated ? (
            <p className="mt-2 text-sm text-(--color-muted)">
              {saveStatus === 'saving' && 'Сохраняем результат…'}
              {saveStatus === 'saved' && 'Результат сохранён в рейтинге.'}
              {saveStatus === 'not_counted' &&
                (score < questions.length
                  ? 'Есть ошибки — в рейтинг засчитываются только тесты без ошибок.'
                  : 'Эта тема уже пройдена без ошибок — результат не засчитывается повторно.')}
              {saveStatus === 'error' && 'Не удалось сохранить результат.'}
            </p>
          ) : (
            <p className="mt-2 text-sm text-(--color-muted)">
              <Link to="/login" className="text-(--color-brand-green)">
                Войдите
              </Link>
              , чтобы результат учитывался в рейтинге.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={resetRun}
            className="rounded-xl bg-(--color-brand-green) px-4 py-3 font-medium text-(--color-surface)"
          >
            Пройти ещё раз
          </button>
          <button onClick={goBack} className="rounded-xl border border-(--color-border) px-4 py-3 text-(--color-ink)">
            Другая тема
          </button>
          <button onClick={() => setMode(null)} className="rounded-xl border border-(--color-border) px-4 py-3 text-(--color-ink)">
            Другой вариант
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={goBack} className="flex items-center gap-2">
          <span className="text-xl text-(--color-brand-green)">‹</span>
          <h1 className="text-xl font-semibold text-(--color-ink)">{title}</h1>
        </button>
        <span className="text-sm text-(--color-muted)">
          {index + 1} / {questions.length}
        </span>
      </div>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <p className="font-medium text-(--color-ink)">{question.question}</p>
      </div>

      {question.type === 'choice' && (
        <div className="flex flex-col gap-2">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correctIndex
            const isSelected = i === selectedOption
            const revealed = selectedOption !== null
            return (
              <button
                key={i}
                onClick={() => answerChoice(i)}
                disabled={revealed}
                className={`rounded-xl border p-3 text-left ${
                  revealed && isCorrect
                    ? 'border-(--color-brand-green) bg-(--color-brand-green-light)'
                    : revealed && isSelected
                      ? 'border-(--color-brand-red) bg-(--color-brand-red-light)'
                      : 'border-(--color-border) bg-(--color-surface)'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'fill' && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            disabled={fillChecked}
            placeholder="Впишите ответ"
            className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-(--color-ink) outline-none focus:border-(--color-brand-green)"
          />
          {!fillChecked && (
            <button
              onClick={checkFill}
              disabled={!fillValue.trim()}
              className="self-start rounded-xl bg-(--color-brand-green) px-4 py-2 font-medium text-(--color-surface) disabled:opacity-60"
            >
              Ответить
            </button>
          )}
          {fillChecked && (
            <p
              className={
                question.answers.some((a) => normalize(a) === normalize(fillValue))
                  ? 'text-(--color-brand-green)'
                  : 'text-(--color-brand-red)'
              }
            >
              {question.answers.some((a) => normalize(a) === normalize(fillValue))
                ? 'Верно!'
                : `Неверно. Правильный ответ: ${question.answers[0]}`}
            </p>
          )}
        </div>
      )}

      {(selectedOption !== null || fillChecked) && (
        <button
          onClick={next}
          className="self-start rounded-xl bg-(--color-brand-green) px-4 py-3 font-medium text-(--color-surface)"
        >
          {index + 1 >= questions.length ? 'Завершить' : 'Далее'}
        </button>
      )}
    </div>
  )
}
