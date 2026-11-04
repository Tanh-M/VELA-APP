// Interrupteur du MODE DÉMONSTRATION.
// Il est piloté par une variable d'environnement : rien à modifier dans le code.
// - Variable absente (cas normal) : le panneau n'apparaît pas
// - VITE_DEMO_MODE=true (réglée dans Vercel) : le panneau apparaît, pour les administrateurs seulement
export const DEMO_MODE_ENABLED = import.meta.env.VITE_DEMO_MODE === 'true';