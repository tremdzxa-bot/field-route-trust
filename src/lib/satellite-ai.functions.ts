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

// ---------- Optimización por coordenadas (Google Maps) ----------

const GeoPoint = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const GeoRouteInput = z.object({
  origin: GeoPoint,
  destination: GeoPoint,
  fuelType: z.string().min(1).max(40),
  volumeLiters: z.number().positive().max(1_000_000),
  trucks: z.number().int().positive().max(50),
});

const GW = "https://connector-gateway.lovable.dev/google_maps";

function mapsHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY no configurado");
  if (!mapsKey) throw new Error("Conexión de Google Maps no disponible");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
  };
}

async function reverseGeocode(p: { lat: number; lng: number }): Promise<string> {
  try {
    const res = await fetch(
      `${GW}/maps/api/geocode/json?latlng=${p.lat},${p.lng}&language=es`,
      { headers: mapsHeaders() },
    );
    if (!res.ok) return `${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}`;
    const data = await res.json();
    return data?.results?.[0]?.formatted_address ?? `${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}`;
  } catch {
    return `${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}`;
  }
}

async function computeDrive(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ distanceKm: number; etaHours: number }> {
  const res = await fetch(`${GW}/routes/directions/v2:computeRoutes`, {
    method: "POST",
    headers: {
      ...mapsHeaders(),
      "Content-Type": "application/json",
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Routes API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) throw new Error("No se encontró una ruta por carretera entre los puntos seleccionados.");
  const distanceKm = (route.distanceMeters ?? 0) / 1000;
  const durSec = parseInt(String(route.duration ?? "0").replace("s", ""), 10) || 0;
  return { distanceKm, etaHours: durSec / 3600 };
}

export const optimizeRouteGeo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => GeoRouteInput.parse(d))
  .handler(async ({ data }) => {
    const [originName, destName, drive] = await Promise.all([
      reverseGeocode(data.origin),
      reverseGeocode(data.destination),
      computeDrive(data.origin, data.destination),
    ]);

    const distanceKm = Math.max(drive.distanceKm, 0.1);
    const etaHours = drive.etaHours || distanceKm / 65;

    // Consumo y costos (Bolivia): diésel ~3.72 Bs/L, gasolina ~3.74 Bs/L
    const isDiesel = /dies/i.test(data.fuelType);
    const consumptionPer100 = isDiesel ? 35 : 30; // L/100km por cisterna
    const pricePerLiterBs = isDiesel ? 3.72 : 3.74;
    const co2PerLiter = isDiesel ? 2.68 : 2.31;

    const consumedLiters = data.trucks * distanceKm * (consumptionPer100 / 100);
    const fuelCostBs = consumedLiters * pricePerLiterBs;
    const co2Kg = consumedLiters * co2PerLiter;

    // IA: narrativa de waypoints, alertas y ahorro
    const prompt = `Genera el detalle de una ruta real de transporte de combustible en Bolivia.
- Origen: ${originName}
- Destino: ${destName}
- Distancia real (carretera): ${distanceKm.toFixed(1)} km
- Tiempo estimado: ${etaHours.toFixed(1)} h
- Combustible: ${data.fuelType}
- Volumen total: ${data.volumeLiters} litros
- Cisternas: ${data.trucks}

Devuelve SOLO JSON con esta forma exacta (3 a 5 waypoints intermedios realistas a lo largo de la ruta, con km crecientes hasta ${distanceKm.toFixed(0)}):
{
  "waypoints": [{"name": string, "km": number, "note": string}],
  "alerts": [string, string],
  "savingsVsBaselinePct": number
}`;

    let narrative: any = {};
    try {
      narrative = await callLovableAI(SYSTEM_ROUTE, prompt);
    } catch {
      narrative = {};
    }

    const waypoints = Array.isArray(narrative.waypoints) && narrative.waypoints.length
      ? narrative.waypoints
      : [
          { name: originName, km: 0, note: "Punto de carga" },
          { name: destName, km: Math.round(distanceKm), note: "Punto de descarga" },
        ];

    return {
      originName,
      destName,
      distanceKm,
      etaHours,
      fuelCostBs,
      co2Kg,
      waypoints,
      alerts: Array.isArray(narrative.alerts) ? narrative.alerts : [],
      savingsVsBaselinePct:
        typeof narrative.savingsVsBaselinePct === "number" ? narrative.savingsVsBaselinePct : 12,
    };
  });
