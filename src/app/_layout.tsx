import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { prepararNotificaciones } from '../lib/notifications';
import { DataProvider } from '../lib/store';
import { colors } from '../lib/theme';

export default function RootLayout() {
  useEffect(() => {
    prepararNotificaciones().catch(() => {});
  }, []);

  return (
    <DataProvider>
      <StatusBar style="dark" />
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
      </Stack>
    </DataProvider>
  );
}
