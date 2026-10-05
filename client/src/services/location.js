// Location helpers with clear, human error messages (works the same in Chrome, Edge, Brave, Safari).
export const locationPermission = async () => {
  try { return (await navigator.permissions.query({ name: 'geolocation' })).state; } // 'granted' | 'prompt' | 'denied'
  catch { return 'prompt'; }
};

export const askLocationDetailed = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(Object.assign(new Error('This browser does not support location.'), { kind: 'unsupported' }));
  navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
    (e) => {
      if (e.code === 1) return reject(Object.assign(new Error('Location is blocked for this site. Click the lock icon next to the web address, set Location to Allow, then press Try again.'), { kind: 'denied' }));
      if (e.code === 3) return reject(Object.assign(new Error('Finding your location took too long. Please try again.'), { kind: 'timeout' }));
      return reject(Object.assign(new Error('Your device could not find its location. Turn on location or GPS on your device (in Brave: Settings > Privacy and security > Use Google services for location), then try again.'), { kind: 'unavailable' }));
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
  );
});
