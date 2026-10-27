import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Browse from './pages/Browse.jsx';
import Login from './pages/Login.jsx';

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="top">
        <Link to="/" className="brand">SwapKart</Link>
        <nav>
          <NavLink to="/" end>Browse</NavLink>
          {user ? (
            <>
              <span className="who">Hi, {user.name.split(' ')[0]}</span>
              <button className="link" onClick={logout}>Log out</button>
            </>
          ) : <NavLink to="/login">Log in</NavLink>}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<p className="state">This page does not exist. <Link to="/">Back to browsing</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
