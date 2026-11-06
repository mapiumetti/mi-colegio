import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Chips, DateField, Field, Muted, Screen, SwitchRow, Title } from '../components/ui';
import { guardarEnCalendario } from '../lib/calendar';
import { AVISOS_OPCIONES, TIPO_EVENTO, cancelarAvisos, programarAvisos } from '../lib/notifications';
import { enviarWhatsApp } from '../lib/share';
import { uid, useData } from '../lib/store';
import { formatFecha } from '../lib/time';
import type { EventTipo, SchoolEvent } from '../lib/types';

export default function Evento() {
  const params = useLocalSearchParams<{ id?: string; fecha?: string }>();
  const { data, update } = useData();
  const existente = data.events.find((e) => e.id === params.id);

  const fechaInicial = () => {
    if (existente) return new Date(existente.fecha);
    const d = params.fecha ? new Date(`${params.fecha}T08:00`) : new Date();
    if (!params.fecha) d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  };

  const [titulo, setTitulo] = useState(existente?.titulo ?? '');
  const [tipo, setTipo] = useState<EventTipo>(existente?.tipo ?? 'examen');
  const [subjectId, setSubjectId] = useState<string | undefined>(existente?.subjectId);
  const [fecha, setFecha] = useState(fechaInicial);
  const [notas, setNotas] = useState(existente?.notas ?? '');
  const [avisos, setAvisos] = useState<number[]>(existente?.avisos ?? data.settings.avisosPorDefecto);
  const [sonido, setSonido] = useState(existente?.sonido ?? data.settings.sonidoPorDefecto);

  const nombreMateria = data.subjects.find((m) => m.id === subjectId)?.nombre;

  const armar = (): SchoolEvent => ({
    id: existente?.id ?? uid(), titulo: titulo.trim() || TIPO_EVENTO[tipo].label, tipo, subjectId,
    fecha: fecha.toISOString(), notas, avisos, sonido, notificationIds: [],
  });

  const guardar = async (alCalendario: boolean) => {
    const ev = armar();
    try {
      if (existente) await cancelarAvisos(existente.notificationIds);
      ev.notificationIds = await programarAvisos(ev, nombreMateria);
    } catch {
      Alert.alert('Aviso', 'El evento se guardó, pero no se pudieron programar las notificaciones. Revisá los permisos.');
    }
    update((d) => ({ ...d, events: existente ? d.events.map((e) => (e.id === ev.id ? ev : e)) : [...d.events, ev] }));
    if (alCalendario) await guardarEnCalendario(ev, nombreMateria).catch((e) => Alert.alert('Calendario', String(e?.message ?? e)));
    router.back();
  };

  const borrar = () =>
    Alert.alert('Borrar evento', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar', style: 'destructive',
        onPress: async () => {
          if (existente) await cancelarAvisos(existente.notificationIds);
          update((d) => ({ ...d, events: d.events.filter((e) => e.id !== existente?.id) }));
          router.back();
        },
      },
    ]);

  const toggleAviso = (min: number) => setAvisos((a) => (a.includes(min) ? a.filter((x) => x !== min) : [...a, min]));

  return (
    <Screen>
      <Card>
        <Chips options={(Object.keys(TIPO_EVENTO) as EventTipo[]).map((t) => ({ value: t, label: `${TIPO_EVENTO[t].emoji} ${TIPO_EVENTO[t].label}` }))} value={tipo} onChange={setTipo} />
        <Field label="Título" placeholder="Prueba de Historia, Entrega TP 2..." value={titulo} onChangeText={setTitulo} />
        <DateField label="Fecha y hora" mode="datetime" value={fecha} onChange={setFecha} />
        {data.subjects.length > 0 && (
          <>
            <Muted>Materia</Muted>
            <Chips
              options={[{ value: '', label: 'Ninguna' }, ...data.subjects.map((m) => ({ value: m.id, label: m.nombre, color: m.color }))]}
              value={subjectId ?? ''}
              onChange={(v) => setSubjectId(v || undefined)}
            />
          </>
        )}
        <Field label="Notas" placeholder="Temas, materiales, lugar..." value={notas} onChangeText={setNotas} multiline />
      </Card>

      <Card>
        <Title>🔔 Notificaciones</Title>
        <Chips multi options={AVISOS_OPCIONES.map((a) => ({ value: a.min, label: a.label }))} value={avisos} onChange={toggleAviso} />
        <SwitchRow label="Con sonido" value={sonido} onChange={setSonido} />
      </Card>

      <Button icon="💾" title="Guardar" onPress={() => guardar(false)} />
      <Button variant="soft" icon="📆" title="Guardar y agregar a Google Calendar / calendario del teléfono" onPress={() => guardar(true)} />
      <Button
        variant="soft"
        icon="💬"
        title="Avisar por WhatsApp"
        onPress={() => enviarWhatsApp(`${TIPO_EVENTO[tipo].emoji} ${titulo || TIPO_EVENTO[tipo].label}${nombreMateria ? ` (${nombreMateria})` : ''} — ${formatFecha(fecha.toISOString())}${notas ? `\n${notas}` : ''}`)}
      />
      {existente && <Button variant="danger" title="Borrar evento" onPress={borrar} />}
    </Screen>
  );
}
