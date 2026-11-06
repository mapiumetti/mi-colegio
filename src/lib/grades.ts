import type { BoletinConfig, Grade, GradeEstado, GradeTipo, SistemaBoletin } from './types';

export const TIPO_NOTA: Record<GradeTipo, string> = { examen: 'Examen', tp: 'Trabajo práctico', entrega: 'Entrega', oral: 'Oral' };
export const ESTADO: Record<GradeEstado, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#F59E0B' },
  entregado: { label: 'Entregado', color: '#4F7CF7' },
  calificado: { label: 'Calificado', color: '#22A06B' },
};

export function promedio(notas: Grade[]) {
  const n = notas.filter((g) => g.nota != null).map((g) => g.nota as number);
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
}

/** Cuatrimestre según la fecha: hasta julio es el 1°, desde agosto el 2°. */
export const periodoDeFecha = (iso: string): 1 | 2 => (new Date(iso).getMonth() <= 6 ? 1 : 2);
export const periodoDe = (g: Grade): 1 | 2 => g.periodo ?? periodoDeFecha(g.fecha);

export type Concepto = { sigla: string; nombre: string; detalle: string };

export const SISTEMAS: Record<SistemaBoletin, { nombre: string; descripcion: string; aprobacion: number; escala: Concepto[] }> = {
  numerico: {
    nombre: 'Solo números',
    descripcion: 'El boletín muestra la nota numérica.',
    aprobacion: 6,
    escala: [],
  },
  nacional: {
    nombre: 'Nacional tradicional',
    descripcion: 'Escala conceptual E / MB / B / S / I.',
    aprobacion: 4,
    escala: [
      { sigla: 'E', nombre: 'Sobresaliente', detalle: 'Equivale a 10' },
      { sigla: 'MB', nombre: 'Muy bueno', detalle: 'Equivale a 8 o 9' },
      { sigla: 'B', nombre: 'Bueno', detalle: 'Equivale a 6 o 7' },
      { sigla: 'S', nombre: 'Suficiente', detalle: 'Nota mínima de aprobación (4 o 5)' },
      { sigla: 'I', nombre: 'Insuficiente', detalle: 'Equivale a 1, 2 o 3' },
    ],
  },
  pba: {
    nombre: 'Provincia de Buenos Aires (RITE)',
    descripcion: 'Trayectoria educativa: TEA / TEP / TED.',
    aprobacion: 7,
    escala: [
      { sigla: 'TEA', nombre: 'Trayectoria Educativa Avanzada', detalle: 'Logró los aprendizajes (7 a 10)' },
      { sigla: 'TEP', nombre: 'Trayectoria Educativa en Proceso', detalle: 'Aprendizajes en desarrollo, requiere refuerzo (4 a 6)' },
      { sigla: 'TED', nombre: 'Trayectoria Educativa Discontinua', detalle: 'Aprendizajes insuficientes (1 a 3)' },
    ],
  },
  caba: {
    nombre: 'Ciudad de Buenos Aires (CABA)',
    descripcion: 'Plan de aprendizaje: Finalizado / En proceso / No iniciado.',
    aprobacion: 6,
    escala: [
      { sigla: 'F', nombre: 'Finalizado', detalle: 'Aprobó todos los componentes del plan (6 a 10)' },
      { sigla: 'EP', nombre: 'En proceso', detalle: 'No completó todos los componentes (3 a 5)' },
      { sigla: 'NI', nombre: 'No iniciado', detalle: 'No comenzó a trabajar en el plan (menos de 3)' },
    ],
  },
};

/** Sistema sugerido según la jurisdicción elegida en Feriados → Calendario escolar. */
export function sistemaSugerido(provincia: string): SistemaBoletin {
  if (provincia === 'Buenos Aires') return 'pba';
  if (provincia === 'CABA') return 'caba';
  return 'nacional';
}

/** Traduce un promedio numérico a la calificación conceptual del sistema elegido. */
export function concepto(sistema: SistemaBoletin, n: number | null): Concepto | null {
  if (n == null) return null;
  const e = SISTEMAS[sistema].escala;
  switch (sistema) {
    case 'nacional': {
      const r = Math.round(n);
      return r >= 10 ? e[0] : r >= 8 ? e[1] : r >= 6 ? e[2] : r >= 4 ? e[3] : e[4];
    }
    case 'pba':
      return n >= 7 ? e[0] : n >= 4 ? e[1] : e[2];
    case 'caba':
      return n >= 6 ? e[0] : n >= 3 ? e[1] : e[2];
    default:
      return null;
  }
}

export type ResumenMateria = {
  c1: number | null;
  c2: number | null;
  final: number | null;
  aprobada: boolean | null; // null = todavía no se puede saber
  pendientes: number;
  recuperatorio: number | null; // nota de intensificación o recuperatorio (la última cargada)
};

export const INSTANCIA = {
  regular: 'Regular',
  intensificacion: 'Intensificación',
  recuperatorio: 'Recuperatorio (dic. / feb.-mar.)',
} as const;
export const esRegular = (g: Grade) => !g.instancia || g.instancia === 'regular';

export function resumenMateria(todas: Grade[], cfg: BoletinConfig): ResumenMateria {
  const notas = todas.filter(esRegular);
  const extra = todas.filter((g) => !esRegular(g) && g.nota != null).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const recuperatorio = extra.length ? (extra[extra.length - 1].nota as number) : null;
  const c1 = promedio(notas.filter((g) => periodoDe(g) === 1));
  const c2 = promedio(notas.filter((g) => periodoDe(g) === 2));
  const final = c1 != null && c2 != null ? (c1 + c2) / 2 : (c1 ?? c2);
  let aprobada: boolean | null = null;
  if (c1 != null && c2 != null) {
    aprobada = cfg.cuatrimestres === 'individual'
      ? c1 >= cfg.notaAprobacion && c2 >= cfg.notaAprobacion
      : (final as number) >= cfg.notaAprobacion;
  }
  // Si rindió intensificación o recuperatorio, esa nota define si aprobó.
  if (recuperatorio != null && aprobada !== true) aprobada = recuperatorio >= cfg.notaAprobacion;
  return { c1, c2, final, aprobada, recuperatorio, pendientes: todas.filter((g) => g.estado === 'pendiente').length };
}

/** Texto para mostrar una nota: "8,50" o "8,50 · MB". */
export function mostrarNota(sistema: SistemaBoletin, n: number | null): string {
  if (n == null) return '—';
  const num = n.toFixed(2).replace('.', ',');
  const c = concepto(sistema, n);
  return c ? `${num} · ${c.sigla}` : num;
}
