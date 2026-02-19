import './App.css'
import { NavLink, Route, Routes } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import QrSignPage from './pages/QrSignPage'
import RegisterChildPage from './pages/RegisterChildPage'
import SignInPage from './pages/SignInPage'
import SignOutPage from './pages/SignOutPage'
import { getTeamPin, isTeamUnlocked, lockTeam, setTeamPin, unlockTeam } from './lib/teamAccess'
import { useMemo, useState } from 'react'

type TeamGateProps = {
  teamUnlocked: boolean
  onRefresh: () => void
}

function TeamGate({ teamUnlocked, onRefresh }: TeamGateProps) {
  const [pinAttempt, setPinAttempt] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')

  if (teamUnlocked) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Team tools</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            This section is for the Celebkids team.
          </p>

          <div className="actions wrap" style={{ justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                lockTeam()
                setPinAttempt('')
                setPinError(null)
                onRefresh()
              }}
            >
              Log out
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div className="strong">Change Team PIN (on this device)</div>
            <div className="muted small" style={{ marginTop: 6 }}>
              Keep it simple for volunteers. This is a device-only PIN (not a full online login).
            </div>
            <div className="grid2" style={{ marginTop: 10 }}>
              <label>
                New PIN
                <input
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g., 4321"
                  autoComplete="off"
                />
              </label>
              <div className="actions" style={{ alignItems: 'end', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => {
                    const p = newPin.trim()
                    if (p.length < 4) {
                      alert('Please use at least 4 digits/characters.')
                      return
                    }
                    setTeamPin(p)
                    setNewPin('')
                    alert('Team PIN updated on this device.')
                  }}
                >
                  Save PIN
                </button>
              </div>
            </div>

            <div className="muted small" style={{ marginTop: 8 }}>
              Current PIN hint: {getTeamPin() === '1234' ? 'default PIN is still set (1234)' : 'custom PIN is set'}
            </div>
          </div>
        </div>

        <AdminPage />
      </div>
    )
  }

  return (
    <section className="card">
      <h2>Team access</h2>
      <p className="muted">Enter the Instructors Password to open the Team section on this device.</p>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          setPinError(null)
          const ok = unlockTeam(pinAttempt)
          if (!ok) {
            setPinError('Wrong PIN. Please try again.')
            return
          }
          setPinAttempt('')
          onRefresh()
        }}
      >
        <label>
          Team PIN
          <input
            value={pinAttempt}
            onChange={(e) => setPinAttempt(e.target.value)}
            inputMode="numeric"
            placeholder="Enter PIN"
            autoComplete="off"
          />
        </label>

        {pinError ? <div className="alert error">{pinError}</div> : null}

        <div className="actions">
          <button type="submit">Unlock</button>
        </div>

        <div className="muted small">
          First time? The default PIN is <span className="mono">1234</span> (you can change it after unlocking).
        </div>
      </form>
    </section>
  )
}

function App() {
  const [teamRefresh, setTeamRefresh] = useState(0)
  const teamUnlocked = useMemo(() => {
    void teamRefresh
    return isTeamUnlocked()
  }, [teamRefresh])

  const refreshTeamGate = () => setTeamRefresh((x) => x + 1)

  return (
    <div className="app">
      <header className="appHeader">
        <div className="brand">
          <img
            className="brandLogo"
            src={`${import.meta.env.BASE_URL}logos/Asset%20199@4x.png`}
            srcSet={`${import.meta.env.BASE_URL}logos/Asset%20203@4x.png 2x`}
            alt="Celebkids"
            loading="eager"
            onError={(e) => {
              // Fallback visible placeholder if the logo can't be loaded (e.g., path/base issues)
              const img = e.currentTarget
              img.style.display = 'none'
              const parent = img.parentElement
              if (parent && !parent.querySelector('.brandLogoFallback')) {
                const div = document.createElement('div')
                div.className = 'brandLogo brandLogoFallback'
                div.textContent = 'CK'
                parent.insertBefore(div, parent.firstChild)
              }
            }}
          />
          <div>
            <div className="brandTitle">Celebkids</div>
            <div className="brandSubtitle">In Christ for Christ with Joy</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            Drop-off
          </NavLink>
          <NavLink to="/sign-out" className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            Pick-up
          </NavLink>
          <NavLink to="/register" className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            New here?
          </NavLink>
          <NavLink to="/admin" className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            Team
          </NavLink>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/sign-out" element={<SignOutPage />} />
          <Route path="/register" element={<RegisterChildPage />} />
          <Route path="/admin" element={<TeamGate teamUnlocked={teamUnlocked} onRefresh={refreshTeamGate} />} />
          <Route path="/qr" element={<QrSignPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>
          “Let the little children come to me, and do not hinder them, for the kingdom of heaven belongs to such as these.” — Matthew 19:14
        </span>
      </footer>
    </div>
  )
}

export default App
