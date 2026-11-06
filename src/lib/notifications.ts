import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { SchoolEvent } from './types';

const CANAL_SONIDO = 'recordatorios';
const CANAL_SILENCIO = 'recordatorios-silenciosos';

// Muestra el globo (banner) y reproduce sonido aunque la app esté abierta.
Notifications.setNotificationHandler({
  handleNotification: async (n) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: n.request.content.sound != null,
    shouldSetBadge: true,
  }),
});

export async function prepararNotificaciones() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_SONIDO, {
      name: 'Recordatorios (con sonido)',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync(CANAL_SILENCIO, {
      name: 'Recordatorios (silenciosos)',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') await Notifications.requestPermissionsAsync();
}

export const AVISOS_OPCIONES = [
  { min: 0, label: 'En el momento' },
  { min: 15, label: '15 min antes' },
  { min: 60, label: '1 hora antes' },
  { min: 180, label: '3 horas antes' },
  { min: 1440, label: '1 día antes' },
  { min: 2880, label: '2 días antes' },
  { min: 10080, label: '1 semana antes' },
];

export const TIPO_EVENTO: Record<SchoolEvent['tipo'], { label: string; emoji: string }> = {
  examen: { label: 'Examen / prueba', emoji: '📝' },
  tp: { label: 'Trabajo práctico', emoji: '📚' },
  entrega: { label: 'Entrega', emoji: '📤' },
  torneo: { label: 'Torneo', emoji: '🏆' },
  recordatorio: { label: 'Recordatorio', emoji: '⏰' },
  otro: { label: 'Otro', emoji: '📌' },
};

export async function programarAvisos(ev: SchoolEvent, materia?: string): Promise<string[]> {
  const ids: string[] = [];
  const fecha = new Date(ev.fecha).getTime();
  for (const min of ev.avisos) {
    const cuando = new Date(fecha - min * 60_000);
    if (cuando.getTime() <= Date.now()) continue;
    const label = AVISOS_OPCIONES.find((a) => a.min === min)?.label ?? `${min} min antes`;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${TIPO_EVENTO[ev.tipo].emoji} ${ev.titulo}`,
        body: [materia, min === 0 ? '¡Es ahora!' : label].filter(Boolean).join(' · '),
        sound: ev.sonido ? 'default' : undefined,
        data: { eventId: ev.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: cuando,
        channelId: ev.sonido ? CANAL_SONIDO : CANAL_SILENCIO,
      },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelarAvisos(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}
