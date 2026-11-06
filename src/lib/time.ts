import type { Block, ScheduleConfig, TurnoId } from './types';
import { uid } from './store';

export const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const TURNO_NOMBRE: Record<TurnoId, string> = { manana: 'Mañana', tarde: 'Tarde (vespertino)', noche: 'Noche' };

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const fromMin = (min: number) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
export const dateToHHMM = (d: Date) => fromMin(d.getHours() * 60 + d.getMinutes());
export const hhmmToDate = (hhmm: string) => {
  const d = new Date();
  const m = toMin(hhmm);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
};

export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const formatFecha = (iso: string) => {
  const d = new Date(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} ${dateToHHMM(d)}`;
};

export const formatYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS[date.getDay()]} ${d}/${m}/${y}`;
};

/**
 * Genera la grilla horaria a partir de la configuración de turnos:
 * módulos de N minutos, con un recreo cada X módulos y almuerzo entre turnos.
 * Conserva la materia asignada a cada módulo si ya existía uno en el mismo día y hora.
 */
export function generarBloques(cfg: ScheduleConfig, prev: Block[]): Block[] {
  const out: Block[] = [];
  for (const dia of cfg.dias) {
    for (const turno of cfg.turnos.filter((t) => t.activo)) {
      let t = toMin(turno.entrada);
      let fin = toMin(turno.salida);
      if (fin <= t) fin += 24 * 60; // turno noche que pasa la medianoche
      let modulos = 0;
      while (t + cfg.duracionModulo <= fin) {
        const inicio = fromMin(t);
        const previo = prev.find((b) => b.dia === dia && b.inicio === inicio && b.tipo === 'materia');
        out.push({
          id: uid(), dia, turno: turno.id, tipo: 'materia',
          inicio, fin: fromMin(t + cfg.duracionModulo), subjectId: previo?.subjectId,
        });
        t += cfg.duracionModulo;
        modulos++;
        const quedaOtro = t + cfg.recreo.duracion + cfg.duracionModulo <= fin;
        if (cfg.recreo.cadaModulos > 0 && cfg.recreo.duracion > 0 && modulos % cfg.recreo.cadaModulos === 0 && quedaOtro) {
          out.push({ id: uid(), dia, turno: turno.id, tipo: 'recreo', inicio: fromMin(t), fin: fromMin(t + cfg.recreo.duracion) });
          t += cfg.recreo.duracion;
        }
      }
    }
    const manana = cfg.turnos.find((x) => x.id === 'manana');
    const tarde = cfg.turnos.find((x) => x.id === 'tarde');
    if (cfg.almuerzo.activo && manana?.activo && tarde?.activo) {
      out.push({ id: uid(), dia, turno: 'manana', tipo: 'almuerzo', inicio: cfg.almuerzo.inicio, fin: cfg.almuerzo.fin });
    }
  }
  return out.sort((a, b) => a.dia - b.dia || toMin(a.inicio) - toMin(b.inicio));
}
