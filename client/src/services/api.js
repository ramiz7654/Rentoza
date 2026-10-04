const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = sessionStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// Customer location lives only in sessionStorage (never sent to DB)
export const getLoc = () => { try { return JSON.parse(sessionStorage.getItem('rentoza_loc')); } catch { return null; } };
export const setLoc = (l) => (l ? sessionStorage.setItem('rentoza_loc', JSON.stringify(l)) : sessionStorage.removeItem('rentoza_loc'));
export const askLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('Location is not supported in this browser'));
  navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => reject(new Error('Location permission denied')),
    { enableHighAccuracy: false, timeout: 10000 }
  );
});
