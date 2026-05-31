import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { optimizeRouteGeo } from "@/lib/satellite-ai.functions";
import { MapPicker, type LatLng } from "@/components/map-picker";
import { Loader2, Truck, Fuel, Leaf } from "lucide-react";
import { toast } from "sonner";

type Result = {
  originName: string;
  destName: string;
  distanceKm: number;
  etaHours: number;
  fuelCostBs: number;
  co2Kg: number;
  waypoints: { name: string; km: number; note: string }[];
  alerts: string[];
  savingsVsBaselinePct: number;
};

export function RoutePanel() {
  const optimize = useServerFn(optimizeRouteGeo);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [form, setForm] = useState({
    fuelType: "Diésel",
    volumeLiters: 32000,
    trucks: 2,
  });

  const formRef = useRef(form);
  formRef.current = form;
  const runId = useRef(0);

  const run = async (o: LatLng, d: LatLng) => {
    const id = ++runId.current;
    setLoading(true);
    try {
      const res = await optimize({ data: { origin: o, destination: d, ...formRef.current } });
      if (id === runId.current) setResult(res as Result);
    } catch (e: any) {
      if (id === runId.current) toast.error(e?.message ?? "Error optimizando ruta");
    } finally {
      if (id === runId.current) setLoading(false);
    }
  };

  // Calcula automáticamente al seleccionar ambos puntos
  useEffect(() => {
    if (origin && destination) {
      run(origin, destination);
    } else {
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination]);

  const handleSelect = (next: { origin: LatLng | null; destination: LatLng | null }) => {
    setOrigin(next.origin);
    setDestination(next.destination);
  };

  return (
    <div className="panel rounded-2xl p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.25em] text-accent">Módulo 02</p>
          <h3 className="text-2xl font-semibold mt-1">Optimización de rutas</h3>
          <p className="text-sm text-muted-foreground mt-1">Selecciona en el mapa · YPFB</p>
        </div>
        <Truck className="h-6 w-6 text-accent" />
      </div>

      <MapPicker origin={origin} destination={destination} onChange={handleSelect} />

      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        <Field label="Combustible" value={form.fuelType} onChange={(v) => setForm({ ...form, fuelType: v })} />
        <Field label="Volumen (L)" type="number" value={form.volumeLiters} onChange={(v) => setForm({ ...form, volumeLiters: +v })} />
        <Field label="Cisternas" type="number" value={form.trucks} onChange={(v) => setForm({ ...form, trucks: +v })} />
      </div>

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-accent" /> Calculando ruta real con datos satelitales...
        </div>
      )}

      {!loading && !result && (
        <p className="mt-5 text-xs text-muted-foreground mono">
          Toca dos ubicaciones en el mapa para generar el cálculo automáticamente.
        </p>
      )}

      {result && !loading && (
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          <div className="text-xs mono text-muted-foreground">
            <span className="text-accent">A</span> {result.originName} <span className="text-primary">→ B</span> {result.destName}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Distancia" value={`${Math.round(result.distanceKm)} km`} />
            <Stat label="ETA" value={`${result.etaHours?.toFixed(1)} h`} />
            <Stat label="Costo" value={`Bs ${Math.round(result.fuelCostBs).toLocaleString()}`} icon={<Fuel className="h-3 w-3" />} />
            <Stat label="CO₂" value={`${Math.round(result.co2Kg)} kg`} icon={<Leaf className="h-3 w-3" />} />
          </div>

          <div className="panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground">Trayectoria</p>
              <span className="mono text-[11px] text-accent">−{result.savingsVsBaselinePct?.toFixed(1)}% vs baseline</span>
            </div>
            <div className="relative pl-4 space-y-3">
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
              {(result.waypoints ?? []).map((w, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-3 top-1.5 h-2 w-2 rounded-full bg-primary glow" />
                  <p className="text-sm font-medium">{w.name} <span className="mono text-xs text-muted-foreground">· km {w.km}</span></p>
                  <p className="text-xs text-muted-foreground">{w.note}</p>
                </div>
              ))}
            </div>
          </div>

          {result.alerts?.length > 0 && (
            <div className="space-y-1.5">
              {result.alerts.map((a, i) => (
                <div key={i} className="text-xs mono px-3 py-2 rounded border border-destructive/30 bg-destructive/10 text-destructive">⚠ {a}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="panel rounded-lg p-3">
      <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
