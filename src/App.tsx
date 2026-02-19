import './App.css'
import { NavLink, Route, Routes } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import RegisterChildPage from './pages/RegisterChildPage'
import SignInPage from './pages/SignInPage'
import SignOutPage from './pages/SignOutPage'

function App() {
  return (
    <div className="app">
      <header className="appHeader">
        <div className="brand">
          <div className="brandTitle">Children’s Class</div>
          <div className="brandSubtitle">Drop-off sign-in / pick-up sign-out</div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            Sign in
          </NavLink>
          <NavLink to="/sign-out" className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            Sign out
          </NavLink>
          <NavLink to="/register" className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            First-time registration
          </NavLink>
          <NavLink to="/admin" className={({ isActive }: { isActive: boolean }) => (isActive ? 'navLink active' : 'navLink')}>
            Admin
          </NavLink>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/sign-out" element={<SignOutPage />} />
          <Route path="/register" element={<RegisterChildPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>Tip: use “Admin → Export CSV” to keep weekly records.</span>
      </footer>
    </div>
  )
}

export default App
