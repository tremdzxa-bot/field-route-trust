import { Satellite } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-md bg-background/60">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 grid place-items-center rounded-md bg-secondary border border-border">
            <Satellite className="h-4 w-4 text-primary" />
            <span className="absolute inset-0 rounded-md ring-1 ring-primary/40 animate-pulse-soft" />
          </div>
          <div className="leading-tight">
            <p className="mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Mission Control</p>
            <p className="text-sm font-semibold tracking-tight">PACHA<span className="text-primary">.orbit</span></p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#mission" className="hover:text-foreground transition">Misión</a>
          <a href="#dashboard" className="hover:text-foreground transition">Dashboard</a>
          <a href="#contracts" className="hover:text-foreground transition">Contratos</a>
        </nav>
        <a
          href="#dashboard"
          className="mono text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition glow"
        >
          INICIAR ANÁLISIS
        </a>
      </div>
    </header>
  );
}
