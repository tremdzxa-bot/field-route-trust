import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { YieldPanel } from "@/components/yield-panel";
import { RoutePanel } from "@/components/route-panel";
import { Satellite, Cpu, Network } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PACHA.orbit · IA satelital y Web3 para Bolivia" },
      {
        name: "description",
        content:
          "Predicción de rendimientos agrícolas y optimización de rutas de combustible con datos satelitales e IA. Pagos transparentes vía contratos inteligentes en Bolivia.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen text-foreground">
      <SiteHeader />
      <main>
        <Hero />

        <section id="mission" className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <Satellite className="h-5 w-5" />, t: "Datos abiertos", d: "Sentinel-2, MODIS y Planet ahora más accesibles en Bolivia. Nosotros los traducimos a decisiones." },
              { icon: <Cpu className="h-5 w-5" />, t: "IA aplicada", d: "Modelos de predicción entrenados con datos del Altiplano, los Llanos y los valles." },
              { icon: <Network className="h-5 w-5" />, t: "Pagos Web3", d: "Escrow on-chain entre productor y transportista. Liberación automática verificada por satélite." },
            ].map((f) => (
              <div key={f.t} className="panel rounded-xl p-6">
                <div className="text-primary">{f.icon}</div>
                <h3 className="mt-4 text-lg font-semibold">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="dashboard" className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8">
            <p className="mono text-[11px] uppercase tracking-[0.25em] text-primary">Mission Console</p>
            <h2 className="text-4xl md:text-5xl font-semibold mt-2 tracking-tight">Dashboard operativo</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Dos módulos de IA en vivo, conectados al gateway satelital. Edita los parámetros y obtén
              análisis en segundos.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <YieldPanel />
            <RoutePanel />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <ContractsPanel />
        </section>

        <footer className="border-t border-border mt-20">
          <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4">
            <p className="mono text-xs text-muted-foreground">© 2026 PACHA.orbit · Hecho desde Bolivia 🇧🇴</p>
            <p className="mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Constellation v0.1 · Test net</p>
          </div>
        </footer>
      </main>
      <Toaster />
    </div>
  );
}
