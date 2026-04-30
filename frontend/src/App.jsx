import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import JobClassPage from './pages/JobClassPage'
import ProfilePage from './pages/ProfilePage'
import GuildListPage from './pages/GuildListPage'
import GuildCreatePage from './pages/GuildCreatePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobClassPage />} />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App