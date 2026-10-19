// ============================================================
// FICHIER TEMPORAIRE : fausses données pour tester l'historique.
// Quand les vrais événements arriveront (table "device_events" dans Supabase),
// on supprimera ce fichier et on le remplacera par un hook useDeviceHistory.
// La FORME des objets ci-dessous est celle que la vraie table devra respecter.
// ============================================================

// Chaque événement : une ligne de l'historique.
//  - minutesAgo : "il y a X minutes" (transformé en vraie date plus bas)
//  - level      : 'normal' | 'moyen' | 'critique'
//  - actions    : liste parmi 'app_alert' | 'alarm' | 'water_jet' | 'gsm'
const RAW_EVENTS = [
  { minutesAgo: 12,    temperature: 24.5, smoke_level: 3,  gas_level: 2,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 95,    temperature: 31.2, smoke_level: 18, gas_level: 9,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 180,   temperature: 48.7, smoke_level: 42, gas_level: 21, flame_detected: false, level: 'moyen',    actions: ['app_alert'] },
  { minutesAgo: 185,   temperature: 62.3, smoke_level: 71, gas_level: 35, flame_detected: false, level: 'critique', actions: ['app_alert', 'alarm'] },
  { minutesAgo: 188,   temperature: 78.9, smoke_level: 88, gas_level: 52, flame_detected: true,  level: 'critique', actions: ['app_alert', 'alarm', 'water_jet', 'gsm'] },
  { minutesAgo: 210,   temperature: 33.4, smoke_level: 12, gas_level: 6,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 420,   temperature: 27.1, smoke_level: 5,  gas_level: 3,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 600,   temperature: 45.8, smoke_level: 38, gas_level: 44, flame_detected: false, level: 'moyen',    actions: ['app_alert'] },
  { minutesAgo: 615,   temperature: 29.6, smoke_level: 8,  gas_level: 5,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 1100,  temperature: 26.3, smoke_level: 4,  gas_level: 2,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 1500,  temperature: 52.4, smoke_level: 66, gas_level: 30, flame_detected: false, level: 'critique', actions: ['app_alert', 'alarm', 'gsm'] },
  { minutesAgo: 1510,  temperature: 30.0, smoke_level: 10, gas_level: 7,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 3000,  temperature: 41.9, smoke_level: 35, gas_level: 18, flame_detected: false, level: 'moyen',    actions: ['app_alert'] },
  { minutesAgo: 3020,  temperature: 28.2, smoke_level: 6,  gas_level: 4,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 5800,  temperature: 70.1, smoke_level: 80, gas_level: 61, flame_detected: true,  level: 'critique', actions: ['app_alert', 'alarm', 'water_jet', 'gsm'] },
  { minutesAgo: 5830,  temperature: 31.5, smoke_level: 14, gas_level: 8,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 12000, temperature: 25.7, smoke_level: 3,  gas_level: 2,  flame_detected: false, level: 'normal',   actions: [] },
  { minutesAgo: 20000, temperature: 44.2, smoke_level: 40, gas_level: 25, flame_detected: false, level: 'moyen',    actions: ['app_alert'] },
];

// Transforme "il y a X minutes" en vraie date ISO, comme le ferait Supabase.
// Les événements sont renvoyés du plus récent au plus ancien.
export function getMockHistory(deviceId) {
  const now = Date.now();

  return RAW_EVENTS.map((event, index) => ({
    id: `${deviceId}-${index}`,
    device_id: deviceId,
    occurred_at: new Date(now - event.minutesAgo * 60 * 1000).toISOString(),
    temperature: event.temperature,
    smoke_level: event.smoke_level,
    gas_level: event.gas_level,
    flame_detected: event.flame_detected,
    level: event.level,
    actions: event.actions,
  }));
}