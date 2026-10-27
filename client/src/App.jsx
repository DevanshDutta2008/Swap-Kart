import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { useAuth, RequireAuth } from './auth.jsx';
import Browse from './pages/Browse.jsx';
import Login from './pages/Login.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import Sell from './pages/Sell.jsx';
import Checkout from './pages/Checkout.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Offers from './pages/Offers.jsx';
import Orders from './pages/Orders.jsx';
import Notifications from './pages/Notifications.jsx';

export default function App() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [unread, setUnread] = useState(0);
  const refresh = () => user && api('/notifications').then((d) => setUnread(d.unread)).catch(() => {});
  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, [user, loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="glow" aria-hidden="true" />
      <header className="top">
        <Link to="/" className="brand">SwapKart</Link>
        <nav>
          <NavLink to="/" end>Browse</NavLink>
          {user ? (
            <>
              <NavLink to="/wishlist">Wishlist</NavLink>
              <NavLink to="/offers">Offers</NavLink>
              <NavLink to="/orders">Orders</NavLink>
              <NavLink to="/alerts">Alerts{unread > 0 && <span className="badge">{unread}</span>}</NavLink>
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
          <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
          <Route path="/offers" element={<RequireAuth><Offers /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/alerts" element={<RequireAuth><Notifications onRead={refresh} /></RequireAuth>} />
          <Route path="/sell" element={<RequireAuth><Sell /></RequireAuth>} />
          <Route path="/checkout/:id" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="*" element={<p className="state">This page does not exist. <Link to="/">Back to browsing</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
