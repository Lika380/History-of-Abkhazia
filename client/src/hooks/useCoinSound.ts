const COIN_SOUND_URL = '/sounds/coin.mp3'
const COIN_SOUND_START = 0.8
const COIN_SOUND_DURATION = 0.85
const COIN_SOUND_FADE_OUT = 0.4

let audioCtx: AudioContext | null = null
let bufferPromise: Promise<AudioBuffer> | null = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function loadBuffer() {
  if (!bufferPromise) {
    const ctx = getAudioContext()
    bufferPromise = fetch(COIN_SOUND_URL)
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
  }
  return bufferPromise
}

// Стартуем загрузку и декодирование сразу, чтобы к первому клику звук уже был готов.
loadBuffer()

export function useCoinSound() {
  const playCoinSound = () => {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    loadBuffer()
      .then((buffer) => {
        const source = ctx.createBufferSource()
        const gain = ctx.createGain()
        const now = ctx.currentTime
        const fadeStart = now + Math.max(COIN_SOUND_DURATION - COIN_SOUND_FADE_OUT, 0)

        gain.gain.setValueAtTime(1, now)
        gain.gain.setValueAtTime(1, fadeStart)
        gain.gain.linearRampToValueAtTime(0, now + COIN_SOUND_DURATION)

        source.buffer = buffer
        source.connect(gain)
        gain.connect(ctx.destination)
        source.start(now, COIN_SOUND_START, COIN_SOUND_DURATION)
      })
      .catch(() => {})
  }

  return { playCoinSound }
}
