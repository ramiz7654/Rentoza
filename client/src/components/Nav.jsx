import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LINKS = {
  customer: [['/home', 'Home'], ['/bookings', 'My Bookings'], ['/profile', 'Profile'], ['/support', 'Help & Support']],
  owner: [['/owner', 'Dashboard'], ['/owner/rental', 'Rental Profile'], ['/owner/vehicles/add', 'Add Vehicle'], ['/owner/vehicles', 'Manage Vehicles'], ['/owner/bookings', 'Bookings']],
  admin: [['/admin', 'Dashboard'], ['/admin/rentals', 'Rentals'], ['/admin/vehicles', 'Vehicles'], ['/admin/users', 'Users'],
    ['/admin/bookings', 'Bookings'], ['/admin/reviews', 'Reviews'], ['/admin/support', 'Support'], ['/admin/account', 'Account']],
};

export default function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => { if (e.key === 'Escape') (confirm ? setConfirm(false) : setOpen(false)); };
    const onResize = () => window.innerWidth > 860 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); document.body.style.overflow = ''; };
  }, [open, confirm]);

  if (!user) return null;
  const doLogout = () => { setConfirm(false); setOpen(false); logout(); nav('/login'); };

  return (
    <>
      <header className="nav">
        <div className="nav-in">
          <span className="brand">Rentoza</span>
          <button className="burger" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <nav className={`nav-links ${open ? 'open' : ''}`} onClick={(e) => e.target.closest('a') && setOpen(false)}>
            <div className="drawer-head">
              <button type="button" className="drawer-close" onClick={() => setOpen(false)} aria-label="Close menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
              <span className="brand">Rentoza</span>
            </div>
            {LINKS[user.role].map(([to, label]) => (
              <NavLink key={to} to={to} end={['/owner', '/admin', '/owner/vehicles'].includes(to)}>{label}</NavLink>
            ))}
            <button className="btn ghost sm" onClick={() => setConfirm(true)}>Logout</button>
          </nav>
          <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
        </div>
      </header>
      {confirm && (
        <div className="modal-scrim" onClick={() => setConfirm(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lo-t" onClick={(e) => e.stopPropagation()}>
            <h3 id="lo-t">Logout from Rentoza?</h3>
            <p>You will need to login again to continue.</p>
            <div className="row">
              <button className="btn ghost" onClick={() => setConfirm(false)} autoFocus>Cancel</button>
              <button className="btn primary" onClick={doLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
