import { useEffect, useRef, useState } from 'react';

// Watches the device's position while `active` is true. Falls back gracefully
// (returns null coords, sets `error`) when geolocation is unavailable or denied —
// callers should keep working with the last known position instead of crashing.
export function useGeolocation(active) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported on this device.');
      return undefined;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading || 0,
        });
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [active]);

  return { position, error };
}

export default useGeolocation;
