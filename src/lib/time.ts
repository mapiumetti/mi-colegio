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

/** Entrada y salida de un turno para un día puntual (o las generales). */
export function horarioTurno(cfg: ScheduleConfig, dia: number, turnoId: TurnoId) {
  const t = cfg.turnos.find((x) => x.id === turnoId)!;
  const o = cfg.porDia?.[String(dia)]?.[turnoId];
  return { entrada: o?.entrada ?? t.entrada, salida: o?.salida ?? t.salida };
}

/** Minutos de recreo después del módulo N (1, 2, 3...) de un turno. */
function recreoDespuesDe(cfg: ScheduleConfig, n: number): number {
  if (cfg.recreos && cfg.recreos.length > 0) return cfg.recreos.find((r) => r.despuesDe === n)?.duracion ?? 0;
  const r = cfg.recreo;
  return r.cadaModulos > 0 && r.duracion > 0 && n % r.cadaModulos === 0 ? r.duracion : 0;
}

/**
 * Genera la grilla horaria a partir de la configuración de turnos:
 * módulos de N minutos, recreos (cada uno con su duración), almuerzo y
 * horarios distintos por día. Si un módulo choca con el almuerzo, se corre
 * para después. Conserva la materia asignada si ya había un módulo en ese día y hora.
 */
export function generarBloques(cfg: ScheduleConfig, prev: Block[]): Block[] {
  const out: Block[] = [];
  const almIni = toMin(cfg.almuerzo.inicio);
  const almFin = toMin(cfg.almuerzo.fin);
  for (const dia of cfg.dias) {
    let almuerzoPuesto = false;
    for (const turno of cfg.turnos.filter((t) => t.activo)) {
      const h = horarioTurno(cfg, dia, turno.id);
      let t = toMin(h.entrada);
      let fin = toMin(h.salida);
      if (fin <= t) fin += 24 * 60; // turno noche que pasa la medianoche
      let modulos = 0;
      while (t + cfg.duracionModulo <= fin) {
        if (cfg.almuerzo.activo && almFin > almIni && t < almFin && t + cfg.duracionModulo > almIni) {
          if (!almuerzoPuesto) {
            out.push({ id: uid(), dia, turno: turno.id, tipo: 'almuerzo', inicio: cfg.almuerzo.inicio, fin: cfg.almuerzo.fin });
            almuerzoPuesto = true;
          }
          t = almFin;
          continue;
        }
        const inicio = fromMin(t);
        const previo = prev.find((b) => b.dia === dia && b.inicio === inicio && b.tipo === 'materia');
        out.push({
          id: uid(), dia, turno: turno.id, tipo: 'materia',
          inicio, fin: fromMin(t + cfg.duracionModulo), subjectId: previo?.subjectId,
        });
        t += cfg.duracionModulo;
        modulos++;
        const rec = recreoDespuesDe(cfg, modulos);
        if (rec > 0 && t + rec + cfg.duracionModulo <= fin) {
          out.push({ id: uid(), dia, turno: turno.id, tipo: 'recreo', inicio: fromMin(t), fin: fromMin(t + rec) });
          t += rec;
        }
      }
    }
    if (cfg.almuerzo.activo && !almuerzoPuesto && almFin > almIni) {
      out.push({ id: uid(), dia, turno: 'manana', tipo: 'almuerzo', inicio: cfg.almuerzo.inicio, fin: cfg.almuerzo.fin });
    }
  }
  return out.sort((a, b) => a.dia - b.dia || toMin(a.inicio) - toMin(b.inicio));
}
