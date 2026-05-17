import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiErrorMessage } from "@/lib/api";
import {
  CheckCircle2,
  Crosshair,
  Loader2,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Search,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export type PickedLocation = {
  lat: number;
  lng: number;
};

const MAP_WIDTH = 900;
const MAP_HEIGHT = 520;
const TILE_SIZE = 512;
const DEFAULT_CENTER: PickedLocation = { lat: 9.082, lng: 8.6753 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lngLatToWorld = (point: PickedLocation, zoom: number) => {
  const sin = Math.sin((point.lat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
};

const worldToLngLat = (x: number, y: number, zoom: number): PickedLocation => {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return {
    lat: Number(clamp(lat, -85, 85).toFixed(6)),
    lng: Number(clamp(lng, -180, 180).toFixed(6)),
  };
};

const mapboxImageUrl = ({
  center,
  value,
  zoom,
}: {
  center: PickedLocation;
  value?: PickedLocation;
  zoom: number;
}) => {
  const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN as string | undefined;
  if (!token) return "";
  const overlay = value
    ? `pin-s-marker+16a34a(${value.lng},${value.lat})/`
    : "";
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlay}${center.lng},${center.lat},${zoom},0/${MAP_WIDTH}x${MAP_HEIGHT}@2x?access_token=${token}`;
};

export const LocationPicker = ({
  value,
  onChange,
  label = "Map point",
  addressQuery,
}: {
  value?: PickedLocation;
  onChange: (value: PickedLocation) => void;
  label?: string;
  addressQuery?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PickedLocation | undefined>(value);
  const [center, setCenter] = useState<PickedLocation>(value || DEFAULT_CENTER);
  const [zoom, setZoom] = useState(12);
  const [finding, setFinding] = useState(false);

  const mapUrl = useMemo(
    () => mapboxImageUrl({ center, value: draft, zoom }),
    [center, draft, zoom],
  );

  const openPicker = () => {
    setDraft(value);
    setCenter(value || DEFAULT_CENTER);
    setOpen(true);
    if (!value && addressQuery?.trim()) {
      void findFromAddress();
    }
  };

  const setPoint = (point: PickedLocation) => {
    setDraft(point);
    setCenter(point);
  };

  const pickFromMap = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const centerWorld = lngLatToWorld(center, zoom);
    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;
    const worldX = centerWorld.x + (clickX * scaleX - MAP_WIDTH / 2);
    const worldY = centerWorld.y + (clickY * scaleY - MAP_HEIGHT / 2);
    setPoint(worldToLngLat(worldX, worldY, zoom));
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setPoint({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
    );
  };

  const updateManual = (patch: Partial<PickedLocation>) => {
    const next = {
      lat: patch.lat ?? draft?.lat ?? center.lat,
      lng: patch.lng ?? draft?.lng ?? center.lng,
    };
    if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return;
    setPoint(next);
  };

  const findFromAddress = async () => {
    const query = addressQuery?.trim();
    if (!query) {
      toast.error("Enter the address details first");
      return;
    }
    console.log(query);
    setFinding(true);
    try {
      const { data } = await api.get<{
        items?: Array<{ lat?: number; lng?: number; fullAddress?: string }>;
      }>("/location/search", {
        params: { q: query, limit: 1 },
      });
      console.log(data);
      const match = data.items?.find(
        (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng),
      );
      if (!match) {
        toast.error(
          "No map point found. Add a landmark or choose the point manually.",
        );
        setOpen(true);
        return;
      }

      const next = {
        lat: Number(match.lat),
        lng: Number(match.lng),
      };
      setPoint(next);
      setOpen(true);
      toast.success("Map point found. Confirm or adjust the pin.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setFinding(false);
    }
  };

  const confirm = () => {
    if (!draft) return;
    onChange(draft);
    setOpen(false);
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Label className="text-xs">{label}</Label>
          {value ? (
            <p className="mt-1 flex items-center gap-1 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              No exact point selected
            </p>
          )}
        </div>
        <Button type="button" variant="outline" onClick={openPicker}>
          <MapPin className="mr-2 h-4 w-4" />
          {value ? "Change point" : "Choose on map"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={findFromAddress}
          disabled={finding}
        >
          {finding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Find from address
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[94vh] overflow-x-auto sm:max-w-3xl rounded-xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  Place the pin on the address
                </p>
                <p className="text-xs text-muted-foreground">
                  Start from the typed address, then adjust only if the pin is
                  not on the exact gate, shop, house, or farm pickup spot.
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={findFromAddress}
                  disabled={finding}
                >
                  {finding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Find address
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9"
                  onClick={() => setZoom((z) => clamp(z + 1, 4, 18))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9"
                  onClick={() => setZoom((z) => clamp(z - 1, 4, 18))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={useCurrentLocation}
                >
                  <LocateFixed className="h-4 w-4" /> Use my location
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={pickFromMap}
              className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted sm:aspect-[16/9] space-y-4"
            >
              {mapUrl ? (
                <img
                  src={mapUrl}
                  alt=""
                  className="h-full w-full object-cover "
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Add VITE_MAPBOX_PUBLIC_TOKEN to show the visual map. You can
                  still enter coordinates below.
                </div>
              )}
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/95 p-2 text-primary shadow-card">
                {draft ? (
                  <MapPin className="h-6 w-6" />
                ) : (
                  <Crosshair className="h-6 w-6" />
                )}
              </span>
            </button>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={draft?.lat ?? ""}
                  onChange={(event) =>
                    updateManual({ lat: Number(event.target.value) })
                  }
                  placeholder="6.524379"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={draft?.lng ?? ""}
                  onChange={(event) =>
                    updateManual({ lng: Number(event.target.value) })
                  }
                  placeholder="3.379206"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={!draft}>
              Use this point
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
