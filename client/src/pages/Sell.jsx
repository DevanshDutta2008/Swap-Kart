import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const CATS = ['books', 'electronics', 'furniture', 'clothing', 'cycles', 'other'];
const CONDS = ['new', 'like-new', 'good', 'fair'];

export default function Sell() {
  const nav = useNavigate();
  const [f, setF] = useState({ title: '', description: '', category: 'books', condition: 'good', price: '', image: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const msg = (k) => error?.fields?.find((x) => x.field === k || (k === 'image' && x.field.startsWith('images')))?.message;

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(null);
    const { image, ...rest } = f;
    try {
      const { item } = await api('/items', { method: 'POST', body: { ...rest, price: Number(f.price), ...(image && { images: [image] }) } });
      nav(`/items/${item._id}`);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <form className="card narrow wide" onSubmit={submit}>
      <h1>Sell something</h1>
      <label>Title<input value={f.title} onChange={set('title')} required />{msg('title') && <small className="err">{msg('title')}</small>}</label>
      <label>Description (optional)<textarea rows="4" value={f.description} onChange={set('description')} /></label>
      <div className="two">
        <label>Category<select value={f.category} onChange={set('category')}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Condition<select value={f.condition} onChange={set('condition')}>{CONDS.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <label>Price in ₹<input type="number" min="1" value={f.price} onChange={set('price')} required />{msg('price') && <small className="err">{msg('price')}</small>}</label>
      <label>Photo link (optional)<input type="url" placeholder="https://…" value={f.image} onChange={set('image')} />{msg('image') && <small className="err">Enter a full web link starting with https://</small>}</label>
      {error && !error.fields && <p className="err" role="alert">{error.message}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Listing…' : 'List item'}</button>
    </form>
  );
}
