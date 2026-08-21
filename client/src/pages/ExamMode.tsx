import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import examSections from '../data/examSections.json'
import { useAuthStore } from '../store/auth'
import { useRatingStore } from '../store/rating'
import { materialTopics, materialTopicId, sections, sectionTitles } from '../lib/materialTopics'

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

function normalize(value: string) {
  return value.trim().toLowerCase()
}

type Mode = 1 | 2 | 3

export default function ExamMode() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [sectionIndex, setSectionIndex] = useState<number | null>(null)
  const [itemNumber, setItemNumber] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [fillValue, setFillValue] = useState('')
  const [fillChecked, setFillChecked] = useState(false)
  const [finished, setFinished] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated')
  const submitAttempt = useRatingStore((s) => s.submitAttempt)

  const questions =
    sectionIndex !== null && itemNumber !== null
      ? (questionsBySection[String(sectionIndex)]?.[String(itemNumber)] ?? [])
      : []
  const question = questions[index]
  const currentTopicId = sectionIndex !== null && itemNumber !== null ? materialTopicId(sectionIndex, itemNumber) : null

  useEffect(() => {
    if (!finished || !currentTopicId || !isAuthenticated) return
    setSaveStatus('saving')
    submitAttempt(currentTopicId, score, questions.length)
      .then(() => setSaveStatus('saved'))
      .catch(() => setSaveStatus('error'))
  }, [finished, currentTopicId, isAuthenticated, score, questions.length, submitAttempt])

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
    resetRun()
  }

  function selectMaterialTopic(section: number, item: number) {
    setSectionIndex(section)
    setItemNumber(item)
    resetRun()
  }

  function selectSection(i: number) {
    setSectionIndex(i)
    setItemNumber(null)
    resetRun()
  }

  function selectItem(n: number) {
    setItemNumber(n)
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl text-(--color-brand-green)">
            ←
          </Link>
          <h1 className="text-xl font-semibold text-(--color-ink)">Тренажёр</h1>
        </div>
        <p className="text-(--color-muted)">Выберите вариант тестов.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => selectMode(1)}
            className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 text-left"
          >
            <span className="font-medium text-(--color-ink)">Вариант 1</span>
            <p className="text-sm text-(--color-muted)">Тесты по каждой теме</p>
          </button>
          <button
            onClick={() => selectMode(2)}
            className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 text-left"
          >
            <span className="font-medium text-(--color-ink)">Вариант 2</span>
            <p className="text-sm text-(--color-muted)">Тесты по разделам</p>
          </button>
          <button
            onClick={() => selectMode(3)}
            className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 text-left"
          >
            <span className="font-medium text-(--color-ink)">Вариант 3</span>
            <p className="text-sm text-(--color-muted)">Скоро появится</p>
          </button>
        </div>
      </div>
    )
  }

  // Вариант 3 — пока пустой
  if (mode === 3) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-(--color-ink)">Вариант 3</h1>
        <p className="text-(--color-muted)">Тесты этого варианта скоро появятся.</p>
        <button onClick={() => setMode(null)} className="self-start text-(--color-brand-green)">
          ← К выбору варианта
        </button>
      </div>
    )
  }

  // Вариант 1: выбор темы
  if (mode === 1 && sectionIndex === null) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-(--color-ink)">Вариант 1</h1>
        <p className="text-(--color-muted)">Выберите тему, по которой хотите пройти тест.</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {materialTopics.map((topic, i) => (
            <button
              key={`${topic.sectionIndex}-${topic.itemNumber}`}
              onClick={() => selectMaterialTopic(topic.sectionIndex, topic.itemNumber)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-(--color-border) bg-(--color-surface) p-2 text-center"
            >
              <span className="text-lg font-semibold text-(--color-brand-green)">{i + 1}</span>
              <span className="line-clamp-3 text-[11px] leading-tight text-(--color-ink)">{topic.title}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setMode(null)} className="self-start text-(--color-brand-green)">
          ← К выбору варианта
        </button>
      </div>
    )
  }

  // Вариант 2, шаг 1: выбор раздела
  if (mode === 2 && sectionIndex === null) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-(--color-ink)">Вариант 2</h1>
        <p className="text-(--color-muted)">Выберите раздел, по которому хотите пройти тест.</p>
        <div className="flex flex-col gap-3">
          {sectionTitles.map((title, i) => (
            <button
              key={title}
              onClick={() => selectSection(i)}
              className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 text-left"
            >
              <span className="font-medium text-(--color-ink)">{title}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setMode(null)} className="self-start text-(--color-brand-green)">
          ← К выбору варианта
        </button>
      </div>
    )
  }

  // Вариант 2, шаг 2: сетка тем раздела
  if (mode === 2 && sectionIndex !== null && itemNumber === null) {
    const section = sections[sectionIndex]
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-(--color-ink)">{section.title}</h1>
        <p className="text-(--color-muted)">Выберите тему.</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {section.items.map((item) => (
            <button
              key={item.number}
              onClick={() => item.number !== undefined && selectItem(item.number)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-(--color-border) bg-(--color-surface) p-2 text-center"
            >
              <span className="text-lg font-semibold text-(--color-brand-green)">{item.number}</span>
              <span className="line-clamp-3 text-[11px] leading-tight text-(--color-ink)">{item.title}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setSectionIndex(null)} className="self-start text-(--color-brand-green)">
          ← К выбору раздела
        </button>
      </div>
    )
  }

  const title =
    mode === 1
      ? (materialTopics.find((t) => t.sectionIndex === sectionIndex && t.itemNumber === itemNumber)?.title ?? '')
      : `${sectionTitles[sectionIndex ?? -1] ?? ''} · §${itemNumber}`
  const goBack =
    mode === 1
      ? () => {
          setSectionIndex(null)
          setItemNumber(null)
        }
      : () => setItemNumber(null)
  const backLabel = '← К выбору темы'

  if (questions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-(--color-ink)">{title}</h1>
        <p className="text-(--color-muted)">Вопросы для этой темы скоро появятся.</p>
        <button onClick={goBack} className="self-start text-(--color-brand-green)">
          {backLabel}
        </button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-(--color-ink)">{title}</h1>
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-lg font-medium text-(--color-ink)">
            Результат: {score} из {questions.length}
          </p>
          {isAuthenticated ? (
            <p className="mt-2 text-sm text-(--color-muted)">
              {saveStatus === 'saving' && 'Сохраняем результат…'}
              {saveStatus === 'saved' && 'Результат сохранён в рейтинге.'}
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
        <h1 className="text-xl font-semibold text-(--color-ink)">{title}</h1>
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
