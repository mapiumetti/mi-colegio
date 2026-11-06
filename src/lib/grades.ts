import { colors } from './theme';
import type { Grade, GradeEstado, GradeTipo } from './types';

export const TIPO_NOTA: Record<GradeTipo, string> = { examen: 'Examen', tp: 'Trabajo práctico', entrega: 'Entrega', oral: 'Oral' };
export const ESTADO: Record<GradeEstado, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: colors.warning },
  entregado: { label: 'Entregado', color: colors.primary },
  calificado: { label: 'Calificado', color: colors.success },
};

export function promedio(notas: Grade[]) {
  const n = notas.filter((g) => g.nota != null).map((g) => g.nota as number);
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
}

