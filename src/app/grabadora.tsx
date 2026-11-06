import { File } from 'expo-file-system';
import {
  RecordingPresets, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync,
  useAudioRecorder, useAudioRecorderState, type AudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Card, ListItem, Muted, Screen, Title } from '../components/ui';
import { esAudio, guardarCopia, subcarpeta } from '../lib/files';
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

  const refrescar = useCallback(() => {
    const dir = subcarpeta('Grabaciones');
    setGrabaciones(dir.list().filter((x): x is File => x instanceof File && esAudio(x.name)).reverse());
  }, []);
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
    if (recorder.uri) {
      const fecha = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
      guardarCopia(recorder.uri, subcarpeta('Grabaciones'), `clase-${fecha}.m4a`);
      refrescar();
    }
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
    </Screen>
  );
}
