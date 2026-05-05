import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { useEffect } from 'react'
import JobClassPage from './pages/JobClassPage'
import JobClassDetailPage from './pages/JobClassDetailPage'
import GuestQuestPage from './pages/GuestQuestPage'
import ProfilePage from './pages/ProfilePage'
import GuildListPage from './pages/GuildListPage'
import GuildCreatePage from './pages/GuildCreatePage'
import GuildDetailPage from './pages/GuildDetailPage'
import QuestPage from './pages/QuestPage'
import PublicProfilePage from './pages/PublicProfilePage'
import PlanPage from './pages/PlanPage'
import DMPage from './pages/DMPage'
import TermsPage from './pages/TermsPage'
import WithdrawPage from './pages/WithdrawPage'
import BgmButton, { useBgm } from './BgmPlayer'

function BgmController({ bgm }) {
  const location = useLocation()
  useEffect(() => {
    const path = location.pathname
    if (path === '/' || path.startsWith('/job-classes') || path.startsWith('/guilds')) {
      bgm.play('top')
    }
  }, [location.pathname])
  return <BgmButton bgm={bgm} />
}

function App() {
  const bgm = useBgm()
  return (
    <BrowserRouter>
      <BgmController bgm={bgm} />
      <Routes>
        <Route path="/" element={<JobClassPage />} />
        <Route path="/job-classes/:id" element={<JobClassDetailPage />} />
        <Route path="/guest-quest/:job_class_id" element={<GuestQuestPage bgm={bgm} />} />
        <Route path="/profile" element={
          <><SignedIn><ProfilePage /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>
        } />
        <Route path="/guilds" element={<GuildListPage />} />
        <Route path="/guilds/create" element={
          <><SignedIn><GuildCreatePage /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>
        } />
        <Route path="/guilds/:id" element={<GuildDetailPage />} />
        <Route path="/quests/:quest_id" element={
          <><SignedIn><QuestPage bgm={bgm} /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>
        } />
        <Route path="/users/:user_id" element={<PublicProfilePage />} />
        <Route path="/plan" element={
          <><SignedIn><PlanPage /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>
        } />
        <Route path="/dm/:match_id" element={
          <><SignedIn><DMPage /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>
        } />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/withdraw" element={
          <><SignedIn><WithdrawPage /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App