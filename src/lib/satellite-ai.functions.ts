import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PredictInput = z.object({
  region: z.string().min(1),
  crop: z.string().min(1),
  hectares: z.number().positive(),
  ndvi: z.number().min(0).max(1),
  rainfallMm: z.number().min(0),
  soilMoisture: z.number().min(0).max(100),
});

const RouteInput = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  fuelType: z.string().min(1),
  volumeLiters: z.number().positive(),
  trucks: z.number().int().positive(),
});

const SYSTEM_PREDICT = `Eres un agrónomo experto en datos satelitales para Bolivia (Santa Cruz, Beni, Cochabamba, La Paz, Tarija). Analiza NDVI, lluvia y humedad del suelo. Responde SIEMPRE con JSON válido sin markdown, sin explicaciones fuera del JSON.`;

const SYSTEM_ROUTE = `Eres un planificador logístico boliviano experto en transporte de combustible (YPFB) por carretera. Conoces rutas Santa Cruz–La Paz, Cochabamba–Sucre, Tarija–Potosí, etc. Todos los costos se expresan en Bolivianos (Bs). Devuelve SIEMPRE JSON válido sin markdown.`;

async function callLovableAI(system: string, user: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY no configurado");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Límite de IA alcanzado, intenta de nuevo en unos segundos.");
    if (res.status === 402) throw new Error("Créditos de IA agotados. Recarga en Settings → Workspace → Usage.");
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

export const predictYield = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PredictInput.parse(d))
  .handler(async ({ data }) => {
    const prompt = `Predice rendimiento agrícola con estos datos satelitales:
- Región: ${data.region}, Bolivia
- Cultivo: ${data.crop}
- Superficie: ${data.hectares} ha
- NDVI promedio (0-1): ${data.ndvi}
- Lluvia acumulada 30 días: ${data.rainfallMm} mm
- Humedad del suelo: ${data.soilMoisture}%

Devuelve JSON con esta forma exacta:
{
  "yieldTonsPerHa": number,
  "totalTons": number,
  "confidence": number entre 0 y 1,
  "harvestWindow": "string fecha estimada",
  "risks": [string, string, string],
  "recommendations": [string, string, string],
  "satelliteSignal": "weak"|"good"|"excellent"
}`;
    return await callLovableAI(SYSTEM_PREDICT, prompt);
  });

export const optimizeRoute = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RouteInput.parse(d))
  .handler(async ({ data }) => {
    const prompt = `Optimiza ruta de transporte de combustible en Bolivia:
- Origen: ${data.origin}
- Destino: ${data.destination}
- Combustible: ${data.fuelType}
- Volumen: ${data.volumeLiters} litros
- Cantidad de cisternas: ${data.trucks}

Devuelve JSON con esta forma exacta:
{
  "distanceKm": number,
  "etaHours": number,
  "fuelCostBs": number,
  "co2Kg": number,
  "waypoints": [{"name": string, "km": number, "note": string}],
  "alerts": [string, string],
  "savingsVsBaselinePct": number
}`;
    return await callLovableAI(SYSTEM_ROUTE, prompt);
  });
