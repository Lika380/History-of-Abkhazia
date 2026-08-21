import { create } from 'zustand'
import { api } from '../lib/api'

type CharacterStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface CharacterState {
  characterId: string | null
  status: CharacterStatus
  fetchCharacter: () => Promise<void>
  selectCharacter: (characterId: string) => Promise<void>
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characterId: null,
  status: 'idle',

  fetchCharacter: async () => {
    set({ status: 'loading' })
    try {
      const { characterId } = await api.getCharacter()
      set({ characterId, status: 'loaded' })
    } catch {
      set({ status: 'error' })
    }
  },

  selectCharacter: async (characterId) => {
    const { characterId: saved } = await api.setCharacter(characterId)
    set({ characterId: saved, status: 'loaded' })
  },
}))
