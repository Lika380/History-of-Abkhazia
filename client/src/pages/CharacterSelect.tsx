import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CharacterAvatar from '../components/CharacterAvatar'
import { useCharacterStore } from '../store/character'
import { useAuthStore } from '../store/auth'
import { ApiError } from '../lib/api'
import { resizeImageFile } from '../lib/resizeImage'

const GENDERS = [
  { id: 'male', title: 'Мужской', colorIndex: 0 },
  { id: 'female', title: 'Женский', colorIndex: 1 },
]

export default function CharacterSelect() {
  const characterId = useCharacterStore((s) => s.characterId)
  const avatar = useCharacterStore((s) => s.avatar)
  const selectGender = useCharacterStore((s) => s.selectGender)
  const setAvatar = useCharacterStore((s) => s.setAvatar)
  const user = useAuthStore((s) => s.user)
  const updateName = useAuthStore((s) => s.updateName)
  const [savingGender, setSavingGender] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedGender = GENDERS.find((g) => g.id === characterId)

  async function handleSelectGender(id: string) {
    setSavingGender(true)
    try {
      await selectGender(id)
    } finally {
      setSavingGender(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingAvatar(true)
    try {
      const dataUrl = await resizeImageFile(file)
      await setAvatar(dataUrl)
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === user?.name) return
    setSavingName(true)
    setNameError(null)
    try {
      await updateName(trimmed)
      setIsEditingName(false)
    } catch (err) {
      setNameError(
        err instanceof ApiError && err.message === 'name_taken'
          ? 'Такой персонаж уже существует — выберите другое имя'
          : 'Не удалось сохранить имя',
      )
    } finally {
      setSavingName(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/stats" className="flex items-center gap-2">
        <span className="text-xl text-(--color-brand-green)">‹</span>
        <h1 className="text-xl font-semibold text-(--color-ink)">Выбор персонажа</h1>
      </Link>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        {isEditingName ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value)
                  setNameError(null)
                }}
                placeholder="Введите имя"
                maxLength={100}
                autoFocus
                className="min-w-0 flex-1 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-ink) outline-none focus:border-(--color-brand-green)"
              />
              <button
                onClick={() => void handleSaveName()}
                disabled={savingName || !nameInput.trim() || nameInput.trim() === user?.name}
                className="shrink-0 rounded-xl bg-(--color-brand-green) px-3 py-1.5 text-sm font-medium text-(--color-surface) disabled:opacity-60"
              >
                {savingName ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
            {nameError && <p className="text-xs text-(--color-brand-red)">{nameError}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-(--color-ink)">{user?.name || 'Без имени'}</span>
            <button onClick={() => setIsEditingName(true)} className="text-xs text-(--color-muted)">
              изменить
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="relative h-24 w-24 rounded-full disabled:opacity-60"
        >
          <CharacterAvatar
            name={user?.name || '?'}
            icon={avatar ?? undefined}
            colorIndex={selectedGender?.colorIndex ?? 0}
            size={96}
          />
          <span className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-(--color-surface) bg-(--color-brand-green) text-sm text-(--color-surface)">
            📷
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFileChange(e)} />
        <span className="text-sm text-(--color-muted)">
          {uploadingAvatar ? 'Загрузка…' : 'Нажмите на фото, чтобы загрузить своё'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-(--color-muted)">Пол персонажа</h2>
        <div className="flex gap-2">
          {GENDERS.map((gender) => (
            <button
              key={gender.id}
              onClick={() => void handleSelectGender(gender.id)}
              disabled={savingGender}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
                characterId === gender.id
                  ? 'border-(--color-brand-green) bg-(--color-brand-green-light) text-(--color-ink)'
                  : 'border-(--color-border) bg-(--color-surface) text-(--color-muted)'
              }`}
            >
              {gender.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
