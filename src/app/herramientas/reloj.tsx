import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Text, Vibration, View } from 'react-native';
import { Button, Card, Chips, DateField, Field, ListItem, Muted, NumField, Row, Screen, Title } from '../../components/ui';
import { avisarEn } from '../../lib/notifications';
import { colors } from '../../lib/theme';
import { DIAS_LARGO } from '../../lib/time';

type Vista = 'hora' | 'crono' | 'regresiva' | 'alarma';

const dos = (n: number) => String(Math.floor(n)).padStart(2, '0');
/** 3725400 ms → "01:02:05,4" */
function formatoMs(ms: number, decimas = true) {
  const t = Math.max(0, ms);
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  return `${h ? `${dos(h)}:` : ''}${dos(m)}:${dos(s)}${decimas ? `,${Math.floor((t % 1000) / 100)}` : ''}`;
}

/** Abre una pantalla del reloj del teléfono (solo Android). */
async function relojDelSistema(accion: string, extra?: Record<string, string | number | boolean>) {
  if (Platform.OS !== 'android') {
    Alert.alert('Reloj del iPhone', 'Abrí la app Reloj del iPhone para usar alarmas y temporizadores del sistema.');
    return;
  }
  try {
    await IntentLauncher.startActivityAsync(accion, extra ? { extra } : undefined);
  } catch {
    Alert.alert('No disponible', 'No se encontró la app de reloj del teléfono.');
  }
}

export default function Reloj() {
  const [vista, setVista] = useState<Vista>('hora');
  const [ahora, setAhora] = useState(Date.now());

  // ---------- Cronómetro ----------
  const [inicio, setInicio] = useState<number | null>(null); // momento en que arrancó (si está corriendo)
  const [acumulado, setAcumulado] = useState(0);
  const [vueltas, setVueltas] = useState<number[]>([]);
  const transcurrido = acumulado + (inicio ? ahora - inicio : 0);

  // ---------- Regresiva ----------
  const [min, setMin] = useState(25);
  const [seg, setSeg] = useState(0);
  const [fin, setFin] = useState<number | null>(null);
  const aviso = useRef<string | null>(null);
  const restante = fin ? fin - ahora : (min * 60 + seg) * 1000;

  // ---------- Alarma ----------
  const [hora, setHora] = useState(() => { const d = new Date(); d.setHours(7, 0, 0, 0); return d; });
  const [etiqueta, setEtiqueta] = useState('');

  const rapido = vista === 'crono' && !!inicio;
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), rapido ? 100 : 500);
    return () => clearInterval(id);
  }, [rapido]);

  // Fin de la cuenta regresiva con la app abierta.
  useEffect(() => {
    if (fin && ahora >= fin) {
      setFin(null);
      aviso.current = null;
      Vibration.vibrate([0, 500, 300, 500, 300, 500]);
      Alert.alert('⏰ ¡Tiempo!', 'Terminó la cuenta regresiva.');
    }
  }, [ahora, fin]);

  const iniciarRegresiva = async () => {
    const total = min * 60 + seg;
    if (total <= 0) return Alert.alert('Elegí un tiempo', 'Cargá los minutos o segundos.');
    setFin(Date.now() + total * 1000);
    // Aviso con sonido aunque la app esté cerrada o en segundo plano.
    try { aviso.current = await avisarEn(total, '⏰ ¡Tiempo!', 'Terminó la cuenta regresiva de Mi Colegio.'); } catch { /* sin permiso */ }
  };
  const cancelarRegresiva = () => {
    setFin(null);
    if (aviso.current) Notifications.cancelScheduledNotificationAsync(aviso.current).catch(() => {});
    aviso.current = null;
  };

  const fecha = new Date(ahora);

  return (
    <Screen>
      <Chips
        options={[
          { value: 'hora', label: '🕒 Hora' },
          { value: 'crono', label: '⏱️ Cronómetro' },
          { value: 'regresiva', label: '⏳ Regresiva' },
          { value: 'alarma', label: '⏰ Alarma' },
        ]}
        value={vista}
        onChange={(v) => setVista(v as Vista)}
      />

      {vista === 'hora' && (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontSize: 64, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }}>
            {dos(fecha.getHours())}:{dos(fecha.getMinutes())}
            <Text style={{ fontSize: 32, color: colors.muted }}>:{dos(fecha.getSeconds())}</Text>
          </Text>
          <Muted>{DIAS_LARGO[fecha.getDay()]} {fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</Muted>
        </Card>
      )}

      {vista === 'crono' && (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 56, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }}>{formatoMs(transcurrido)}</Text>
          </Card>
          <Row style={{ justifyContent: 'center' }}>
            {inicio ? (
              <>
                <Button title="⏸ Pausar" onPress={() => { setAcumulado(transcurrido); setInicio(null); }} />
                <Button variant="soft" title="🏁 Vuelta" onPress={() => setVueltas((v) => [transcurrido, ...v])} />
              </>
            ) : (
              <>
                <Button title={transcurrido ? '▶️ Seguir' : '▶️ Iniciar'} onPress={() => { setAhora(Date.now()); setInicio(Date.now()); }} />
                {transcurrido > 0 && <Button variant="soft" title="↺ Reiniciar" onPress={() => { setAcumulado(0); setVueltas([]); }} />}
              </>
            )}
          </Row>
          {vueltas.length > 0 && (
            <Card>
              {vueltas.map((v, i) => (
                <ListItem key={i} title={`Vuelta ${vueltas.length - i}`} right={<Text style={{ color: colors.text, fontVariant: ['tabular-nums'] }}>{formatoMs(v)}</Text>} subtitle={`+${formatoMs(v - (vueltas[i + 1] ?? 0))}`} />
              ))}
            </Card>
          )}
        </>
      )}

      {vista === 'regresiva' && (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 56, fontWeight: '800', color: fin && restante < 10000 ? colors.danger : colors.text, fontVariant: ['tabular-nums'] }}>
              {formatoMs(restante, false)}
            </Text>
            {fin && <Muted>Termina a las {new Date(fin).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}. Te aviso aunque cierres la app.</Muted>}
          </Card>
          {!fin ? (
            <Card>
              <Chips options={[1, 5, 10, 15, 25, 40, 60].map((m) => ({ value: m, label: `${m} min` }))} value={seg === 0 ? min : -1} onChange={(m) => { setMin(m); setSeg(0); }} />
              <Row style={{ flexWrap: 'nowrap' }}>
                <View style={{ flex: 1 }}><NumField label="Minutos" value={min} onChange={setMin} /></View>
                <View style={{ flex: 1 }}><NumField label="Segundos" value={seg} onChange={(n) => setSeg(Math.min(59, n))} /></View>
              </Row>
              <Button icon="▶️" title="Iniciar" onPress={iniciarRegresiva} />
              <Button variant="soft" icon="📱" title="Usar el temporizador del teléfono" onPress={() => relojDelSistema('android.intent.action.SET_TIMER', { 'android.intent.extra.alarm.LENGTH': min * 60 + seg, 'android.intent.extra.alarm.SKIP_UI': false })} />
            </Card>
          ) : (
            <Button variant="danger" title="⏹ Cancelar" onPress={cancelarRegresiva} />
          )}
        </>
      )}

      {vista === 'alarma' && (
        <Card>
          <Title>⏰ Nueva alarma</Title>
          <Muted>La alarma se crea en el reloj del teléfono, así suena aunque la app esté cerrada o el celular en silencio.</Muted>
          <DateField label="Hora" mode="time" value={hora} onChange={setHora} />
          <Field label="Nombre (opcional)" placeholder="Levantarme, examen de Historia..." value={etiqueta} onChangeText={setEtiqueta} />
          <Button
            icon="⏰"
            title="Crear alarma"
            onPress={() =>
              relojDelSistema('android.intent.action.SET_ALARM', {
                'android.intent.extra.alarm.HOUR': hora.getHours(),
                'android.intent.extra.alarm.MINUTES': hora.getMinutes(),
                'android.intent.extra.alarm.MESSAGE': etiqueta.trim() || 'Mi Colegio',
                'android.intent.extra.alarm.SKIP_UI': false,
              })
            }
          />
          <Button variant="soft" icon="📱" title="Ver mis alarmas (reloj del teléfono)" onPress={() => relojDelSistema('android.intent.action.SHOW_ALARMS')} />
        </Card>
      )}
    </Screen>
  );
}
