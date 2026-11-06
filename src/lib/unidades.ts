// Factores respecto de la unidad base de cada magnitud (SI).
export type Unidad = { id: string; nombre: string; factor: number };
export type Magnitud = { id: string; nombre: string; icono: string; unidades: Unidad[]; especial?: 'temperatura' };

export const MAGNITUDES: Magnitud[] = [
  {
    id: 'longitud', nombre: 'Longitud', icono: '📏', unidades: [
      { id: 'km', nombre: 'kilómetro (km)', factor: 1000 },
      { id: 'hm', nombre: 'hectómetro (hm)', factor: 100 },
      { id: 'dam', nombre: 'decámetro (dam)', factor: 10 },
      { id: 'm', nombre: 'metro (m)', factor: 1 },
      { id: 'dm', nombre: 'decímetro (dm)', factor: 0.1 },
      { id: 'cm', nombre: 'centímetro (cm)', factor: 0.01 },
      { id: 'mm', nombre: 'milímetro (mm)', factor: 0.001 },
      { id: 'um', nombre: 'micrómetro (µm)', factor: 1e-6 },
      { id: 'nm', nombre: 'nanómetro (nm)', factor: 1e-9 },
      { id: 'mi', nombre: 'milla', factor: 1609.344 },
      { id: 'yd', nombre: 'yarda', factor: 0.9144 },
      { id: 'ft', nombre: 'pie', factor: 0.3048 },
      { id: 'in', nombre: 'pulgada', factor: 0.0254 },
      { id: 'al', nombre: 'año luz', factor: 9.4607e15 },
    ],
  },
  {
    id: 'masa', nombre: 'Masa', icono: '⚖️', unidades: [
      { id: 't', nombre: 'tonelada (t)', factor: 1000 },
      { id: 'kg', nombre: 'kilogramo (kg)', factor: 1 },
      { id: 'hg', nombre: 'hectogramo (hg)', factor: 0.1 },
      { id: 'dag', nombre: 'decagramo (dag)', factor: 0.01 },
      { id: 'g', nombre: 'gramo (g)', factor: 0.001 },
      { id: 'dg', nombre: 'decigramo (dg)', factor: 1e-4 },
      { id: 'cg', nombre: 'centigramo (cg)', factor: 1e-5 },
      { id: 'mg', nombre: 'miligramo (mg)', factor: 1e-6 },
      { id: 'lb', nombre: 'libra', factor: 0.45359237 },
      { id: 'oz', nombre: 'onza', factor: 0.028349523 },
    ],
  },
  {
    id: 'tiempo', nombre: 'Tiempo', icono: '⏱️', unidades: [
      { id: 's', nombre: 'segundo (s)', factor: 1 },
      { id: 'ms', nombre: 'milisegundo (ms)', factor: 0.001 },
      { id: 'min', nombre: 'minuto (min)', factor: 60 },
      { id: 'h', nombre: 'hora (h)', factor: 3600 },
      { id: 'd', nombre: 'día', factor: 86400 },
      { id: 'sem', nombre: 'semana', factor: 604800 },
      { id: 'anio', nombre: 'año (365 días)', factor: 31536000 },
    ],
  },
  {
    id: 'temperatura', nombre: 'Temperatura', icono: '🌡️', especial: 'temperatura', unidades: [
      { id: 'C', nombre: 'grado Celsius (°C)', factor: 1 },
      { id: 'F', nombre: 'grado Fahrenheit (°F)', factor: 1 },
      { id: 'K', nombre: 'kelvin (K)', factor: 1 },
    ],
  },
  {
    id: 'superficie', nombre: 'Superficie', icono: '🟩', unidades: [
      { id: 'km2', nombre: 'km²', factor: 1e6 },
      { id: 'ha', nombre: 'hectárea (ha)', factor: 1e4 },
      { id: 'a', nombre: 'área (a)', factor: 100 },
      { id: 'm2', nombre: 'm²', factor: 1 },
      { id: 'dm2', nombre: 'dm²', factor: 0.01 },
      { id: 'cm2', nombre: 'cm²', factor: 1e-4 },
      { id: 'mm2', nombre: 'mm²', factor: 1e-6 },
    ],
  },
  {
    id: 'volumen', nombre: 'Volumen y capacidad', icono: '🧴', unidades: [
      { id: 'm3', nombre: 'm³', factor: 1 },
      { id: 'dm3', nombre: 'dm³', factor: 0.001 },
      { id: 'cm3', nombre: 'cm³', factor: 1e-6 },
      { id: 'kl', nombre: 'kilolitro (kl)', factor: 1 },
      { id: 'l', nombre: 'litro (l)', factor: 0.001 },
      { id: 'dl', nombre: 'decilitro (dl)', factor: 1e-4 },
      { id: 'cl', nombre: 'centilitro (cl)', factor: 1e-5 },
      { id: 'ml', nombre: 'mililitro (ml)', factor: 1e-6 },
      { id: 'gal', nombre: 'galón (EE.UU.)', factor: 0.003785411784 },
    ],
  },
  {
    id: 'velocidad', nombre: 'Velocidad', icono: '🏎️', unidades: [
      { id: 'ms', nombre: 'm/s', factor: 1 },
      { id: 'kmh', nombre: 'km/h', factor: 1 / 3.6 },
      { id: 'cms', nombre: 'cm/s', factor: 0.01 },
      { id: 'mph', nombre: 'millas/h', factor: 0.44704 },
      { id: 'kn', nombre: 'nudo', factor: 0.514444 },
    ],
  },
  {
    id: 'fuerza', nombre: 'Fuerza', icono: '💪', unidades: [
      { id: 'N', nombre: 'newton (N)', factor: 1 },
      { id: 'kgf', nombre: 'kilogramo fuerza (kgf)', factor: 9.80665 },
      { id: 'dyn', nombre: 'dina', factor: 1e-5 },
    ],
  },
  {
    id: 'energia', nombre: 'Energía', icono: '⚡', unidades: [
      { id: 'J', nombre: 'joule (J)', factor: 1 },
      { id: 'kJ', nombre: 'kilojoule (kJ)', factor: 1000 },
      { id: 'cal', nombre: 'caloría (cal)', factor: 4.184 },
      { id: 'kcal', nombre: 'kilocaloría (kcal)', factor: 4184 },
      { id: 'kWh', nombre: 'kilowatt hora (kWh)', factor: 3.6e6 },
      { id: 'erg', nombre: 'ergio', factor: 1e-7 },
      { id: 'kgm', nombre: 'kilográmetro (kgm)', factor: 9.80665 },
    ],
  },
  {
    id: 'potencia', nombre: 'Potencia', icono: '🔌', unidades: [
      { id: 'W', nombre: 'watt (W)', factor: 1 },
      { id: 'kW', nombre: 'kilowatt (kW)', factor: 1000 },
      { id: 'HP', nombre: 'HP (caballo de fuerza)', factor: 745.7 },
      { id: 'CV', nombre: 'CV (caballo de vapor)', factor: 735.5 },
    ],
  },
  {
    id: 'presion', nombre: 'Presión', icono: '🎈', unidades: [
      { id: 'Pa', nombre: 'pascal (Pa)', factor: 1 },
      { id: 'hPa', nombre: 'hectopascal (hPa)', factor: 100 },
      { id: 'atm', nombre: 'atmósfera (atm)', factor: 101325 },
      { id: 'mmHg', nombre: 'mm de mercurio (mmHg)', factor: 133.322 },
      { id: 'bar', nombre: 'bar', factor: 1e5 },
      { id: 'psi', nombre: 'psi', factor: 6894.757 },
    ],
  },
  {
    id: 'angulo', nombre: 'Ángulos', icono: '📐', unidades: [
      { id: 'deg', nombre: 'grado sexagesimal (°)', factor: Math.PI / 180 },
      { id: 'rad', nombre: 'radián (rad)', factor: 1 },
      { id: 'grad', nombre: 'grado centesimal (g)', factor: Math.PI / 200 },
      { id: 'rev', nombre: 'vuelta', factor: 2 * Math.PI },
    ],
  },
  {
    id: 'datos', nombre: 'Datos', icono: '💾', unidades: [
      { id: 'b', nombre: 'bit', factor: 1 / 8 },
      { id: 'B', nombre: 'byte', factor: 1 },
      { id: 'KB', nombre: 'kilobyte (KB)', factor: 1024 },
      { id: 'MB', nombre: 'megabyte (MB)', factor: 1024 ** 2 },
      { id: 'GB', nombre: 'gigabyte (GB)', factor: 1024 ** 3 },
      { id: 'TB', nombre: 'terabyte (TB)', factor: 1024 ** 4 },
    ],
  },
];

function aCelsius(v: number, u: string) {
  return u === 'F' ? ((v - 32) * 5) / 9 : u === 'K' ? v - 273.15 : v;
}
function desdeCelsius(c: number, u: string) {
  return u === 'F' ? (c * 9) / 5 + 32 : u === 'K' ? c + 273.15 : c;
}

export function convertir(m: Magnitud, valor: number, de: string, a: string): number {
  if (m.especial === 'temperatura') return desdeCelsius(aCelsius(valor, de), a);
  const f1 = m.unidades.find((u) => u.id === de)!.factor;
  const f2 = m.unidades.find((u) => u.id === a)!.factor;
  return (valor * f1) / f2;
}

export function formatoNumero(n: number): string {
  if (!isFinite(n)) return '—';
  if (n !== 0 && (Math.abs(n) >= 1e9 || Math.abs(n) < 1e-4)) return n.toExponential(4).replace('.', ',');
  return String(Math.round(n * 1e8) / 1e8).replace('.', ',');
}
