import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Text } from 'react-native';
import { Button, Card, Chips, DateField, ListItem, Muted, Row, Screen, Title } from '../components/ui';
import { ETIQUETA_FERIADO, FUENTE_CALENDARIO_ESCOLAR, FUENTE_FERIADOS, PROVINCIAS, descargarFeriados } from '../lib/holidays';
import { useData } from '../lib/store';
import { colors } from '../lib/theme';
import { formatYmd, ymd } from '../lib/time';
import type { SchoolCalendar } from '../lib/types';

const aFecha = (s: string) => (s ? new Date(`${s}T12:00`) : new Date());

export default function Feriados() {
  const { data, update } = useData();
  const [cargando, setCargando] = useState(false);
  const anio = new Date().getFullYear();
  const cal = data.schoolCalendar;
  const setCal = (patch: Partial<SchoolCalendar>) => update((d) => ({ ...d, schoolCalendar: { ...d.schoolCalendar, ...patch } }));

  const actualizar = async () => {
    setCargando(true);
    try {
      const lista = (await Promise.all([descargarFeriados(anio), descargarFeriados(anio + 1).catch(() => [])])).flat();
      update((d) => ({ ...d, holidays: lista, holidaysUpdated: new Date().toISOString() }));
    } catch (e) {
      Alert.alert('Sin conexión', e instanceof Error ? e.message : 'No se pudieron descargar los feriados.');
    } finally {
      setCargando(false);
    }
  };

  const hoy = ymd(new Date());
  const proximos = data.holidays.filter((h) => h.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <Screen>
      <Card>
        <Title>🇦🇷 Feriados nacionales y puentes</Title>
        <Muted>
          {data.holidaysUpdated
            ? `Actualizado el ${new Date(data.holidaysUpdated).toLocaleDateString('es-AR')}.`
            : 'Todavía no se descargaron los feriados.'}{' '}
          Se marcan en la Agenda y en Inicio.
        </Muted>
        <Row>
          <Button icon="🔄" title="Actualizar feriados" onPress={actualizar} disabled={cargando} />
          <Button variant="soft" title="Ver en argentina.gob.ar" onPress={() => Linking.openURL(FUENTE_FERIADOS)} />
        </Row>
        {cargando && <ActivityIndicator color={colors.primary} />}
        {proximos.map((h) => (
          <ListItem
            key={h.fecha + h.nombre}
            left={<Text style={{ fontSize: 20 }}>{h.tipo === 'puente' ? '🌉' : '🎉'}</Text>}
            title={h.nombre}
            subtitle={`${formatYmd(h.fecha)} · ${ETIQUETA_FERIADO[h.tipo]}`}
          />
        ))}
      </Card>

      <Card>
        <Title>🏫 Calendario escolar</Title>
        <Muted>
          Cada provincia fija su inicio y fin de clases y el receso invernal. Elegí tu jurisdicción y cargá las fechas
          que publica el Ministerio de Educación.
        </Muted>
        <Chips options={PROVINCIAS.map((p) => ({ value: p, label: p }))} value={cal.provincia} onChange={(p) => setCal({ provincia: p })} />
        <DateField label="Inicio de clases" mode="date" value={aFecha(cal.inicioClases)} onChange={(d) => setCal({ inicioClases: ymd(d) })} />
        <DateField label="Inicio del receso invernal" mode="date" value={aFecha(cal.recesoInicio)} onChange={(d) => setCal({ recesoInicio: ymd(d) })} />
        <DateField label="Fin del receso invernal" mode="date" value={aFecha(cal.recesoFin)} onChange={(d) => setCal({ recesoFin: ymd(d) })} />
        <DateField label="Fin de clases" mode="date" value={aFecha(cal.finClases)} onChange={(d) => setCal({ finClases: ymd(d) })} />
        <Button variant="soft" title="Ver calendario escolar oficial" onPress={() => Linking.openURL(FUENTE_CALENDARIO_ESCOLAR)} />
      </Card>
    </Screen>
  );
}
