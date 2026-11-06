import * as DocumentPicker from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { Button, Card, Chips, ListItem, Muted, Screen, Title } from '../components/ui';
import { crearArchivoBackup, guardarBackupEnTelefono, leerBackup } from '../lib/backup';
import { NUBES, descargarTexto, estaConectada, listar, subir, type ArchivoNube, type NubeId } from '../lib/cloud';
import { compartirArchivo } from '../lib/share';
import { useData } from '../lib/store';
import { PALETAS, colors, type Modo, type PaletaId } from '../lib/theme';
import type { AppData } from '../lib/types';

export default function Ajustes() {
  const { data, update } = useData();
  const [conectadas, setConectadas] = useState<NubeId[]>([]);
  const [trabajando, setTrabajando] = useState(false);
  const [copiasNube, setCopiasNube] = useState<{ nube: NubeId; archivos: ArchivoNube[] } | null>(null);

  useEffect(() => {
    (async () => {
      const ids = (Object.keys(NUBES) as NubeId[]);
      const ok = await Promise.all(ids.map((i) => estaConectada(i)));
      setConectadas(ids.filter((_, k) => ok[k]));
    })();
  }, []);

  const setModo = (modo: Modo) => update((d) => ({ ...d, settings: { ...d.settings, modo } }));
  const setPaleta = (paleta: PaletaId) => update((d) => ({ ...d, settings: { ...d.settings, paleta } }));

  const conTrabajo = async (fn: () => Promise<void>) => {
    setTrabajando(true);
    try { await fn(); } catch (e) { Alert.alert('No se pudo', e instanceof Error ? e.message : String(e)); } finally { setTrabajando(false); }
  };

  const enTelefono = () => conTrabajo(async () => {
    const f = guardarBackupEnTelefono(data);
    Alert.alert('Copia guardada', `Se guardó en Mis archivos → Copias de seguridad:\n${f.name}`);
  });

  const enCarpeta = () => conTrabajo(async () => {
    const dir = await Directory.pickDirectoryAsync();
    const f = crearArchivoBackup(data);
    const destino = dir.createFile(f.name, 'application/json');
    destino.write(await f.text());
    Alert.alert('Copia guardada', `Se guardó ${f.name} en la carpeta elegida.`);
  });

  const compartir = () => conTrabajo(async () => {
    const f = crearArchivoBackup(data);
    await compartirArchivo(f.uri, 'application/json');
  });

  const aNube = (nube: NubeId) => conTrabajo(async () => {
    const f = crearArchivoBackup(data);
    await subir(nube, f);
    Alert.alert('Copia subida', `Se guardó en ${NUBES[nube].nombre}, carpeta de Mi Colegio.`);
  });

  const restaurar = (nuevos: AppData) =>
    Alert.alert('Restaurar copia', 'Se van a reemplazar todos los datos actuales por los de la copia. ¿Seguir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restaurar', style: 'destructive', onPress: () => { update(() => nuevos); router.replace('/'); } },
    ]);

  const desdeArchivo = () => conTrabajo(async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/*', '*/*'], copyToCacheDirectory: true });
    if (r.canceled) return;
    restaurar(leerBackup(await new File(r.assets[0].uri).text()));
  });

  const verCopiasNube = (nube: NubeId) => conTrabajo(async () => {
    const archivos = (await listar(nube)).filter((a) => a.nombre.startsWith('mi-colegio-backup'));
    setCopiasNube({ nube, archivos });
  });

  return (
    <Screen>
      <Card>
        <Title>🎨 Apariencia</Title>
        <Muted>Modo</Muted>
        <Chips
          options={[{ value: 'sistema', label: '📱 Como el teléfono' }, { value: 'claro', label: '☀️ Claro' }, { value: 'oscuro', label: '🌙 Oscuro' }]}
          value={data.settings.modo}
          onChange={(v) => setModo(v as Modo)}
        />
        <Muted>Combinación de colores</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {(Object.keys(PALETAS) as PaletaId[]).map((id) => {
            const p = PALETAS[id];
            const activo = data.settings.paleta === id;
            return (
              <Pressable key={id} onPress={() => setPaleta(id)} style={{ alignItems: 'center', width: 72, gap: 4 }}>
                <View style={{ flexDirection: 'row', borderRadius: 22, overflow: 'hidden', borderWidth: activo ? 3 : 1, borderColor: activo ? colors.text : colors.border }}>
                  <View style={{ width: 22, height: 40, backgroundColor: p.primary }} />
                  <View style={{ width: 22, height: 40, backgroundColor: colors.dark ? p.softDark : p.soft }} />
                </View>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: activo ? '800' : '500' }}>{p.nombre}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Title>💾 Copias de seguridad</Title>
        <Muted>Guarda tus materias, horarios, notas, agenda, apuntes y datos del colegio. Las fotos y audios quedan en Mis archivos.</Muted>
        <Button icon="📱" title="Guardar en el teléfono" onPress={enTelefono} />
        {Platform.OS === 'android' && <Button variant="soft" icon="📂" title="Guardar en una carpeta que elija" onPress={enCarpeta} />}
        {conectadas.map((n) => (
          <Button key={n} variant="soft" icon={NUBES[n].icono} title={`Subir a ${NUBES[n].nombre}`} onPress={() => aNube(n)} />
        ))}
        <Button variant="soft" icon="☁️" title="Enviar a otra nube (Drive, Dropbox, iCloud, mail...)" onPress={compartir} />
        {conectadas.length === 0 && (
          <Muted>Para subir directo sin pasos extra, conectá una nube en Más → Nubes y documentos.</Muted>
        )}
        {trabajando && <ActivityIndicator color={colors.primary} />}
      </Card>

      <Card>
        <Title>♻️ Restaurar</Title>
        <Button variant="soft" icon="📄" title="Desde un archivo (teléfono o nube)" onPress={desdeArchivo} />
        {conectadas.map((n) => (
          <Button key={n} variant="soft" icon={NUBES[n].icono} title={`Ver copias en ${NUBES[n].nombre}`} onPress={() => verCopiasNube(n)} />
        ))}
        {copiasNube && (
          <>
            {copiasNube.archivos.length === 0 && <Muted>No hay copias en {NUBES[copiasNube.nube].nombre}.</Muted>}
            {copiasNube.archivos.map((a) => (
              <ListItem
                key={a.id}
                left={<Text style={{ fontSize: 20 }}>💾</Text>}
                title={a.nombre}
                subtitle={a.fecha ? new Date(a.fecha).toLocaleString('es-AR') : undefined}
                onPress={() => conTrabajo(async () => restaurar(leerBackup(await descargarTexto(copiasNube.nube, a))))}
              />
            ))}
          </>
        )}
      </Card>
    </Screen>
  );
}
