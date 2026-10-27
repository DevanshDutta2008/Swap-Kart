import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Wishlist() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const load = () => api('/wishlist').then((d) => setRows(d.wishlist)).catch(setError);
  useEffect(() => { load(); }, []);
  const remove = async (itemId) => { try { await api(`/wishlist/${itemId}`, { method: 'DELETE' }); load(); } catch (e) { setError(e); } };

  if (error) return <p className="state err" role="alert">{error.message}</p>;
  if (!rows) return <p className="state">Loading your wishlist…</p>;
  return (
    <>
      <h1>Your wishlist</h1>
      {rows.length === 0 ? <p className="state">You have not saved anything yet. <Link to="/">Find something to save</Link></p> : (
        <ul className="list">
          {rows.map(({ id, item, priceWhenSaved }) => (
            <li key={id} className="card rowcard">
              <div>
                <Link to={`/items/${item._id}`}><strong>{item.title}</strong></Link>
                <p className="meta">{item.status === 'sold' ? 'Sold' : item.status === 'reserved' ? 'On hold' : 'Available'}</p>
              </div>
              <div className="right">
                <span className="price">₹{item.price}</span>
                {item.price < priceWhenSaved && <p className="ok">Dropped from ₹{priceWhenSaved}</p>}
                <button className="link" onClick={() => remove(item._id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
