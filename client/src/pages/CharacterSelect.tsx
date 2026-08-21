import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import charactersData from '../data/characters.json'
import CharacterAvatar from '../components/CharacterAvatar'
import { useCharacterStore } from '../store/character'
import { useAuthStore } from '../store/auth'
import { type Group } from '../lib/characterStage'

const groups = charactersData.groups as Group[]

export default function CharacterSelect() {
  const selectCharacter = useCharacterStore((s) => s.selectCharacter)
  const currentCharacterId = useCharacterStore((s) => s.characterId)
  const user = useAuthStore((s) => s.user)
  const updateName = useAuthStore((s) => s.updateName)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const navigate = useNavigate()

  async function handleSelect(characterId: string) {
    setSaving(characterId)
    try {
      await selectCharacter(characterId)
      navigate('/stats')
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === user?.name) return
    setSavingName(true)
    try {
      await updateName(trimmed)
      setIsEditingName(false)
    } finally {
      setSavingName(false)
    }
  }

  const visibleGroups = groups.filter((group) => group.id === selectedGroupId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link to="/stats" className="text-xl text-(--color-brand-green)">
          ←
        </Link>
        <h1 className="text-xl font-semibold text-(--color-ink)">Выбор персонажа</h1>
      </div>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        {isEditingName ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Введите имя"
              maxLength={100}
              autoFocus
              className="flex-1 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-ink) outline-none focus:border-(--color-brand-green)"
            />
            <button
              onClick={() => void handleSaveName()}
              disabled={savingName || !nameInput.trim() || nameInput.trim() === user?.name}
              className="rounded-xl bg-(--color-brand-green) px-4 py-2 font-medium text-(--color-surface) disabled:opacity-60"
            >
              {savingName ? 'Сохранение…' : 'Сохранить'}
            </button>
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

      <div className="flex gap-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold ${
              selectedGroupId === group.id
                ? 'border-(--color-brand-green) bg-(--color-brand-green-light) text-(--color-ink)'
                : 'border-(--color-border) bg-(--color-surface) text-(--color-muted)'
            }`}
          >
            {group.title}
          </button>
        ))}
      </div>

      {visibleGroups.map((group, groupIndex) => (
        <div key={group.id} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-(--color-muted)">{group.title}</h2>
          <div className="grid grid-cols-2 gap-3">
            {group.characters.map((character, characterIndex) => {
              const isSelected = character.id === currentCharacterId
              const colorIndex = groupIndex * group.characters.length + characterIndex
              return (
                <button
                  key={character.id}
                  onClick={() => void handleSelect(character.id)}
                  disabled={saving !== null}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center disabled:opacity-60 ${
                    isSelected
                      ? 'border-(--color-brand-green) bg-(--color-brand-green-light)'
                      : 'border-(--color-border) bg-(--color-surface)'
                  }`}
                >
                  <CharacterAvatar name={character.name} icon={character.stages[0]?.icon} colorIndex={colorIndex} />
                  <span className="text-sm text-(--color-muted)">{character.description}</span>
                  {saving === character.id && <span className="text-xs text-(--color-muted)">Сохранение…</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
