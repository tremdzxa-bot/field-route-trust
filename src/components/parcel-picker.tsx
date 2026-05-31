import { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair, RotateCcw } from "lucide-react";
import { loadMaps, BOLIVIA_CENTER, DARK_STYLE, type LatLng } from "./map-picker";

type Props = {
  point: LatLng | null;
  onChange: (point: LatLng | null) => void;
};

export function ParcelPicker({ point, onChange }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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
          onChangeRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
        setReady(true);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const g = window.google;
    if (!ready || !g || !mapRef.current) return;

    markerRef.current?.setMap(null);
    if (point) {
      markerRef.current = new g.maps.Marker({
        position: point,
        map: mapRef.current,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: "#7CFF9E",
          fillOpacity: 1,
          strokeColor: "#06121f",
          strokeWeight: 2,
        },
      });
      mapRef.current.panTo(point);
      if (mapRef.current.getZoom() < 11) mapRef.current.setZoom(11);
    }
  }, [point, ready]);

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
          <Crosshair className="h-3 w-3" /> Toca el mapa para ubicar tu parcela
        </p>
        {point && (
          <button
            onClick={() => onChange(null)}
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
      <div className="panel rounded-md px-3 py-2">
        <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 text-primary" /> Coordenadas de la parcela
        </p>
        <p className="mono text-[11px] mt-0.5 text-foreground">
          {point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : "—"}
        </p>
      </div>
    </div>
  );
}
