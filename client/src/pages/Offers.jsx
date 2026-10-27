import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const LABEL = { pending: 'Waiting for the seller', countered: 'Waiting for the buyer', accepted: 'Accepted', rejected: 'Declined', withdrawn: 'Withdrawn' };
// Same turn rules as the server: who may do what.
const MOVES = { pending: { seller: ['accept', 'reject', 'counter'], buyer: ['withdraw'] }, countered: { buyer: ['accept', 'reject', 'counter'], seller: ['withdraw'] } };
const VERB = { accept: 'Accept', reject: 'Decline', counter: 'Counter', withdraw: 'Withdraw' };

export default function Offers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [note, setNote] = useState(null);
  const load = () => api('/offers').then((d) => setOffers(d.offers)).catch(setError);
  useEffect(() => { load(); }, []);

  async function act(o, action) {
    setNote(null);
    try {
      await api(`/offers/${o._id}/${action}`, { method: 'POST', body: action === 'counter' ? { amount: Number(amounts[o._id]) } : {} });
      load();
    } catch (e) { setNote(e.message); load(); }
  }

  if (error) return <p className="state err" role="alert">{error.message}</p>;
  if (!offers) return <p className="state">Loading offers…</p>;
  return (
    <>
      <h1>Offers</h1>
      {note && <p className="err" role="alert">{note}</p>}
      {offers.length === 0 ? <p className="state">No offers yet. Open an item and make one, or wait for buyers to make one on yours.</p> : (
        <ul className="list">
          {offers.map((o) => {
            const me = o.buyer._id === user.id ? 'buyer' : 'seller';
            const moves = MOVES[o.status]?.[me] || [];
            return (
              <li key={o._id} className="card stack">
                <div className="rowcard">
                  <div>
                    <Link to={`/items/${o.item._id}`}><strong>{o.item.title}</strong></Link>
                    <p className="meta">Listed at ₹{o.item.price} · {me === 'buyer' ? `seller ${o.seller.name}` : `buyer ${o.buyer.name}`}</p>
                  </div>
                  <div className="right"><span className="price">₹{o.amount}</span><p className="meta">{LABEL[o.status]}</p></div>
                </div>
                {moves.length > 0 && (
                  <div className="row">
                    {moves.includes('counter') && <input type="number" min="1" placeholder="Counter ₹" aria-label="Counter amount" value={amounts[o._id] || ''} onChange={(e) => setAmounts({ ...amounts, [o._id]: e.target.value })} />}
                    {moves.map((m) => <button key={m} className={m === 'accept' ? 'btn' : 'btn ghost'} disabled={m === 'counter' && !amounts[o._id]} onClick={() => act(o, m)}>{VERB[m]}</button>)}
                  </div>
                )}
                {o.status === 'accepted' && me === 'buyer' && o.item.status !== 'sold' && <Link className="btn" to={`/checkout/${o.item._id}`}>Reserve and pay ₹{o.amount}</Link>}
                {o.status === 'accepted' && me === 'seller' && <p className="meta">Waiting for the buyer to pay.</p>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
