import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { predictYieldGeo } from "@/lib/satellite-ai.functions";
import { ParcelPicker } from "@/components/parcel-picker";
import type { LatLng } from "@/components/map-picker";
import { Loader2, Sprout, TrendingUp, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { toast } from "sonner";

type Result = {
  yieldTonsPerHa: number;
  totalTons: number;
  confidence: number;
  harvestWindow: string;
  risks: string[];
  recommendations: string[];
  satelliteSignal: "weak" | "good" | "excellent";
  locationName?: string;
};

export function YieldPanel() {
  const predict = useServerFn(predictYieldGeo);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [point, setPoint] = useState<LatLng | null>(null);
  const [form, setForm] = useState({
    crop: "Soya",
    hectares: 250,
    ndvi: 0.71,
    rainfallMm: 82,
    soilMoisture: 38,
  });

  const handle = async () => {
    if (!point) {
      toast.error("Selecciona la ubicación de tu parcela en el mapa");
      return;
    }
    setLoading(true);
    try {
      const res = await predict({ data: { ...form, point } });
      setResult(res as Result);
    } catch (e: any) {
      toast.error(e?.message ?? "Error en la predicción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel rounded-2xl p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.25em] text-primary">Módulo 01</p>
          <h3 className="text-2xl font-semibold mt-1">Predicción de rendimiento</h3>
          <p className="text-sm text-muted-foreground mt-1">Ubica tu parcela en el mapa · datos satelitales NDVI/MODIS</p>
        </div>
        <Sprout className="h-6 w-6 text-primary" />
      </div>

      <div className="mb-5">
        <ParcelPicker point={point} onChange={setPoint} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <Field label="Cultivo" value={form.crop} onChange={(v) => setForm({ ...form, crop: v })} />
        <Field label="Hectáreas" type="number" value={form.hectares} onChange={(v) => setForm({ ...form, hectares: +v })} />
        <Field label="NDVI (0-1)" type="number" step="0.01" value={form.ndvi} onChange={(v) => setForm({ ...form, ndvi: +v })} />
        <Field label="Lluvia 30d (mm)" type="number" value={form.rainfallMm} onChange={(v) => setForm({ ...form, rainfallMm: +v })} />
        <Field label="Humedad suelo (%)" type="number" value={form.soilMoisture} onChange={(v) => setForm({ ...form, soilMoisture: +v })} />
      </div>


      <button
        onClick={handle}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analizando órbita...</> : <>Predecir cosecha <TrendingUp className="h-4 w-4" /></>}
      </button>

      {result && (
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Rendimiento" value={`${result.yieldTonsPerHa?.toFixed(2)} t/ha`} />
            <Stat label="Total" value={`${Math.round(result.totalTons ?? 0)} t`} accent />
            <Stat label="Confianza" value={`${Math.round((result.confidence ?? 0) * 100)}%`} />
          </div>
          <div className="panel rounded-lg p-4">
            <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground">Ventana de cosecha</p>
            <p className="text-foreground mt-1">{result.harvestWindow}</p>
          </div>
          <List title="Riesgos" icon={<AlertTriangle className="h-3.5 w-3.5 text-destructive" />} items={result.risks ?? []} />
          <List title="Recomendaciones" icon={<CheckCircle2 className="h-3.5 w-3.5 text-accent" />} items={result.recommendations ?? []} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", step }: { label: string; value: any; onChange: (v: string) => void; type?: string; step?: string }) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="panel rounded-lg p-3">
      <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? "text-gradient" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function List({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-1">{icon}</span>
            <span className="text-foreground/90">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
