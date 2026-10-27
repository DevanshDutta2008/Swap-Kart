import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { useAuth, RequireAuth } from './auth.jsx';
import Browse from './pages/Browse.jsx';
import Login from './pages/Login.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import Sell from './pages/Sell.jsx';
import Checkout from './pages/Checkout.jsx';

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
              <NavLink to="/sell">Sell</NavLink>
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
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/sell" element={<RequireAuth><Sell /></RequireAuth>} />
          <Route path="/checkout/:id" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="*" element={<p className="state">This page does not exist. <Link to="/">Back to browsing</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
