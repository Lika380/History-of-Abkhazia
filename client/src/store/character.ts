import { create } from 'zustand'
import { api } from '../lib/api'

type CharacterStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface CharacterState {
  characterId: string | null
  avatar: string | null
  status: CharacterStatus
  fetchCharacter: () => Promise<void>
  selectGender: (characterId: string) => Promise<void>
  setAvatar: (avatar: string | null) => Promise<void>
  reset: () => void
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characterId: null,
  avatar: null,
  status: 'idle',

  fetchCharacter: async () => {
    set({ status: 'loading' })
    try {
      const { characterId, avatar } = await api.getCharacter()
      set({ characterId, avatar, status: 'loaded' })
    } catch {
      set({ status: 'error' })
    }
  },

  selectGender: async (characterId) => {
    const result = await api.updateCharacter({ characterId })
    set({ characterId: result.characterId, avatar: result.avatar, status: 'loaded' })
  },

  setAvatar: async (avatar) => {
    const result = await api.updateCharacter({ avatar })
    set({ characterId: result.characterId, avatar: result.avatar, status: 'loaded' })
  },

  reset: () => set({ characterId: null, avatar: null, status: 'idle' }),
}))
