import { File } from 'expo-file-system';
import {
  RecordingPresets, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync,
  useAudioRecorder, useAudioRecorderState, type AudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, ListItem, Muted, Screen, Title, s as st } from '../components/ui';
import { carpetaMateria, esAudio, guardarCopia, subcarpeta } from '../lib/files';
import { useData } from '../lib/store';
import { compartirArchivo } from '../lib/share';
import { colors } from '../lib/theme';

const fmt = (ms: number) => {
  const t = Math.floor(ms / 1000);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

export default function Grabadora() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estado = useAudioRecorderState(recorder, 250);
  const [grabaciones, setGrabaciones] = useState<File[]>([]);
  const [sonando, setSonando] = useState<string | null>(null);
  const player = useRef<AudioPlayer | null>(null);
  const { data } = useData();
  const [pendiente, setPendiente] = useState<string | null>(null);

  // Muestra las grabaciones de la carpeta general y de cada materia.
  const refrescar = useCallback(() => {
    const carpetas = [subcarpeta('Grabaciones'), ...data.subjects.map((m) => carpetaMateria(m.nombre))];
    const todos = carpetas.flatMap((d) => {
      try { return d.list().filter((x): x is File => x instanceof File && esAudio(x.name)); } catch { return []; }
    });
    setGrabaciones(todos.sort((a, b) => b.name.localeCompare(a.name)));
  }, [data.subjects]);
  useEffect(() => {
    refrescar();
    return () => player.current?.remove();
  }, [refrescar]);

  const empezar = async () => {
    const p = await requestRecordingPermissionsAsync();
    if (!p.granted) return Alert.alert('Permiso necesario', 'Habilitá el micrófono en los ajustes.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const detener = async () => {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    if (recorder.uri) setPendiente(recorder.uri); // preguntamos en qué carpeta guardarla
  };

  const guardarEn = (materia?: { nombre: string }) => {
    if (!pendiente) return;
    const fecha = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
    const dir = materia ? carpetaMateria(materia.nombre) : subcarpeta('Grabaciones');
    const prefijo = materia ? materia.nombre.toLowerCase().replace(/\s+/g, '-') : 'grabacion';
    guardarCopia(pendiente, dir, `${prefijo}-${fecha}.m4a`);
    setPendiente(null);
    refrescar();
  };

  const reproducir = (f: File) => {
    player.current?.remove();
    if (sonando === f.uri) { setSonando(null); player.current = null; return; }
    player.current = createAudioPlayer({ uri: f.uri });
    player.current.play();
    setSonando(f.uri);
  };

  return (
    <Screen>
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 64 }}>{estado.isRecording ? '🔴' : '🎙️'}</Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text }}>{fmt(estado.durationMillis)}</Text>
        {estado.isRecording ? (
          <Button variant="danger" title="Detener y guardar" onPress={detener} />
        ) : (
          <Button title="Grabar" onPress={empezar} />
        )}
        <Muted>Ideal para grabar explicaciones o hacer notas de voz.</Muted>
      </Card>
      <Card>
        <Title>Grabaciones</Title>
        {grabaciones.length === 0 && <Muted>Todavía no hay grabaciones.</Muted>}
        {grabaciones.map((g) => (
          <ListItem
            key={g.uri}
            left={<Text style={{ fontSize: 22 }}>{sonando === g.uri ? '⏸️' : '▶️'}</Text>}
            title={g.name}
            subtitle={g.parentDirectory.name}
            onPress={() => reproducir(g)}
            onLongPress={() =>
              Alert.alert(g.name, undefined, [
                { text: 'Compartir', onPress: () => compartirArchivo(g.uri, 'audio/mp4') },
                { text: 'Borrar', style: 'destructive', onPress: () => { g.delete(); refrescar(); } },
                { text: 'Cancelar', style: 'cancel' },
              ])
            }
          />
        ))}
      </Card>

      <Modal visible={!!pendiente} transparent animationType="slide" onRequestClose={() => guardarEn()}>
        <View style={st.modalBg}>
          <View style={st.modal}>
            <Title>¿En qué carpeta guardo la grabación?</Title>
            <ScrollView style={{ maxHeight: 380 }}>
              <Pressable onPress={() => guardarEn()} style={{ padding: 14, borderRadius: 12, backgroundColor: colors.primarySoft, marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>🎙️ Grabaciones (general)</Text>
              </Pressable>
              {data.subjects.map((m) => (
                <Pressable key={m.id} onPress={() => guardarEn(m)} style={{ padding: 14, borderRadius: 12, backgroundColor: `${m.color}33`, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>📂 {m.nombre}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
