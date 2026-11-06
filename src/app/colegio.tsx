import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking, Text } from 'react-native';
import { Button, Card, Chips, Field, ListItem, Muted, Row, Screen, Title } from '../components/ui';
import { APPS, abrirApp } from '../lib/apps';
import { guardarCopia, subcarpeta } from '../lib/files';
import { abrirPlataforma } from '../lib/share';
import { uid, useData } from '../lib/store';
import type { School } from '../lib/types';

const ROLES = ['Preceptor/a', 'Director/a', 'Vicedirector/a', 'Secretaría', 'Regente', 'Tutor/a', 'Emergencias', 'Otro'];

export default function Colegio() {
  const { data, update } = useData();
  const c = data.school;
  const set = (patch: Partial<School>) => update((d) => ({ ...d, school: { ...d.school, ...patch } }));
  const [rol, setRol] = useState(ROLES[0]);
  const [otroRol, setOtroRol] = useState('');
  const [nombre, setNombre] = useState('');
  const [tel, setTel] = useState('');
  const [mail, setMail] = useState('');

  const agregarContacto = () => {
    if (!nombre.trim() && !tel.trim()) return;
    const r = rol === 'Otro' ? otroRol.trim() || 'Otro' : rol;
    set({ contactos: [...(c.contactos ?? []), { id: uid(), rol: r, nombre: nombre.trim(), telefono: tel.trim(), email: mail.trim() }] });
    setNombre(''); setTel(''); setMail(''); setOtroRol('');
  };

  const opcionesContacto = (id: string) => {
    const k = c.contactos.find((x) => x.id === id);
    if (!k) return;
    Alert.alert(`${k.rol}: ${k.nombre}`, undefined, [
      ...(k.telefono ? [{ text: `Llamar ${k.telefono}`, onPress: () => Linking.openURL(`tel:${k.telefono}`) }] : []),
      ...(k.email ? [{ text: 'Enviar mail', onPress: () => Linking.openURL(`mailto:${k.email}`) }] : []),
      { text: 'Borrar', style: 'destructive' as const, onPress: () => set({ contactos: c.contactos.filter((x) => x.id !== id) }) },
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

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
        <Field label="Dirección" placeholder="Av. Siempre Viva 742, Ciudad" value={c.direccion} onChangeText={(v) => set({ direccion: v })} />
        <Field label="Teléfono del colegio" keyboardType="phone-pad" value={c.telefono} onChangeText={(v) => set({ telefono: v })} />
        <Field label="Email del colegio" keyboardType="email-address" autoCapitalize="none" value={c.email} onChangeText={(v) => set({ email: v })} />
        <Row>
          {c.direccion ? <Button variant="soft" icon="📍" title="Ver en el mapa" onPress={() => abrirApp({ ...APPS.maps, web: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion)}`, android: undefined })} /> : null}
          {c.telefono ? <Button variant="soft" icon="📞" title="Llamar" onPress={() => Linking.openURL(`tel:${c.telefono}`)} /> : null}
          {c.email ? <Button variant="soft" icon="✉️" title="Mail" onPress={() => Linking.openURL(`mailto:${c.email}`)} /> : null}
        </Row>
      </Card>

      <Card>
        <Title>👥 Autoridades y teléfonos útiles</Title>
        {(c.contactos ?? []).length === 0 && <Muted>Cargá preceptor/a, directivos, secretaría, tutor/a y otros teléfonos útiles.</Muted>}
        {(c.contactos ?? []).map((k) => (
          <ListItem
            key={k.id}
            left={<Text style={{ fontSize: 22 }}>👤</Text>}
            title={`${k.rol}${k.nombre ? `: ${k.nombre}` : ''}`}
            subtitle={[k.telefono, k.email].filter(Boolean).join(' · ')}
            onPress={() => opcionesContacto(k.id)}
          />
        ))}
        <Chips options={ROLES.map((r) => ({ value: r, label: r }))} value={rol} onChange={setRol} />
        {rol === 'Otro' && <Field label="¿Quién es?" placeholder="Bibliotecaria, profe de Ed. Física..." value={otroRol} onChangeText={setOtroRol} />}
        <Field label="Nombre" value={nombre} onChangeText={setNombre} />
        <Field label="Teléfono" keyboardType="phone-pad" value={tel} onChangeText={setTel} />
        <Field label="Email (opcional)" keyboardType="email-address" autoCapitalize="none" value={mail} onChangeText={setMail} />
        <Button title="Agregar" onPress={agregarContacto} />
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
