import { Suspense, lazy, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Splash from './components/Splash'
import { useAuthStore } from './store/auth'
import { useRatingStore } from './store/rating'
import { useCharacterStore } from './store/character'

const Home = lazy(() => import('./pages/Home'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Flashcards = lazy(() => import('./pages/Flashcards'))
const Material = lazy(() => import('./pages/Material'))
const Dates = lazy(() => import('./pages/Dates'))
const Artifacts = lazy(() => import('./pages/Artifacts'))
const ExamMode = lazy(() => import('./pages/ExamMode'))
const Stats = lazy(() => import('./pages/Stats'))
const CharacterSelect = lazy(() => import('./pages/CharacterSelect'))
const Login = lazy(() => import('./pages/Login'))

const SPLASH_DURATION = 1000

function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const fetchMyRating = useRatingStore((s) => s.fetchMyRating)
  const fetchLeaderboard = useRatingStore((s) => s.fetchLeaderboard)
  const fetchCharacter = useCharacterStore((s) => s.fetchCharacter)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    fetchMe()
    fetchMyRating()
    fetchLeaderboard()
    fetchCharacter()
  }, [fetchMe, fetchMyRating, fetchLeaderboard, fetchCharacter])

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <Splash />
  }

  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/quiz/:topicId" element={<Quiz />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/material/:id" element={<Material />} />
          <Route path="/dates" element={<Dates />} />
          <Route path="/artifacts" element={<Artifacts />} />
          <Route path="/exam" element={<ExamMode />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/stats" element={<Stats />} />
            <Route path="/stats/character" element={<CharacterSelect />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
