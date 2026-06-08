import { useEffect, useState } from "react";

interface LatLng {
  lat: number | null;
  lng: number | null;
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<LatLng>({ lat: null, lng: null });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { location, error, loading };
}
