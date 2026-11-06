import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppData } from './types';

const KEY = 'mi-colegio:data:v1';

export const defaultData: AppData = {
  profile: { nombre: '', apellido: '', edad: '', anio: '', curso: '', orientacion: '', email: '', telefono: '' },
  school: {
    nombre: '', logoUri: null, plataformaNombre: 'Plataforma del colegio', plataformaUrl: '',
    direccion: '', telefono: '', email: '', contactos: [],
  },
  subjects: [],
  schedule: {
    turnos: [
      { id: 'manana', activo: true, entrada: '07:30', salida: '12:30' },
      { id: 'tarde', activo: false, entrada: '13:30', salida: '17:30' },
      { id: 'noche', activo: false, entrada: '19:00', salida: '23:00' },
    ],
    almuerzo: { activo: false, inicio: '12:30', fin: '13:30' },
    duracionModulo: 40,
    recreo: { duracion: 10, cadaModulos: 2 },
    dias: [1, 2, 3, 4, 5],
  },
  blocks: [],
  grades: [],
  events: [],
  settings: {
    modo: 'sistema',
    paleta: 'azul',
    boletin: { configurado: false, sistema: 'nacional', cuatrimestres: 'promedian', notaAprobacion: 6 },
    avisosPorDefecto: [1440, 60],
    sonidoPorDefecto: true,
    aiProvider: 'claude',
    aiModels: {},
  },
  holidays: [],
  holidaysUpdated: null,
  schoolCalendar: { provincia: 'Nacional', inicioClases: '', finClases: '', recesoInicio: '', recesoFin: '' },
  apuntes: [],
};

type Ctx = {
  data: AppData;
  ready: boolean;
  update: (fn: (d: AppData) => AppData) => void;
};

const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [ready, setReady] = useState(false);
  const latest = useRef(data);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppData>;
          // Mezcla con los valores por defecto para tolerar versiones viejas de los datos.
          const merged: AppData = {
            ...defaultData,
            ...saved,
            profile: { ...defaultData.profile, ...saved.profile },
            school: { ...defaultData.school, ...saved.school },
            schedule: { ...defaultData.schedule, ...saved.schedule },
            settings: {
              ...defaultData.settings,
              ...saved.settings,
              boletin: { ...defaultData.settings.boletin, ...saved.settings?.boletin },
            },
            schoolCalendar: { ...defaultData.schoolCalendar, ...saved.schoolCalendar },
          };
          latest.current = merged;
          setData(merged);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    const next = fn(latest.current);
    latest.current = next;
    setData(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  return <DataContext.Provider value={{ data, ready, update }}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider');
  return ctx;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
