import * as IntentLauncher from 'expo-intent-launcher';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Platform, Text, View } from 'react-native';
import * as Concentracion from '../../modules/concentracion';
import { Button, Card, Muted, Screen, Title } from '../components/ui';
import { colors } from '../lib/theme';

/** Modo concentración: activa el "No molestar" del teléfono (silencia notificaciones y sonidos). */
export default function ModoConcentracion() {
  const [permiso, setPermiso] = useState(Concentracion.tienePermiso());
  const [activo, setActivo] = useState(Concentracion.estaActivo());

  const refrescar = useCallback(() => {
    setPermiso(Concentracion.tienePermiso());
    setActivo(Concentracion.estaActivo());
  }, []);
  useFocusEffect(refrescar);
  // Al volver de la pantalla de permisos de Android, se vuelve a revisar.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refrescar());
    return () => sub.remove();
  }, [refrescar]);

  const abrirAjustes = async () => {
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync('android.settings.ZEN_MODE_SETTINGS');
        return;
      } catch {}
    }
    await Linking.openSettings();
  };

  const activar = (total: boolean) => {
    if (!permiso) return Concentracion.pedirPermiso();
    if (!Concentracion.activar(total)) return Alert.alert('No se pudo', 'Probá activarlo desde los ajustes del teléfono.');
    refrescar();
  };

  const desactivar = () => {
    Concentracion.desactivar();
    refrescar();
  };

  if (!Concentracion.disponible) {
    return (
      <Screen>
        <Card>
          <Title>🎧 Modo concentración</Title>
          <Muted>
            {Platform.OS === 'ios'
              ? 'En iPhone, Apple no deja que una app active "No molestar". Abrí el Centro de control (deslizá desde arriba a la derecha) → Concentración → No molestar.'
              : 'Esta versión no puede controlar "No molestar". Podés activarlo desde los ajustes del teléfono.'}
          </Muted>
          <Button icon="⚙️" title="Abrir ajustes" onPress={abrirAjustes} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ alignItems: 'center', backgroundColor: activo ? colors.primary : colors.card }}>
        <Text style={{ fontSize: 64 }}>{activo ? '🎧' : '🔔'}</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: activo ? colors.onPrimary : colors.text }}>
          {activo ? 'Concentración activada' : 'Concentración desactivada'}
        </Text>
        <Text style={{ color: activo ? colors.onPrimary : colors.muted, textAlign: 'center' }}>
          {activo ? 'El teléfono no va a sonar ni mostrar notificaciones.' : 'Las notificaciones y sonidos funcionan normalmente.'}
        </Text>
      </Card>

      {!permiso ? (
        <Card>
          <Title>Falta un permiso</Title>
          <Muted>
            Para poder silenciar el teléfono, Android pide que le des a Mi Colegio el permiso "Acceso a No molestar". Tocá el botón,
            buscá Mi Colegio en la lista, activalo y volvé a la app.
          </Muted>
          <Button icon="🔓" title="Dar permiso" onPress={() => Concentracion.pedirPermiso()} />
        </Card>
      ) : activo ? (
        <Button icon="🔔" title="Desactivar concentración" onPress={desactivar} />
      ) : (
        <View style={{ gap: 10 }}>
          <Button icon="🎧" title="Silenciar todo" onPress={() => activar(true)} />
          <Button variant="soft" icon="⭐" title="Solo prioritarias (alarmas y contactos favoritos)" onPress={() => activar(false)} />
        </View>
      )}

      <Card>
        <Muted>
          Es el mismo "No molestar" de Android: también lo podés apagar desde la barra de notificaciones. Para elegir qué contactos o
          alarmas pueden sonar igual, usá los ajustes del teléfono.
        </Muted>
        <Button variant="soft" icon="⚙️" title='Ajustes de "No molestar"' onPress={abrirAjustes} />
      </Card>
    </Screen>
  );
}
