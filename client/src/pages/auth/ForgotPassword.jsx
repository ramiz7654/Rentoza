import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Msg, PasswordInput } from '../../components/ui';

export default function ForgotPassword() {
  const [sp] = useSearchParams();
  const token = sp.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      const d = token ? await api('/auth/reset-password', { method: 'POST', body: { token, password } })
                      : await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setMsg(d.message);
    } catch (x) { setErr(x.message); }
  };

  return (
    <div className="auth-wrap">
      <form className="simple-card" onSubmit={submit}>
        <span className="brand dark">Rentoza</span>
        <h2>{token ? 'Set a new password' : 'Reset your password'}</h2>
        {token
          ? <label className="fld"><span>New password</span><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
          : <label className="fld"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
        <Msg>{err}</Msg><Msg type="ok">{msg}</Msg>
        <button className="btn primary full">{token ? 'Update password' : 'Send reset link'}</button>
        <Link className="link-s" to="/login">Back to login</Link>
      </form>
    </div>
  );
}
