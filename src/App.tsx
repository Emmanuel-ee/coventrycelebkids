import './App.css'
import { NavLink, Route, Routes } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import QrSignPage from './pages/QrSignPage'
import RegisterChildPage from './pages/RegisterChildPage'
import SignInPage from './pages/SignInPage'
import SignOutPage from './pages/SignOutPage'

function App() {
  return (
    <div className="app">
      <header className="appHeader">
        <div className="brand">
          <img
            className="brandLogo"
            src={`${import.meta.env.BASE_URL}logos/Asset 199@4x.png`}
            alt="Celebkids"
          />
          <div>
            <div className="brandTitle">Celebkids</div>
            <div className="brandSubtitle">Simple, friendly drop-off & pick-up for children’s class</div>
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
            First time
          </NavLink>
          <NavLink to="/admin" className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            Instructors
          </NavLink>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/sign-out" element={<SignOutPage />} />
          <Route path="/register" element={<RegisterChildPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/qr" element={<QrSignPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>Tip: use “Instructors → Export” to keep weekly records.</span>
      </footer>
    </div>
  )
}

export default App
