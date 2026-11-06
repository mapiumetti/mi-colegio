import type { AppData, FechaEspecial, FechaEspecialTipo } from './types';

/** Fechas que designa el colegio: semanas de intensificación, recuperatorios, asuetos, paros, etc. */
export const FECHA_TIPO: Record<FechaEspecialTipo, { label: string; emoji: string; sinClases: boolean; color: string }> = {
  intensificacion: { label: 'Semana de intensificación', emoji: '📚', sinClases: false, color: '#8B5CF6' },
  recuperatorio: { label: 'Recuperatorios (dic. / feb.-mar.)', emoji: '📝', sinClases: false, color: '#6366F1' },
  asueto: { label: 'Asueto', emoji: '🎈', sinClases: true, color: '#0EA5E9' },
  paro: { label: 'Paro / huelga', emoji: '✊', sinClases: true, color: '#64748B' },
  torneo: { label: 'Torneo / torneo puente', emoji: '🏆', sinClases: true, color: '#F97316' },
  jornada: { label: 'Jornada institucional', emoji: '🏫', sinClases: true, color: '#14B8A6' },
  otro: { label: 'Otra actividad sin clases', emoji: '📌', sinClases: true, color: '#A855F7' },
};

export const fechasDe = (data: AppData, dia: string): FechaEspecial[] =>
  (data.schoolCalendar.fechas ?? []).filter((f) => dia >= f.desde && dia <= (f.hasta || f.desde));

/** Motivo por el que ese día no hay clases (feriado, receso o fecha del colegio), o null si hay clases. */
export function motivoSinClases(data: AppData, dia: string): string | null {
  const fer = data.holidays.find((h) => h.fecha === dia);
  if (fer) return fer.nombre;
  const cal = data.schoolCalendar;
  if (cal.recesoInicio && cal.recesoFin && dia >= cal.recesoInicio && dia <= cal.recesoFin) return 'Receso escolar';
  const f = fechasDe(data, dia).find((x) => FECHA_TIPO[x.tipo].sinClases);
  return f ? `${FECHA_TIPO[f.tipo].label}${f.nombre ? `: ${f.nombre}` : ''}` : null;
}
