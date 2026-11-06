import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { Fragment, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { prepararNotificaciones } from '../lib/notifications';
import { DataProvider, useData } from '../lib/store';
import { aplicarTema, colors, PALETAS, type PaletaId } from '../lib/theme';

function App() {
  const { data, ready } = useData();
  const sistema = useColorScheme();
  const { modo, paleta } = data.settings;
  const oscuro = modo === 'oscuro' || (modo === 'sistema' && sistema === 'dark');
  const pal = (paleta in PALETAS ? paleta : 'azul') as PaletaId;
  aplicarTema(oscuro, pal);
  const claveTema = `${oscuro}-${pal}`;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [claveTema]);

  if (!ready) return null;

  // Al cambiar el tema se vuelve a dibujar toda la app con los colores nuevos.
  return (
    <Fragment key={claveTema}>
      <StatusBar style={oscuro ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: 'Volver',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="perfil" options={{ title: 'Mis datos' }} />
        <Stack.Screen name="colegio" options={{ title: 'Mi colegio' }} />
        <Stack.Screen name="materias" options={{ title: 'Materias' }} />
        <Stack.Screen name="materia/[id]" options={{ title: 'Materia' }} />
        <Stack.Screen name="configurar-horario" options={{ title: 'Turnos y horarios' }} />
        <Stack.Screen name="evento" options={{ title: 'Evento', presentation: 'modal' }} />
        <Stack.Screen name="archivos" options={{ title: 'Mis archivos' }} />
        <Stack.Screen name="grabadora" options={{ title: 'Grabadora de voz' }} />
        <Stack.Screen name="contactos" options={{ title: 'Contactos' }} />
        <Stack.Screen name="ia" options={{ title: 'Asistente IA' }} />
        <Stack.Screen name="calculadora" options={{ title: 'Calculadora' }} />
        <Stack.Screen name="nubes" options={{ title: 'Nubes y documentos' }} />
        <Stack.Screen name="feriados" options={{ title: 'Feriados y calendario escolar' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Apariencia y copias de seguridad' }} />
        <Stack.Screen name="boletin" options={{ title: 'Boletín' }} />
        <Stack.Screen name="asistencia" options={{ title: 'Asistencia y conducta' }} />
        <Stack.Screen name="concentracion" options={{ title: 'Modo concentración' }} />
        <Stack.Screen name="herramientas/index" options={{ title: 'Herramientas' }} />
        <Stack.Screen name="herramientas/conversor" options={{ title: 'Conversor de unidades' }} />
        <Stack.Screen name="herramientas/tabla-periodica" options={{ title: 'Tabla periódica' }} />
        <Stack.Screen name="herramientas/fisica" options={{ title: 'Fórmulas de física' }} />
        <Stack.Screen name="apuntes/index" options={{ title: 'Apuntes' }} />
        <Stack.Screen name="apuntes/[id]" options={{ title: 'Apunte' }} />
      </Stack>
    </Fragment>
  );
}

export default function RootLayout() {
  useEffect(() => {
    prepararNotificaciones().catch(() => {});
  }, []);

  return (
    <DataProvider>
      <App />
    </DataProvider>
  );
}
