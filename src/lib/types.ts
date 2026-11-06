export type Profile = {
  nombre: string;
  apellido: string;
  edad: string;
  anio: string; // Año que cursa, p. ej. "3°"
  curso: string; // Curso o división, p. ej. "B"
  orientacion: string;
  email: string;
  telefono: string;
};

export type School = {
  nombre: string;
  logoUri: string | null; // Foto o GIF guardado en el dispositivo
  plataformaNombre: string;
  plataformaUrl: string;
  direccion: string;
  telefono: string;
  email: string;
  contactos: SchoolContact[]; // preceptor/a, directivos, secretaría, etc.
};

export type SchoolContact = { id: string; rol: string; nombre: string; telefono: string; email: string };

export type Subject = {
  id: string;
  nombre: string;
  profesor: string;
  aula: string;
  color: string;
};

export type TurnoId = 'manana' | 'tarde' | 'noche';

export type Turno = {
  id: TurnoId;
  activo: boolean;
  entrada: string; // "HH:MM"
  salida: string;
};

export type ScheduleConfig = {
  turnos: Turno[];
  almuerzo: { activo: boolean; inicio: string; fin: string };
  duracionModulo: number; // minutos de cada hora cátedra
  recreo: { duracion: number; cadaModulos: number };
  // Recreos con duración propia: "después del módulo N de cada turno, X minutos".
  // Si la lista está vacía se usa la regla simple de `recreo`.
  recreos?: { despuesDe: number; duracion: number }[];
  dias: number[]; // 1 = lunes ... 6 = sábado
  // Horarios distintos para un día puntual (p. ej. los martes salen 14:15).
  porDia?: Record<string, Partial<Record<TurnoId, { entrada: string; salida: string }>>>;
};

export type BlockTipo = 'materia' | 'recreo' | 'almuerzo';

export type Block = {
  id: string;
  dia: number;
  inicio: string;
  fin: string;
  tipo: BlockTipo;
  turno: TurnoId;
  subjectId?: string;
};

export type GradeTipo = 'examen' | 'tp' | 'entrega' | 'oral';
export type GradeEstado = 'pendiente' | 'entregado' | 'calificado';

export type Grade = {
  id: string;
  subjectId: string;
  tipo: GradeTipo;
  titulo: string;
  fecha: string; // ISO
  nota: number | null;
  estado: GradeEstado;
  periodo?: 1 | 2; // cuatrimestre
  instancia?: 'regular' | 'intensificacion' | 'recuperatorio';
};

export type EventTipo = 'examen' | 'tp' | 'entrega' | 'torneo' | 'recordatorio' | 'otro';

export type SchoolEvent = {
  id: string;
  titulo: string;
  tipo: EventTipo;
  subjectId?: string;
  fecha: string; // ISO
  notas: string;
  avisos: number[]; // minutos antes del evento
  sonido: boolean;
  notificationIds: string[];
};

export type AiProviderId = 'claude' | 'chatgpt' | 'gemini' | 'grok' | 'copilot';

export type SistemaBoletin = 'numerico' | 'nacional' | 'pba' | 'caba';

export type BoletinConfig = {
  configurado: boolean;
  sistema: SistemaBoletin;
  cuatrimestres: 'promedian' | 'individual';
  notaAprobacion: number;
};

export type Apunte = { id: string; subjectId?: string; titulo: string; texto: string; fecha: string };

export type Settings = {
  modo: 'sistema' | 'claro' | 'oscuro';
  paleta: string;
  boletin: BoletinConfig;
  avisosPorDefecto: number[];
  sonidoPorDefecto: boolean;
  aiProvider: AiProviderId;
  aiModels: Partial<Record<AiProviderId, string>>;
};

export type AppData = {
  profile: Profile;
  school: School;
  subjects: Subject[];
  schedule: ScheduleConfig;
  blocks: Block[];
  grades: Grade[];
  events: SchoolEvent[];
  settings: Settings;
  holidays: Holiday[];
  holidaysUpdated: string | null;
  schoolCalendar: SchoolCalendar;
  apuntes: Apunte[];
  asistencia: Asistencia;
  conducta: Conducta;
};

export type Holiday = {
  fecha: string; // "YYYY-MM-DD"
  nombre: string;
  tipo: 'inamovible' | 'trasladable' | 'puente' | 'escolar';
};

export type SchoolCalendar = {
  provincia: string;
  inicioClases: string; // "YYYY-MM-DD"
  finClases: string;
  recesoInicio: string;
  recesoFin: string;
  fechas?: FechaEspecial[];
};

export type FechaEspecialTipo = 'intensificacion' | 'recuperatorio' | 'asueto' | 'paro' | 'torneo' | 'jornada' | 'otro';
export type FechaEspecial = { id: string; tipo: FechaEspecialTipo; nombre: string; desde: string; hasta: string };

export type Falta = { id: string; fecha: string; valor: number; justificada: boolean; certificadoUri?: string; nota?: string };
export type Asistencia = { limite: number; faltas: Falta[] };

export type Sancion = { id: string; fecha: string; valor: number; motivo: string };
export type Conducta = {
  sistema: 'creditos' | 'amonestaciones';
  creditosIniciales: number;
  alertaCreditos: number;
  alertaAmonestaciones: number;
  maximoAmonestaciones: number;
  registros: Sancion[];
};
