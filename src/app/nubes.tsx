import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text } from 'react-native';
import { Button, Card, ListItem, Muted, Row, Screen, Title } from '../components/ui';
import { APPS, abrirApp, type AppExterna } from '../lib/apps';
import {
  NUBES, bajar, conectar, desconectar, estaConectada, listar, nubeConfigurada, subir,
  type ArchivoNube, type NubeId,
} from '../lib/cloud';
import { subcarpeta } from '../lib/files';
import { colors } from '../lib/theme';

type Enlace = { icon: string; nombre: string; app: AppExterna; detalle?: string };

const ACCESOS_NUBE: Enlace[] = [
  { icon: '🟢', nombre: 'Google Drive', app: APPS.gdrive },
  { icon: '🔷', nombre: 'Dropbox', app: APPS.dropbox },
  { icon: '☁️', nombre: 'OneDrive', app: APPS.onedrive },
  { icon: '🍏', nombre: Platform.OS === 'ios' ? 'iCloud Drive (Archivos)' : 'iCloud Drive (web)', app: APPS.icloud },
];

const OFIMATICA: Enlace[] = [
  { icon: '📘', nombre: 'Word', app: APPS.word, detalle: 'Microsoft 365' },
  { icon: '📗', nombre: 'Excel', app: APPS.excel, detalle: 'Microsoft 365' },
  { icon: '📙', nombre: 'PowerPoint', app: APPS.powerpoint, detalle: 'Microsoft 365' },
  { icon: '📄', nombre: 'Documentos de Google', app: APPS.gdocs, detalle: 'Gratis' },
  { icon: '📊', nombre: 'Hojas de cálculo de Google', app: APPS.gsheets, detalle: 'Gratis' },
  { icon: '📽️', nombre: 'Presentaciones de Google', app: APPS.gslides, detalle: 'Gratis' },
  { icon: '🆓', nombre: 'Collabora Office (LibreOffice)', app: APPS.collabora, detalle: 'Suite libre' },
];

export default function Nubes() {
  const [conectadas, setConectadas] = useState<NubeId[]>([]);
  const [abierta, setAbierta] = useState<NubeId | null>(null);
  const [archivos, setArchivos] = useState<ArchivoNube[]>([]);
  const [cargando, setCargando] = useState(false);

  const refrescar = useCallback(async () => {
    const ids = Object.keys(NUBES) as NubeId[];
    const ok = await Promise.all(ids.map((i) => estaConectada(i)));
    setConectadas(ids.filter((_, k) => ok[k]));
  }, []);
  useEffect(() => { refrescar(); }, [refrescar]);

  const conTrabajo = async (fn: () => Promise<void>) => {
    setCargando(true);
    try { await fn(); } catch (e) { Alert.alert('No se pudo', e instanceof Error ? e.message : String(e)); } finally { setCargando(false); }
  };

  const verArchivos = (n: NubeId) => conTrabajo(async () => { setAbierta(n); setArchivos(await listar(n)); });

  const subirArchivos = (n: NubeId) => conTrabajo(async () => {
    const r = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (r.canceled) return;
    for (const a of r.assets) await subir(n, new File(a.uri), a.name);
    setArchivos(await listar(n));
    Alert.alert('Listo', `Se subieron ${r.assets.length} archivo(s) a ${NUBES[n].nombre}.`);
  });

  const descargar = (n: NubeId, a: ArchivoNube) => conTrabajo(async () => {
    await bajar(n, a, subcarpeta('Descargas'));
    Alert.alert('Descargado', `${a.nombre} está en Mis archivos → Descargas.`);
  });

  return (
    <Screen>
      <Card>
        <Title>🔗 Conectar mis nubes</Title>
        <Muted>Conectá tu cuenta para subir y bajar archivos y copias de seguridad sin salir de la app.</Muted>
        {(Object.keys(NUBES) as NubeId[]).map((n) => {
          const ok = conectadas.includes(n);
          const config = nubeConfigurada(n);
          return (
            <Card key={n} style={{ padding: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{NUBES[n].icono} {NUBES[n].nombre}</Text>
                <Text style={{ color: ok ? colors.success : colors.muted, fontWeight: '600' }}>
                  {ok ? 'Conectada' : config ? 'Sin conectar' : 'Pendiente de configurar'}
                </Text>
              </Row>
              {ok ? (
                <Row>
                  <Button variant="soft" title="Ver archivos" onPress={() => verArchivos(n)} />
                  <Button variant="soft" title="Subir" onPress={() => subirArchivos(n)} />
                  <Button variant="danger" title="Desconectar" onPress={async () => { await desconectar(n); refrescar(); if (abierta === n) setAbierta(null); }} />
                </Row>
              ) : config ? (
                <Button title="Conectar" onPress={() => conTrabajo(async () => { if (await conectar(n)) await refrescar(); })} />
              ) : (
                <Muted>Mientras tanto podés usar "Importar" en Mis archivos o "Compartir" sobre un archivo.</Muted>
              )}
            </Card>
          );
        })}
        {cargando && <ActivityIndicator color={colors.primary} />}
      </Card>

      {abierta && (
        <Card>
          <Title>{NUBES[abierta].icono} Archivos en {NUBES[abierta].nombre}</Title>
          {archivos.length === 0 && <Muted>La carpeta de Mi Colegio está vacía.</Muted>}
          {archivos.map((a) => (
            <ListItem
              key={a.id}
              left={<Text style={{ fontSize: 20 }}>📄</Text>}
              title={a.nombre}
              subtitle={[a.tamano ? `${Math.max(1, Math.round(a.tamano / 1024))} KB` : '', a.fecha ? new Date(a.fecha).toLocaleDateString('es-AR') : ''].filter(Boolean).join(' · ')}
              right={<Button variant="soft" title="Bajar" onPress={() => descargar(abierta, a)} />}
            />
          ))}
        </Card>
      )}

      <Card>
        <Title>☁️ Abrir apps de nube</Title>
        <Muted>Para traer cualquier archivo, usá "Importar" en Mis archivos: el selector del teléfono muestra todas las nubes instaladas.</Muted>
        <Button variant="soft" icon="📁" title="Ir a Mis archivos" onPress={() => router.push('/archivos')} />
        {ACCESOS_NUBE.map((e) => (
          <ListItem key={e.nombre} left={<Text style={{ fontSize: 24 }}>{e.icon}</Text>} title={e.nombre} onPress={() => abrirApp(e.app)} />
        ))}
      </Card>

      <Card>
        <Title>📝 Textos, tablas y presentaciones</Title>
        <Muted>Abre la app si está instalada; si no, la versión web.</Muted>
        {OFIMATICA.map((e) => (
          <ListItem key={e.nombre} left={<Text style={{ fontSize: 24 }}>{e.icon}</Text>} title={e.nombre} subtitle={e.detalle} onPress={() => abrirApp(e.app)} />
        ))}
      </Card>
    </Screen>
  );
}
