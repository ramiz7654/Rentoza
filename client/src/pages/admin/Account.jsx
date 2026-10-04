import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Msg, Page, PasswordInput } from '../../components/ui';

export default function AdminAccount() {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState(''); const [ok, setOk] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    if (newPassword && newPassword !== confirm) return setErr('New passwords do not match');
    try {
      const d = await api('/auth/credentials', { method: 'PATCH', body: { currentPassword, email, newPassword: newPassword || undefined } });
      setUser(d.user); setOk(d.message); setCurrent(''); setNew(''); setConfirm('');
    } catch (x) { setErr(x.message); }
  };

  return (
    <Page title="Admin account" sub="Change your admin login email or password">
      <form className="card" style={{ maxWidth: 480 }} onSubmit={submit}>
        <label className="fld"><span>Admin email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="fld"><span>New password (leave empty to keep current)</span><PasswordInput value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" /></label>
        <label className="fld"><span>Confirm new password</span><PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></label>
        <label className="fld"><span>Current password (required to save)</span><PasswordInput value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></label>
        <Msg>{err}</Msg><Msg type="ok">{ok}</Msg>
        <button className="btn primary">Save changes</button>
      </form>
    </Page>
  );
}
