import type { Holiday } from './types';

/**
 * Feriados nacionales de Argentina.
 *
 * Fuente principal: https://www.argentina.gob.ar/feriados (publicados por el Ministerio del Interior).
 * Esa página no ofrece una API, así que la app consulta ArgentinaDatos, un servicio abierto que
 * replica los feriados oficiales (inamovibles, trasladables y días no laborables con fines turísticos,
 * los "puentes"). Si no hay conexión, quedan los últimos feriados descargados.
 */
export const FUENTE_FERIADOS = 'https://www.argentina.gob.ar/feriados';
export const FUENTE_CALENDARIO_ESCOLAR = 'https://www.argentina.gob.ar/capital-humano/educacion/calendario-escolar-2026';

type ApiFeriado = { fecha: string; tipo: string; nombre: string };

export async function descargarFeriados(anio: number): Promise<Holiday[]> {
  const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${anio}`);
  if (!res.ok) throw new Error(`No se pudieron descargar los feriados (${res.status}).`);
  const lista = (await res.json()) as ApiFeriado[];
  return lista.map((f) => ({
    fecha: f.fecha,
    nombre: f.nombre,
    tipo: f.tipo === 'puente' ? 'puente' : f.tipo === 'trasladable' ? 'trasladable' : 'inamovible',
  }));
}

export const ETIQUETA_FERIADO: Record<Holiday['tipo'], string> = {
  inamovible: 'Feriado inamovible',
  trasladable: 'Feriado trasladable',
  puente: 'Día no laborable (puente)',
  escolar: 'Calendario escolar',
};

export const PROVINCIAS = [
  'Nacional', 'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];
