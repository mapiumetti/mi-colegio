import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Text } from 'react-native';
import { Button, Card, Field, Muted, Row, Screen, Title } from '../components/ui';
import { guardarCopia, subcarpeta } from '../lib/files';
import { abrirPlataforma } from '../lib/share';
import { useData } from '../lib/store';
import type { School } from '../lib/types';

export default function Colegio() {
  const { data, update } = useData();
  const c = data.school;
  const set = (patch: Partial<School>) => update((d) => ({ ...d, school: { ...d.school, ...patch } }));

  const elegirLogo = async (camara: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsEditing: false };
    if (camara) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permiso necesario', 'Habilitá la cámara en los ajustes.');
    }
    const res = camara ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    const a = res.assets[0];
    // Guardamos una copia propia para que el logo (foto o GIF animado) no se pierda.
    const ext = a.mimeType === 'image/gif' || a.uri.toLowerCase().endsWith('.gif') ? 'gif' : 'jpg';
    const archivo = guardarCopia(a.uri, subcarpeta('Colegio'), `logo-${Date.now()}.${ext}`);
    set({ logoUri: archivo.uri });
  };

  return (
    <Screen>
      <Card style={{ alignItems: 'center' }}>
        {c.logoUri ? (
          <Image source={{ uri: c.logoUri }} style={{ width: 140, height: 140, borderRadius: 16 }} contentFit="contain" />
        ) : (
          <Text style={{ fontSize: 72 }}>🏫</Text>
        )}
        <Muted>Logo del colegio (foto o GIF)</Muted>
        <Row>
          <Button variant="soft" icon="🖼️" title="Galería" onPress={() => elegirLogo(false)} />
          <Button variant="soft" icon="📷" title="Sacar foto" onPress={() => elegirLogo(true)} />
          {c.logoUri && <Button variant="danger" title="Quitar" onPress={() => set({ logoUri: null })} />}
        </Row>
      </Card>
      <Card>
        <Field label="Nombre del colegio" value={c.nombre} onChangeText={(v) => set({ nombre: v })} />
      </Card>
      <Card>
        <Title>🌐 Plataforma del colegio</Title>
        <Field label="Nombre" placeholder="Campus virtual, Classroom, Moodle..." value={c.plataformaNombre} onChangeText={(v) => set({ plataformaNombre: v })} />
        <Field label="Dirección web" placeholder="https://campus.micolegio.edu.ar" autoCapitalize="none" keyboardType="url" value={c.plataformaUrl} onChangeText={(v) => set({ plataformaUrl: v.trim() })} />
        {c.plataformaUrl ? (
          <Row>
            <Button title="Abrir aquí" onPress={() => abrirPlataforma(c.plataformaUrl, false)} />
            <Button variant="soft" title="Abrir en Chrome / navegador" onPress={() => abrirPlataforma(c.plataformaUrl, true)} />
          </Row>
        ) : null}
      </Card>
    </Screen>
  );
}
