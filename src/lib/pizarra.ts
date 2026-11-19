import type { Trazo } from './types';

// Herramientas y figuras de la pizarra.

export type Grupo = 'plana' | 'cuerpo';
export const FIGURAS: { id: string; label: string; icono: string; grupo: Grupo }[] = [
  { id: 'linea', label: 'Línea', icono: '╱', grupo: 'plana' },
  { id: 'flecha', label: 'Flecha', icono: '➚', grupo: 'plana' },
  { id: 'rect', label: 'Rectángulo', icono: '▭', grupo: 'plana' },
  { id: 'cuadrado', label: 'Cuadrado', icono: '◻', grupo: 'plana' },
  { id: 'circulo', label: 'Círculo', icono: '◯', grupo: 'plana' },
  { id: 'elipse', label: 'Elipse', icono: '⬭', grupo: 'plana' },
  { id: 'triangulo', label: 'Triángulo', icono: '△', grupo: 'plana' },
  { id: 'trirect', label: 'Triáng. rectángulo', icono: '◺', grupo: 'plana' },
  { id: 'rombo', label: 'Rombo', icono: '◇', grupo: 'plana' },
  { id: 'trapecio', label: 'Trapecio', icono: '⏢', grupo: 'plana' },
  { id: 'paralelogramo', label: 'Paralelogramo', icono: '▱', grupo: 'plana' },
  { id: 'pentagono', label: 'Pentágono', icono: '⬠', grupo: 'plana' },
  { id: 'hexagono', label: 'Hexágono', icono: '⬡', grupo: 'plana' },
  { id: 'estrella', label: 'Estrella', icono: '☆', grupo: 'plana' },
  { id: 'cubo', label: 'Cubo', icono: '🧊', grupo: 'cuerpo' },
  { id: 'prisma', label: 'Prisma rectangular', icono: '📦', grupo: 'cuerpo' },
  { id: 'prismatri', label: 'Prisma triangular', icono: '🔺', grupo: 'cuerpo' },
  { id: 'piramide', label: 'Pirámide', icono: '🔼', grupo: 'cuerpo' },
  { id: 'tetraedro', label: 'Tetraedro', icono: '◭', grupo: 'cuerpo' },
  { id: 'octaedro', label: 'Octaedro', icono: '◈', grupo: 'cuerpo' },
  { id: 'cilindro', label: 'Cilindro', icono: '🥫', grupo: 'cuerpo' },
  { id: 'cono', label: 'Cono', icono: '🍦', grupo: 'cuerpo' },
  { id: 'esfera', label: 'Esfera', icono: '🌐', grupo: 'cuerpo' },
];

export const COLORES = ['#111827', '#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#DB2777', '#0891B2', '#FFFFFF'];
export const GROSORES = [2, 4, 7, 12];

type P = [number, number];
export type Linea = { d: string; punteada?: boolean };
/** contorno: figura cerrada (se puede rellenar y recortar) · lineas: aristas extra (las ocultas, punteadas). */
export type Geometria = { contorno?: string; lineas: Linea[] };

const f = (n: number) => Math.round(n * 10) / 10;
const poli = (pts: P[], cerrar = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])},${f(p[1])}`).join(' ') + (cerrar ? ' Z' : '');
const seg = (a: P, b: P, punteada = false): Linea => ({ d: poli([a, b], false), punteada });
const elipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)},${f(cy)} a${f(rx)},${f(ry)} 0 1,0 ${f(2 * rx)},0 a${f(rx)},${f(ry)} 0 1,0 ${f(-2 * rx)},0 Z`;
const regular = (cx: number, cy: number, r: number, lados: number, rot = -Math.PI / 2): P[] =>
  Array.from({ length: lados }, (_, i) => [cx + r * Math.cos(rot + (2 * Math.PI * i) / lados), cy + r * Math.sin(rot + (2 * Math.PI * i) / lados)]);

/** Caja normalizada del arrastre; el cuadrado y el círculo la hacen cuadrada. */
function caja(t: Trazo) {
  let { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = t;
  if (['cuadrado', 'circulo', 'cubo', 'esfera'].includes(t.tipo)) {
    const lado = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    x2 = x1 + Math.sign(x2 - x1 || 1) * lado;
    y2 = y1 + Math.sign(y2 - y1 || 1) * lado;
  }
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  return { x, y, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

export function geometria(t: Trazo): Geometria {
  if (t.tipo === 'linea' || t.tipo === 'flecha') {
    const a: P = [t.x1 ?? 0, t.y1 ?? 0], b: P = [t.x2 ?? 0, t.y2 ?? 0];
    const lineas = [seg(a, b)];
    if (t.tipo === 'flecha') {
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const l = 10 + (t.grosor ?? 3) * 2;
      for (const s of [-1, 1]) lineas.push(seg(b, [b[0] - l * Math.cos(ang + s * 0.45), b[1] - l * Math.sin(ang + s * 0.45)]));
    }
    return { lineas };
  }
  const { x, y, w, h } = caja(t);
  const cx = x + w / 2, cy = y + h / 2;
  switch (t.tipo) {
    case 'rect':
    case 'cuadrado':
      return { contorno: poli([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]), lineas: [] };
    case 'circulo':
    case 'elipse':
      return { contorno: elipse(cx, cy, w / 2, h / 2), lineas: [] };
    case 'triangulo':
      return { contorno: poli([[cx, y], [x + w, y + h], [x, y + h]]), lineas: [] };
    case 'trirect':
      return { contorno: poli([[x, y], [x + w, y + h], [x, y + h]]), lineas: [] };
    case 'rombo':
      return { contorno: poli([[cx, y], [x + w, cy], [cx, y + h], [x, cy]]), lineas: [] };
    case 'trapecio':
      return { contorno: poli([[x + w * 0.25, y], [x + w * 0.75, y], [x + w, y + h], [x, y + h]]), lineas: [] };
    case 'paralelogramo':
      return { contorno: poli([[x + w * 0.25, y], [x + w, y], [x + w * 0.75, y + h], [x, y + h]]), lineas: [] };
    case 'pentagono':
    case 'hexagono': {
      const pts = regular(0, 0, 1, t.tipo === 'pentagono' ? 5 : 6);
      // Se estira para ocupar la caja del arrastre.
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const [mx, Mx, my, My] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      return { contorno: poli(pts.map(([px, py]) => [x + ((px - mx) / (Mx - mx)) * w, y + ((py - my) / (My - my)) * h])), lineas: [] };
    }
    case 'estrella': {
      const pts: P[] = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? 0.45 : 1;
        const a = -Math.PI / 2 + (Math.PI * i) / 5;
        return [cx + (w / 2) * r * Math.cos(a), cy + (h / 2) * r * Math.sin(a) + h * 0.05];
      });
      return { contorno: poli(pts), lineas: [] };
    }
    case 'cubo':
    case 'prisma': {
      const d = Math.min(w, h) * 0.3;
      const fA: P = [x, y + d], fB: P = [x + w - d, y + d], fC: P = [x + w - d, y + h], fD: P = [x, y + h];
      const bA: P = [x + d, y], bB: P = [x + w, y], bC: P = [x + w, y + h - d], bD: P = [x + d, y + h - d];
      return {
        contorno: poli([fA, bA, bB, bC, fC, fD]),
        lineas: [seg(fA, fB), seg(fB, fC), seg(fB, bB), seg(bD, bA, true), seg(bD, bC, true), seg(bD, fD, true)],
      };
    }
    case 'prismatri': {
      const d = Math.min(w, h) * 0.3;
      const fA: P = [x, y + h], fB: P = [x + w - d, y + h], fP: P = [x + (w - d) / 2, y + d];
      const bA: P = [x + d, y + h - d], bB: P = [x + w, y + h - d], bP: P = [x + d + (w - d) / 2, y];
      return {
        contorno: poli([fA, fP, bP, bB, fB]),
        lineas: [seg(fP, fB), seg(bA, bP, true), seg(bA, bB, true), seg(bA, fA, true)],
      };
    }
    case 'piramide': {
      const A: P = [x, y + h], B: P = [x + w * 0.72, y + h], C: P = [x + w, y + h * 0.8], D: P = [x + w * 0.28, y + h * 0.8], V: P = [cx, y];
      return { contorno: poli([A, B, C, V]), lineas: [seg(V, B), seg(C, D, true), seg(D, A, true), seg(V, D, true)] };
    }
    case 'tetraedro': {
      const A: P = [x, y + h * 0.82], B: P = [x + w * 0.58, y + h], C: P = [x + w, y + h * 0.72], V: P = [x + w * 0.45, y];
      return { contorno: poli([A, B, C, V]), lineas: [seg(V, B), seg(A, C, true)] };
    }
    case 'octaedro': {
      const T: P = [cx, y], U: P = [cx, y + h], L: P = [x, cy], R: P = [x + w, cy], F: P = [x + w * 0.4, y + h * 0.6], K: P = [x + w * 0.6, y + h * 0.4];
      return {
        contorno: poli([T, R, U, L]),
        lineas: [seg(T, F), seg(U, F), seg(L, F), seg(F, R), seg(T, K, true), seg(U, K, true), seg(L, K, true), seg(K, R, true)],
      };
    }
    case 'cilindro': {
      const rx = w / 2, ry = Math.min(h * 0.12, w * 0.25), yt = y + ry, yb = y + h - ry;
      return {
        contorno: `M${f(x)},${f(yt)} L${f(x)},${f(yb)} A${f(rx)},${f(ry)} 0 0,0 ${f(x + w)},${f(yb)} L${f(x + w)},${f(yt)} A${f(rx)},${f(ry)} 0 0,0 ${f(x)},${f(yt)} Z`,
        lineas: [{ d: elipse(cx, yt, rx, ry) }, { d: `M${f(x)},${f(yb)} A${f(rx)},${f(ry)} 0 0,1 ${f(x + w)},${f(yb)}`, punteada: true }],
      };
    }
    case 'cono': {
      const rx = w / 2, ry = Math.min(h * 0.12, w * 0.25), yb = y + h - ry;
      return {
        contorno: `M${f(cx)},${f(y)} L${f(x + w)},${f(yb)} A${f(rx)},${f(ry)} 0 0,1 ${f(x)},${f(yb)} Z`,
        lineas: [{ d: `M${f(x)},${f(yb)} A${f(rx)},${f(ry)} 0 0,1 ${f(x + w)},${f(yb)}`, punteada: true }],
      };
    }
    case 'esfera': {
      const r = w / 2, ry = r * 0.3;
      return {
        contorno: elipse(cx, cy, r, r),
        lineas: [
          { d: `M${f(x)},${f(cy)} A${f(r)},${f(ry)} 0 0,0 ${f(x + w)},${f(cy)}` },
          { d: `M${f(x)},${f(cy)} A${f(r)},${f(ry)} 0 0,1 ${f(x + w)},${f(cy)}`, punteada: true },
        ],
      };
    }
    default:
      return { lineas: [] };
  }
}

/** Trazo de lápiz como camino suave. */
export function caminoLapiz(p: number[]): string {
  if (p.length < 2) return '';
  if (p.length === 2) return `M${f(p[0])},${f(p[1])} l0.1,0.1`;
  let d = `M${f(p[0])},${f(p[1])}`;
  for (let i = 2; i < p.length - 2; i += 2) {
    const mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2;
    d += ` Q${f(p[i])},${f(p[i + 1])} ${f(mx)},${f(my)}`;
  }
  return d + ` L${f(p[p.length - 2])},${f(p[p.length - 1])}`;
}

/** Mueve un trazo (y lo que tenga adentro, si es un recorte). */
export function trasladar(t: Trazo, dx: number, dy: number): Trazo {
  if (!dx && !dy) return t;
  return {
    ...t,
    puntos: t.puntos?.map((v, i) => v + (i % 2 ? dy : dx)),
    x1: t.x1 != null ? t.x1 + dx : undefined,
    y1: t.y1 != null ? t.y1 + dy : undefined,
    x2: t.x2 != null ? t.x2 + dx : undefined,
    y2: t.y2 != null ? t.y2 + dy : undefined,
    a: t.a ? trasladar(t.a, dx, dy) : undefined,
    b: t.b ? trasladar(t.b, dx, dy) : undefined,
  };
}

/** Rectángulo que ocupa un trazo (para tocarlo, moverlo o borrarlo). */
export function limites(t: Trazo): { x: number; y: number; w: number; h: number } {
  if (t.tipo === 'combo' && t.a && t.b) {
    const a = limites(t.a), b = limites(t.b);
    if (t.op === 'restar') return a;
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
  }
  if (t.tipo === 'texto') {
    const tam = t.tam ?? 22;
    return { x: t.x1 ?? 0, y: (t.y1 ?? 0) - tam, w: (t.texto?.length ?? 1) * tam * 0.55, h: tam * 1.2 };
  }
  if (t.puntos) {
    const xs = t.puntos.filter((_, i) => i % 2 === 0), ys = t.puntos.filter((_, i) => i % 2 === 1);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  const x = Math.min(t.x1 ?? 0, t.x2 ?? 0), y = Math.min(t.y1 ?? 0, t.y2 ?? 0);
  return { x, y, w: Math.abs((t.x2 ?? 0) - (t.x1 ?? 0)), h: Math.abs((t.y2 ?? 0) - (t.y1 ?? 0)) };
}

/** ¿El dedo en (px, py) toca este trazo? */
export function toca(t: Trazo, px: number, py: number, margen = 14): boolean {
  if ((t.tipo === 'lapiz' || t.tipo === 'resaltador') && t.puntos) {
    const m = margen + (t.grosor ?? 3);
    for (let i = 0; i < t.puntos.length; i += 2) if (Math.abs(t.puntos[i] - px) < m && Math.abs(t.puntos[i + 1] - py) < m) return true;
    return false;
  }
  const b = limites(t);
  return px >= b.x - margen && px <= b.x + b.w + margen && py >= b.y - margen && py <= b.y + b.h + margen;
}

/** Las figuras con contorno (planas o cuerpos) se pueden rellenar y recortar entre sí. */
export const recortable = (t: Trazo) => t.tipo !== 'combo' && !!geometria(t).contorno;

export const PROMPTS = [
  { id: 'resolver', label: '🧮 Resolver', texto: 'En esta imagen de mi pizarra hay un ejercicio escrito a mano o un dibujo (ecuación, figura geométrica o problema de física de secundaria). Leelo y resolvelo paso a paso, explicando cada paso. Si es una figura, usá los datos que tenga marcados (por ejemplo, aplicá el teorema de Pitágoras si es un triángulo rectángulo).' },
  { id: 'texto', label: '📝 Pasar a texto', texto: 'Transcribí exactamente el texto escrito a mano en esta imagen de mi pizarra, respetando títulos y listas. Si hay fórmulas, escribilas con símbolos de texto. Respondé solo con la transcripción.' },
  { id: 'explicar', label: '💡 Explicar', texto: 'Explicame de forma simple lo que dibujé o escribí en esta pizarra, como si fueras mi profesor.' },
  { id: 'revisar', label: '✅ Revisar mi resolución', texto: 'En esta pizarra resolví un ejercicio. Revisá si está bien, marcá los errores y explicá cómo corregirlos.' },
];
