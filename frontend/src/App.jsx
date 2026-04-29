import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import JobClassPage from './pages/JobClassPage'
import ProfilePage from './pages/ProfilePage'

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
      </Routes>
    </BrowserRouter>
  )
}

export default App