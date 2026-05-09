import { useState } from "react";
import { Wallet, ShieldCheck, Coins, ArrowRight, CircleDot } from "lucide-react";

type Contract = {
  id: string;
  producer: string;
  carrier: string;
  asset: string;
  amount: number;
  status: "Pendiente" | "En tránsito" | "Liberado";
  txHash: string;
};

const SEED: Contract[] = [
  { id: "0xA4F1", producer: "Coop. Yapacaní", carrier: "TransAndina SRL", asset: "Soya · 120 t", amount: 18400, status: "Liberado", txHash: "0x7a…f3b1" },
  { id: "0xB29C", producer: "Hda. San Julián", carrier: "LogiBol", asset: "Diésel · 32k L", amount: 9800, status: "En tránsito", txHash: "0x12…ae04" },
  { id: "0xC5D7", producer: "Asoc. Beni Norte", carrier: "RutaSur", asset: "Maíz · 80 t", amount: 11200, status: "Pendiente", txHash: "0x9b…2c10" },
];

export function ContractsPanel() {
  const [items, setItems] = useState(SEED);
  const [connected, setConnected] = useState(false);

  return (
    <div id="contracts" className="panel rounded-2xl p-6 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.25em] text-primary">Capa Web3</p>
          <h3 className="text-3xl font-semibold mt-2">Contratos inteligentes</h3>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Pagos directos productor ↔ transportista liberados automáticamente cuando el oráculo
            satelital confirma entrega. Sin intermediarios, auditable on-chain.
          </p>
        </div>
        <button
          onClick={() => setConnected((c) => !c)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md mono text-xs uppercase tracking-wider transition ${
            connected ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground border border-border hover:border-primary"
          }`}
        >
          <Wallet className="h-4 w-4" />
          {connected ? "0x4f…a91 conectado" : "Conectar wallet"}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card icon={<ShieldCheck className="h-4 w-4" />} k="100%" l="Pagos auditables" />
        <Card icon={<Coins className="h-4 w-4" />} k="0.4%" l="Comisión protocolo" />
        <Card icon={<CircleDot className="h-4 w-4" />} k="42 s" l="Tiempo de liberación" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Contrato</th>
              <th className="text-left px-4 py-3">Productor</th>
              <th className="text-left px-4 py-3">Transportista</th>
              <th className="text-left px-4 py-3">Activo</th>
              <th className="text-right px-4 py-3">Monto USDC</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Tx</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/30 transition">
                <td className="px-4 py-3 mono text-primary">{c.id}</td>
                <td className="px-4 py-3">{c.producer}</td>
                <td className="px-4 py-3">{c.carrier}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.asset}</td>
                <td className="px-4 py-3 text-right mono">${c.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Badge status={c.status} />
                </td>
                <td className="px-4 py-3 mono text-xs text-muted-foreground">{c.txHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() =>
          setItems((prev) => [
            {
              id: "0x" + Math.random().toString(16).slice(2, 6).toUpperCase(),
              producer: "Nuevo productor",
              carrier: "Sin asignar",
              asset: "Cosecha pendiente",
              amount: Math.round(5000 + Math.random() * 15000),
              status: "Pendiente",
              txHash: "0x" + Math.random().toString(16).slice(2, 4) + "…" + Math.random().toString(16).slice(2, 6),
            },
            ...prev,
          ])
        }
        className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:gap-3 transition-all"
      >
        Crear escrow on-chain <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Card({ icon, k, l }: { icon: React.ReactNode; k: string; l: string }) {
  return (
    <div className="panel rounded-xl p-5">
      <div className="text-primary">{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-gradient">{k}</p>
      <p className="text-xs text-muted-foreground mt-1">{l}</p>
    </div>
  );
}

function Badge({ status }: { status: Contract["status"] }) {
  const map: Record<Contract["status"], string> = {
    Liberado: "bg-accent/15 text-accent border-accent/30",
    "En tránsito": "bg-primary/15 text-primary border-primary/30",
    Pendiente: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`mono text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${map[status]}`}>
      {status}
    </span>
  );
}
