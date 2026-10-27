import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Notifications({ onRead }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const load = () => api('/notifications').then((d) => setList(d.notifications)).catch(setError);
  useEffect(() => { load(); }, []);
  const readAll = async () => { try { await api('/notifications/read-all', { method: 'PATCH' }); await load(); onRead?.(); } catch (e) { setError(e); } };

  if (error) return <p className="state err" role="alert">{error.message}</p>;
  if (!list) return <p className="state">Loading alerts…</p>;
  return (
    <>
      <div className="rowcard"><h1>Alerts</h1>{list.some((n) => !n.read) && <button className="btn ghost" onClick={readAll}>Mark all as read</button>}</div>
      {list.length === 0 ? <p className="state">Nothing yet. Price drops, offers and order updates show up here.</p> : (
        <ul className="list">
          {list.map((n) => (
            <li key={n._id} className={`card rowcard ${n.read ? '' : 'unread'}`}>
              <span>{n.message}</span>
              {n.item && <Link to={`/items/${n.item}`}>View item</Link>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
