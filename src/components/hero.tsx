import { ArrowRight, Activity, Radio } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-28 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-7">
          <div className="inline-flex items-center gap-2 panel rounded-full px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Señal satelital activa · Bolivia
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight">
            Inteligencia <span className="text-gradient">orbital</span> para el agro y la logística boliviana.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Analizamos datos satelitales abiertos para predecir rendimientos de cultivos y
            optimizar rutas de transporte de combustible. Pagos transparentes vía contratos
            inteligentes Web3 entre productores y transportistas.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="#dashboard" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition glow">
              Abrir dashboard <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#contracts" className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-border text-foreground hover:bg-secondary transition">
              Ver contratos Web3
            </a>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-8 max-w-lg">
            {[
              { k: "12", l: "Departamentos cubiertos" },
              { k: "0.3 ha", l: "Resolución mínima" },
              { k: "98.4%", l: "Uptime constelación" },
            ].map((s) => (
              <div key={s.l} className="panel rounded-lg p-4">
                <p className="mono text-2xl font-semibold text-primary">{s.k}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <OrbitVisual />
        </div>
      </div>
    </section>
  );
}

function OrbitVisual() {
  return (
    <div className="relative aspect-square max-w-md mx-auto">
      <div className="absolute inset-0 rounded-full border border-border" />
      <div className="absolute inset-6 rounded-full border border-border/70" />
      <div className="absolute inset-14 rounded-full border border-border/50" />
      <div className="absolute inset-0 animate-orbit">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 h-3 w-3 rounded-full bg-primary glow" />
      </div>
      <div className="absolute inset-6 animate-orbit" style={{ animationDuration: "18s", animationDirection: "reverse" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 h-2 w-2 rounded-full bg-accent" />
      </div>

      <div className="absolute inset-0 grid place-items-center">
        <div className="panel rounded-2xl p-6 text-center w-56 relative overflow-hidden">
          <div className="absolute inset-x-0 h-px scanline animate-scan" />
          <Radio className="h-5 w-5 mx-auto text-primary" />
          <p className="mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-3">Telemetría</p>
          <p className="text-3xl font-semibold mt-1 text-gradient">PACHA-1</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-left mono text-[10px]">
            <div className="bg-secondary rounded p-2">
              <span className="text-muted-foreground">NDVI</span>
              <p className="text-foreground">0.71</p>
            </div>
            <div className="bg-secondary rounded p-2">
              <span className="text-muted-foreground">PRECIP</span>
              <p className="text-foreground">82mm</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] mono text-accent">
            <Activity className="h-3 w-3" /> LINK STABLE
          </div>
        </div>
      </div>
    </div>
  );
}
