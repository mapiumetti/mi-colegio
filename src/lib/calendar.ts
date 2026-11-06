import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';
import type { SchoolEvent } from './types';

/**
 * Abre el formulario nativo del calendario con el evento precargado.
 * Desde ahí el alumno elige en qué calendario guardarlo: Google Calendar,
 * el calendario de iOS (iCloud), Outlook, etc. — los que tenga configurados en el teléfono.
 */
export async function guardarEnCalendario(ev: SchoolEvent, materia?: string) {
  const perm = await Calendar.requestCalendarPermissions(Platform.OS === 'ios');
  if (perm.status !== 'granted') {
    Alert.alert('Permiso necesario', 'Habilitá el acceso al calendario en los ajustes del teléfono.');
    return;
  }
  const inicio = new Date(ev.fecha);
  const fin = new Date(inicio.getTime() + 60 * 60_000);
  let cal: Calendar.ExpoCalendar | undefined;
  if (Platform.OS === 'ios') {
    cal = Calendar.getDefaultCalendarSync();
  } else {
    const cals = await Calendar.getCalendars();
    const editables = cals.filter((c) => c.allowsModifications);
    // Preferimos el calendario principal de Google si existe.
    cal = editables.find((c) => c.isPrimary && c.source?.type === 'com.google') ?? editables.find((c) => c.isPrimary) ?? editables[0];
  }
  if (!cal) {
    Alert.alert('Sin calendario', 'No encontramos un calendario donde guardar. Agregá una cuenta de Google en el teléfono.');
    return;
  }
  await cal.addEventWithForm({
    title: ev.titulo,
    startDate: inicio,
    endDate: fin,
    notes: [materia, ev.notas].filter(Boolean).join('\n'),
  });
}
