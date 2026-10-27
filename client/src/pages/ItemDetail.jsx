import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [offer, setOffer] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [note, setNote] = useState(null); // { ok: bool, text }

  const load = useCallback(() => {
    api(`/items/${id}`).then((d) => setItem(d.item)).catch(setError);
    if (user) api('/wishlist').then((d) => setSaved(d.wishlist.some((w) => w.item._id === id))).catch(() => {});
  }, [id, user]);
  useEffect(load, [load]);

  const run = async (fn, okText) => {
    setNote(null);
    try { await fn(); if (okText) setNote({ ok: true, text: okText }); } catch (e) { setNote({ ok: false, text: e.message }); }
  };
  const needLogin = () => nav('/login', { state: { from: `/items/${id}` } });

  if (error) return <p className="state err" role="alert">{error.message} <Link to="/">Back to browsing</Link></p>;
  if (!item) return <p className="state">Loading item…</p>;

  const mine = user && item.seller._id === user.id;
  const sold = item.status === 'sold';
  const held = item.status === 'reserved' && item.reservedBy !== user?.id; // your own hold does not block you

  return (
    <article className="detail">
      <div className="pic big">{item.images?.[0] ? <img src={item.images[0]} alt={item.title} /> : <span>{item.category}</span>}</div>
      <div>
        <h1>{item.title}</h1>
        <p className="price big">₹{item.price}</p>
        <p className="meta">{item.condition} · {item.category} · sold by {item.seller.name}{item.seller.hostel ? `, ${item.seller.hostel}` : ''}</p>
        {item.description && <p>{item.description}</p>}
        {held && <p className="banner">Someone is checking out with this item. It may be back on sale in a few minutes.</p>}
        {sold && <p className="banner">This item has been sold.</p>}

        {mine ? (
          <section className="stack">
            <p className="banner">This is your listing.</p>
            {item.status === 'available' && (
              <>
                <form className="row" onSubmit={(e) => { e.preventDefault(); run(async () => { await api(`/items/${id}`, { method: 'PATCH', body: { price: Number(newPrice) } }); setNewPrice(''); load(); }, 'Price updated. People who saved this item have been told if it dropped.'); }}>
                  <input type="number" min="1" placeholder="New price ₹" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required aria-label="New price" />
                  <button className="btn ghost">Change price</button>
                </form>
                <button className="btn ghost" onClick={() => window.confirm('Remove this listing?') && run(async () => { await api(`/items/${id}`, { method: 'DELETE' }); nav('/'); })}>Remove listing</button>
              </>
            )}
          </section>
        ) : !sold && (
          <section className="stack">
            <div className="row">
              <button className="btn" onClick={() => (user ? nav(`/checkout/${id}`) : needLogin())} disabled={held}>Reserve and pay ₹{item.price}</button>
              <button className="btn ghost" onClick={() => (user ? run(async () => { await api(`/wishlist/${id}`, { method: saved ? 'DELETE' : 'POST' }); setSaved(!saved); }) : needLogin())}>
                {saved ? 'Remove from wishlist' : 'Save to wishlist'}
              </button>
            </div>
            <form className="row" onSubmit={(e) => { e.preventDefault(); if (!user) return needLogin(); run(async () => { await api('/offers', { method: 'POST', body: { itemId: id, amount: Number(offer) } }); setOffer(''); }, 'Offer sent. The seller has been notified.'); }}>
              <input type="number" min="1" placeholder="Your offer ₹" value={offer} onChange={(e) => setOffer(e.target.value)} required aria-label="Your offer" />
              <button className="btn ghost">Make an offer</button>
            </form>
            <small className="meta">Offers must be between 40% and 100% of the listed price. They expire after 48 hours.</small>
          </section>
        )}
        {note && <p className={note.ok ? 'ok' : 'err'} role="status">{note.text}</p>}
      </div>
    </article>
  );
}
