import { Contact, requestPermissionsAsync } from 'expo-contacts';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Card, Field, ListItem, Muted, Screen, Title } from '../components/ui';
import { enviarTelegram, enviarWhatsApp } from '../lib/share';

type Elegido = { nombre: string; telefono: string };

export default function Contactos() {
  const [elegidos, setElegidos] = useState<Elegido[]>([]);
  const [mensaje, setMensaje] = useState('');

  // Abre la agenda del teléfono para elegir un compañero/a o profesor/a.
  const elegir = async () => {
    const p = await requestPermissionsAsync();
    if (p.status !== 'granted') return Alert.alert('Permiso necesario', 'Habilitá el acceso a los contactos en los ajustes.');
    const c = await Contact.presentPicker();
    if (!c) return;
    const nombre = await c.getFullName();
    const tels = await c.getPhones();
    const telefono = tels[0]?.number ?? '';
    if (!telefono) Alert.alert('Sin teléfono', `${nombre} no tiene número cargado.`);
    setElegidos((e) => [...e.filter((x) => x.nombre !== nombre), { nombre, telefono }]);
  };

  return (
    <Screen>
      <Card>
        <Title>Mensaje para compartir</Title>
        <Field label="Texto" placeholder="Resumen de la clase, tarea para mañana..." value={mensaje} onChangeText={setMensaje} multiline />
        <Button variant="soft" icon="💬" title="Enviar por WhatsApp (elegir chat)" onPress={() => enviarWhatsApp(mensaje)} />
        <Button variant="soft" icon="✈️" title="Enviar por Telegram" onPress={() => enviarTelegram(mensaje)} />
        <Muted>Para mandar fotos, PDFs o audios, usá "Compartir" desde Mis archivos.</Muted>
      </Card>
      <Card>
        <Title>Desde la agenda del teléfono</Title>
        <Button icon="👥" title="Elegir contacto" onPress={elegir} />
        {elegidos.map((c) => (
          <ListItem
            key={c.nombre}
            left={<Text style={{ fontSize: 22 }}>👤</Text>}
            title={c.nombre}
            subtitle={c.telefono || 'Sin teléfono'}
            right={c.telefono ? <Button variant="soft" title="WhatsApp" onPress={() => enviarWhatsApp(mensaje, c.telefono)} /> : null}
          />
        ))}
      </Card>
    </Screen>
  );
}
