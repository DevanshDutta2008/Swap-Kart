import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/';
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', hostel: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const fieldMsg = (f) => error?.fields?.find((x) => x.field === f)?.message;

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      await (mode === 'login' ? login({ email: form.email, password: form.password }) : register(form));
      nav(from, { replace: true });
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>{mode === 'login' ? 'Log in' : 'Create your account'}</h1>
      {mode === 'register' && (
        <>
          <label>Name<input value={form.name} onChange={set('name')} required />{fieldMsg('name') && <small className="err">{fieldMsg('name')}</small>}</label>
          <label>Hostel or block (optional)<input value={form.hostel} onChange={set('hostel')} /></label>
        </>
      )}
      <label>Email<input type="email" value={form.email} onChange={set('email')} required />{fieldMsg('email') && <small className="err">{fieldMsg('email')}</small>}</label>
      <label>Password<input type="password" value={form.password} onChange={set('password')} required />{fieldMsg('password') && <small className="err">{fieldMsg('password')}</small>}</label>
      {error && !error.fields && <p className="err" role="alert">{error.message}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
      </button>
    </form>
  );
}
