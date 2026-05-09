import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { optimizeRoute } from "@/lib/satellite-ai.functions";
import { Loader2, Truck, MapPin, Fuel, Leaf } from "lucide-react";
import { toast } from "sonner";

type Result = {
  distanceKm: number;
  etaHours: number;
  fuelCostUsd: number;
  co2Kg: number;
  waypoints: { name: string; km: number; note: string }[];
  alerts: string[];
  savingsVsBaselinePct: number;
};

export function RoutePanel() {
  const optimize = useServerFn(optimizeRoute);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [form, setForm] = useState({
    origin: "Refinería Palmasola, Santa Cruz",
    destination: "El Alto, La Paz",
    fuelType: "Diésel",
    volumeLiters: 32000,
    trucks: 2,
  });

  const handle = async () => {
    setLoading(true);
    try {
      const res = await optimize({ data: form });
      setResult(res as Result);
    } catch (e: any) {
      toast.error(e?.message ?? "Error optimizando ruta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel rounded-2xl p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.25em] text-accent">Módulo 02</p>
          <h3 className="text-2xl font-semibold mt-1">Optimización de rutas</h3>
          <p className="text-sm text-muted-foreground mt-1">Transporte de combustible · YPFB</p>
        </div>
        <Truck className="h-6 w-6 text-accent" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <Field label="Origen" value={form.origin} onChange={(v) => setForm({ ...form, origin: v })} />
        <Field label="Destino" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} />
        <Field label="Combustible" value={form.fuelType} onChange={(v) => setForm({ ...form, fuelType: v })} />
        <Field label="Volumen (L)" type="number" value={form.volumeLiters} onChange={(v) => setForm({ ...form, volumeLiters: +v })} />
        <Field label="Cisternas" type="number" value={form.trucks} onChange={(v) => setForm({ ...form, trucks: +v })} />
      </div>

      <button
        onClick={handle}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-accent text-accent-foreground font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Calculando ruta...</> : <>Optimizar ruta <MapPin className="h-4 w-4" /></>}
      </button>

      {result && (
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Distancia" value={`${Math.round(result.distanceKm)} km`} />
            <Stat label="ETA" value={`${result.etaHours?.toFixed(1)} h`} />
            <Stat label="Costo" value={`$${Math.round(result.fuelCostUsd)}`} icon={<Fuel className="h-3 w-3" />} />
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
