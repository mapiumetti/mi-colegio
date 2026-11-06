import { router } from 'expo-router';
import { Platform, Text } from 'react-native';
import { Button, Card, ListItem, Muted, Screen, Title } from '../components/ui';
import { abrirConRespaldo } from '../lib/share';

type Enlace = { icon: string; nombre: string; app?: string; web: string; detalle?: string };

const NUBES: Enlace[] = [
  { icon: '🟢', nombre: 'Google Drive', app: 'googledrive://', web: 'https://drive.google.com' },
  { icon: '🔷', nombre: 'Dropbox', app: 'dbx-dropbox://', web: 'https://www.dropbox.com/home' },
  { icon: '☁️', nombre: 'OneDrive (Microsoft)', app: 'ms-onedrive://', web: 'https://onedrive.live.com' },
  ...(Platform.OS === 'ios'
    ? [{ icon: '🍏', nombre: 'iCloud Drive (app Archivos)', app: 'shareddocuments://', web: 'https://www.icloud.com/iclouddrive' }]
    : [{ icon: '🍏', nombre: 'iCloud Drive (web)', web: 'https://www.icloud.com/iclouddrive' }]),
];

const OFIMATICA: Enlace[] = [
  { icon: '📘', nombre: 'Word', app: 'ms-word://', web: 'https://www.office.com/launch/word', detalle: 'Microsoft 365' },
  { icon: '📗', nombre: 'Excel', app: 'ms-excel://', web: 'https://www.office.com/launch/excel', detalle: 'Microsoft 365' },
  { icon: '📙', nombre: 'PowerPoint', app: 'ms-powerpoint://', web: 'https://www.office.com/launch/powerpoint', detalle: 'Microsoft 365' },
  { icon: '📄', nombre: 'Nuevo Documento de Google', web: 'https://docs.new', detalle: 'Google Docs (gratis)' },
  { icon: '📊', nombre: 'Nueva Hoja de cálculo de Google', web: 'https://sheets.new', detalle: 'Google Sheets (gratis)' },
  { icon: '📽️', nombre: 'Nueva Presentación de Google', web: 'https://slides.new', detalle: 'Google Slides (gratis)' },
  { icon: '🆓', nombre: 'Collabora Office (LibreOffice)', web: 'https://www.collaboraoffice.com/collabora-office-mobile/', detalle: 'Suite libre para el celular' },
];

export default function Nubes() {
  const item = (e: Enlace) => (
    <ListItem
      key={e.nombre}
      left={<Text style={{ fontSize: 24 }}>{e.icon}</Text>}
      title={e.nombre}
      subtitle={e.detalle}
      onPress={() => abrirConRespaldo(e.app ?? e.web, e.web)}
    />
  );

  return (
    <Screen>
      <Card>
        <Title>☁️ Nubes</Title>
        <Muted>
          Para traer archivos de cualquier nube a la app, usá "Importar" en Mis archivos: el selector del teléfono muestra
          Drive, Dropbox, OneDrive e iCloud si tenés esas apps. Para guardar en la nube, usá "Compartir" sobre un archivo.
        </Muted>
        <Button variant="soft" icon="📁" title="Ir a Mis archivos" onPress={() => router.push('/archivos')} />
        {NUBES.map(item)}
      </Card>
      <Card>
        <Title>📝 Textos, tablas y presentaciones</Title>
        <Muted>Abre la app instalada o, si no está, la versión web.</Muted>
        {OFIMATICA.map(item)}
      </Card>
    </Screen>
  );
}
