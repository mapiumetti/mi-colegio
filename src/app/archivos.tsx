import * as DocumentPicker from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { Button, Card, Field, ListItem, Muted, Row, Screen, Title, s } from '../components/ui';
import { asegurarCarpetasMaterias, carpetaBase, esImagen, guardarCopia, iconoDe, mimeDe } from '../lib/files';
import { useData } from '../lib/store';
import { compartirArchivo } from '../lib/share';
import { colors } from '../lib/theme';

export default function Archivos() {
  const { data } = useData();
  // Por defecto hay una carpeta por cada materia cargada.
  const [dir, setDir] = useState<Directory>(() => {
    asegurarCarpetasMaterias(data.subjects.map((m) => m.nombre));
    return carpetaBase();
  });
  const [items, setItems] = useState<(File | Directory)[]>([]);
  const [verImagen, setVerImagen] = useState<string | null>(null);
  const [nuevaCarpeta, setNuevaCarpeta] = useState('');
  const base = carpetaBase();
  const enRaiz = dir.uri === base.uri;

  const refrescar = useCallback(() => {
    try {
      setItems(dir.list().sort((a, b) => Number(b instanceof Directory) - Number(a instanceof Directory) || a.name.localeCompare(b.name)));
    } catch {
      setItems([]);
    }
  }, [dir]);
  useEffect(refrescar, [refrescar]);

  const desdeCamara = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permiso necesario', 'Habilitá la cámara en los ajustes.');
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (!r.canceled) { r.assets.forEach((a) => guardarCopia(a.uri, dir, a.fileName ?? `foto-${Date.now()}.jpg`)); refrescar(); }
  };

  const desdeGaleria = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true });
    if (!r.canceled) { r.assets.forEach((a) => guardarCopia(a.uri, dir, a.fileName ?? undefined)); refrescar(); }
  };

  // El selector del sistema muestra Google Drive, Dropbox, OneDrive, iCloud Drive, etc. si están instalados.
  const importar = async () => {
    const r = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (!r.canceled) { r.assets.forEach((a) => guardarCopia(a.uri, dir, a.name)); refrescar(); }
  };

  const crearCarpeta = () => {
    const n = nuevaCarpeta.trim();
    if (!n) return;
    try { dir.createDirectory(n.replace(/[\\/:*?"<>|]/g, '_')); } catch { Alert.alert('Error', 'No se pudo crear la carpeta.'); }
    setNuevaCarpeta('');
    refrescar();
  };

  const abrir = async (it: File | Directory) => {
    if (it instanceof Directory) return setDir(it);
    if (esImagen(it.name)) return setVerImagen(it.uri);
    // PDFs y demás: vista previa nativa (Quick Look en iOS, visor de PDF del sistema en Android).
    try {
      await it.preview({ title: it.name, mimeType: mimeDe(it.name) });
    } catch {
      await compartirArchivo(it.uri, mimeDe(it.name));
    }
  };

  const opciones = (it: File | Directory) =>
    Alert.alert(it.name, undefined, [
      ...(it instanceof File ? [{ text: 'Compartir (WhatsApp, Telegram, Drive...)', onPress: () => compartirArchivo(it.uri, mimeDe(it.name)) }] : []),
      { text: 'Borrar', style: 'destructive' as const, onPress: () => { it.delete(); refrescar(); } },
      { text: 'Cancelar', style: 'cancel' as const },
    ]);

  return (
    <Screen>
      <Card>
        <Title>📁 {enRaiz ? 'MiColegio' : dir.name}</Title>
        {!enRaiz && <Button variant="soft" title="‹ Volver a la carpeta anterior" onPress={() => setDir(dir.parentDirectory)} />}
        <Row>
          <Button variant="soft" icon="📷" title="Cámara" onPress={desdeCamara} />
          <Button variant="soft" icon="🖼️" title="Galería" onPress={desdeGaleria} />
          <Button variant="soft" icon="☁️" title="Importar (Drive, Dropbox, iCloud...)" onPress={importar} />
        </Row>
        <Row style={{ flexWrap: 'nowrap' }}>
          <View style={{ flex: 1 }}><Field label="Nueva carpeta" placeholder="Matemática" value={nuevaCarpeta} onChangeText={setNuevaCarpeta} /></View>
          <Button title="Crear" onPress={crearCarpeta} style={{ marginTop: 18 }} />
        </Row>
      </Card>

      <Card>
        {items.length === 0 && <Muted>Carpeta vacía. Sacá fotos del pizarrón, importá PDFs o grabá audios.</Muted>}
        {items.map((it) => (
          <ListItem
            key={it.uri}
            left={<Text style={{ fontSize: 24 }}>{it instanceof Directory ? '📂' : iconoDe(it.name)}</Text>}
            title={it.name}
            subtitle={it instanceof File && it.size ? `${Math.max(1, Math.round(it.size / 1024))} KB` : undefined}
            onPress={() => abrir(it)}
            onLongPress={() => opciones(it)}
            right={<Pressable onPress={() => opciones(it)} hitSlop={10}><Text style={{ fontSize: 20, color: colors.muted }}>⋯</Text></Pressable>}
          />
        ))}
      </Card>

      <Modal visible={!!verImagen} transparent onRequestClose={() => setVerImagen(null)}>
        <View style={[s.modalBg, { justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          {verImagen && <Image source={{ uri: verImagen }} style={{ width: '100%', height: '75%' }} contentFit="contain" />}
          <Row style={{ justifyContent: 'center', marginTop: 16 }}>
            <Button variant="soft" title="Compartir" onPress={() => verImagen && compartirArchivo(verImagen)} />
            <Button title="Cerrar" onPress={() => setVerImagen(null)} />
          </Row>
        </View>
      </Modal>
    </Screen>
  );
}
