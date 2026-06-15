import { useCallback, useEffect, useState } from "react";

interface LatLng {
  lat: number | null;
  lng: number | null;
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<LatLng>({ lat: null, lng: null });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Unable to get your location");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60_000 },
    );
  }, []);

  // Note: no `cancelled` guard — StrictMode double-invoke in dev would
  // otherwise drop the first geolocation result and leave loading stuck.
  useEffect(() => {
    request();
  }, [request]);

  return { location, error, loading, refresh: request };
}
