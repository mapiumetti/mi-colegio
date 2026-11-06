// Temas de la app: modo claro / oscuro / según el sistema, y combinaciones de colores.
// `colors` es un objeto que se actualiza al cambiar el tema; la app se vuelve a dibujar entera.

export type Modo = 'sistema' | 'claro' | 'oscuro';

export const PALETAS = {
  azul: { nombre: 'Azul', primary: '#4F7CF7', soft: '#E8EEFF', softDark: '#1E2A4A' },
  verde: { nombre: 'Verde', primary: '#16A34A', soft: '#E3F6EA', softDark: '#173524' },
  violeta: { nombre: 'Violeta', primary: '#7C3AED', soft: '#EFE7FF', softDark: '#2B1E4A' },
  rosa: { nombre: 'Rosa', primary: '#DB2777', soft: '#FCE7F3', softDark: '#45192F' },
  naranja: { nombre: 'Naranja', primary: '#EA580C', soft: '#FFEDE0', softDark: '#45240F' },
  turquesa: { nombre: 'Turquesa', primary: '#0891B2', soft: '#DFF5FA', softDark: '#123640' },
  rojo: { nombre: 'Rojo', primary: '#DC2626', soft: '#FDE5E5', softDark: '#451616' },
  gris: { nombre: 'Grafito', primary: '#475569', soft: '#E9EDF2', softDark: '#283140' },
} as const;

export type PaletaId = keyof typeof PALETAS;

const CLARO = {
  bg: '#F5F7FB', card: '#FFFFFF', text: '#1F2937', muted: '#6B7280', border: '#E5E7EB',
  input: '#FFFFFF', overlay: 'rgba(0,0,0,0.35)', highlight: '#FFF7E6', highlightText: '#B45309', recess: '#E6F6EC',
};
const OSCURO = {
  bg: '#0F172A', card: '#1E293B', text: '#F1F5F9', muted: '#94A3B8', border: '#334155',
  input: '#0F172A', overlay: 'rgba(0,0,0,0.6)', highlight: '#3A2A10', highlightText: '#FBBF24', recess: '#14301F',
};

export const colors = {
  ...CLARO,
  primary: PALETAS.azul.primary as string,
  primarySoft: PALETAS.azul.soft as string,
  onPrimary: '#FFFFFF',
  success: '#22A06B',
  warning: '#F59E0B',
  danger: '#E5484D',
  dark: false,
};

export function aplicarTema(oscuro: boolean, paleta: PaletaId) {
  const p = PALETAS[paleta] ?? PALETAS.azul;
  Object.assign(colors, oscuro ? OSCURO : CLARO, {
    primary: p.primary,
    primarySoft: oscuro ? p.softDark : p.soft,
    dark: oscuro,
  });
}

// Colores para las materias (fáciles de distinguir).
export const subjectColors = [
  '#4F7CF7', '#22A06B', '#F59E0B', '#E5484D', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#64748B',
];

/** Color de una nota: 9–10 verde fuerte, 7–8,99 verde suave, 4–6,99 amarillo, menos de 4 rojo. */
export function colorNota(n: number | null | undefined): { bg: string; fg: string } {
  if (n == null) return { bg: colors.border, fg: colors.muted };
  if (n >= 9) return { bg: '#15803D', fg: '#FFFFFF' };
  if (n >= 7) return { bg: '#86EFAC', fg: '#14532D' };
  if (n >= 4) return { bg: '#FDE047', fg: '#713F12' };
  return { bg: '#EF4444', fg: '#FFFFFF' };
}

export const radius = 14;
export const spacing = 16;
