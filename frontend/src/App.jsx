import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import JobClassPage from './pages/JobClassPage'
import JobClassDetailPage from './pages/JobClassDetailPage'
import GuestQuestPage from './pages/GuestQuestPage'
import ProfilePage from './pages/ProfilePage'
import GuildListPage from './pages/GuildListPage'
import GuildCreatePage from './pages/GuildCreatePage'
import GuildDetailPage from './pages/GuildDetailPage'
import QuestPage from './pages/QuestPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobClassPage />} />
        <Route path="/job-classes/:id" element={<JobClassDetailPage />} />
        <Route path="/guest-quest/:job_class_id" element={<GuestQuestPage />} />
        <Route path="/profile" element={
          <>
            <SignedIn><ProfilePage /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        <Route path="/guilds" element={<GuildListPage />} />
        <Route path="/guilds/create" element={
          <>
            <SignedIn><GuildCreatePage /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        <Route path="/guilds/:id" element={<GuildDetailPage />} />
        <Route path="/quests/:quest_id" element={
          <>
            <SignedIn><QuestPage /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App