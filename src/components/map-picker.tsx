import { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair, RotateCcw } from "lucide-react";

export type LatLng = { lat: number; lng: number };

declare global {
  interface Window {
    google?: any;
    __pachaInitMap?: () => void;
  }
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

// Centro aproximado de Bolivia
export const BOLIVIA_CENTER = { lat: -16.6, lng: -64.9 };

let scriptPromise: Promise<void> | null = null;
export function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Falta la clave de Google Maps"));

  scriptPromise = new Promise<void>((resolve, reject) => {
    window.__pachaInitMap = () => resolve();
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__pachaInitMap",
      language: "es",
      region: "BO",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

type Props = {
  origin: LatLng | null;
  destination: LatLng | null;
  onChange: (next: { origin: LatLng | null; destination: LatLng | null }) => void;
};

export function MapPicker({ origin, destination, onChange }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const originMarker = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // refs vivos para el listener de click
  const stateRef = useRef({ origin, destination });
  stateRef.current = { origin, destination };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !divRef.current) return;
        const g = window.google;
        mapRef.current = new g.maps.Map(divRef.current, {
          center: BOLIVIA_CENTER,
          zoom: 5,
          disableDefaultUI: true,
          zoomControl: true,
          styles: DARK_STYLE,
        });
        mapRef.current.addListener("click", (e: any) => {
          const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          const cur = stateRef.current;
          if (!cur.origin || (cur.origin && cur.destination)) {
            onChangeRef.current({ origin: point, destination: null });
          } else {
            onChangeRef.current({ origin: cur.origin, destination: point });
          }
        });
        setReady(true);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Render de marcadores y línea
  useEffect(() => {
    const g = window.google;
    if (!ready || !g || !mapRef.current) return;

    const mk = (pos: LatLng | null, color: string, label: string) => {
      if (!pos) return null;
      return new g.maps.Marker({
        position: pos,
        map: mapRef.current,
        label: { text: label, color: "#06121f", fontWeight: "700", fontSize: "12px" },
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#06121f",
          strokeWeight: 2,
        },
      });
    };

    originMarker.current?.setMap(null);
    destMarker.current?.setMap(null);
    lineRef.current?.setMap(null);

    originMarker.current = mk(origin, "#7CFF9E", "A");
    destMarker.current = mk(destination, "#43e8d8", "B");

    if (origin && destination) {
      lineRef.current = new g.maps.Polyline({
        path: [origin, destination],
        map: mapRef.current,
        strokeColor: "#7CFF9E",
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
      const bounds = new g.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      mapRef.current.fitBounds(bounds, 80);
    }
  }, [origin, destination, ready]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo cargar el mapa: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Crosshair className="h-3 w-3" /> Toca el mapa: 1° origen · 2° destino
        </p>
        {(origin || destination) && (
          <button
            onClick={() => onChange({ origin: null, destination: null })}
            className="mono text-[10px] uppercase tracking-wider text-accent inline-flex items-center gap-1 hover:opacity-80"
          >
            <RotateCcw className="h-3 w-3" /> Reiniciar
          </button>
        )}
      </div>
      <div
        ref={divRef}
        className="h-64 w-full rounded-lg border border-border overflow-hidden bg-muted"
      />
      <div className="grid grid-cols-2 gap-2">
        <PointTag color="text-accent" label="Origen (A)" point={origin} />
        <PointTag color="text-primary" label="Destino (B)" point={destination} />
      </div>
    </div>
  );
}

function PointTag({ label, point, color }: { label: string; point: LatLng | null; color: string }) {
  return (
    <div className="panel rounded-md px-3 py-2">
      <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <MapPin className={`h-3 w-3 ${color}`} /> {label}
      </p>
      <p className="mono text-[11px] mt-0.5 text-foreground">
        {point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "—"}
      </p>
    </div>
  );
}

export const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b1622" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1622" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8aa0b3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e2436" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c3145" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9fb3c4" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a4258" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#10202e" }] },
];
