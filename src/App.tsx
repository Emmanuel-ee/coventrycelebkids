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
          <Route path="/admin" element={<AdminPage />} />
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
