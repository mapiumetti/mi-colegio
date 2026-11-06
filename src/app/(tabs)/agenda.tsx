import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Chips, ListItem, Muted, Row, Screen, Title } from '../../components/ui';
import { ETIQUETA_FERIADO } from '../../lib/holidays';
import { TIPO_EVENTO } from '../../lib/notifications';
import { useData } from '../../lib/store';
import { colors } from '../../lib/theme';
import { DIAS, formatFecha, ymd } from '../../lib/time';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Agenda() {
  const { data } = useData();
  const [vista, setVista] = useState<'proximos' | 'mes'>('proximos');
  const [mes, setMes] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [diaSel, setDiaSel] = useState<string>(ymd(new Date()));
  const materia = (id?: string) => data.subjects.find((m) => m.id === id);
  const hoy = new Date();

  const eventosDe = (dia: string) => data.events.filter((e) => ymd(new Date(e.fecha)) === dia);
  const feriadoDe = (dia: string) => data.holidays.find((h) => h.fecha === dia);
  const cal = data.schoolCalendar;
  const enReceso = (dia: string) => !!cal.recesoInicio && !!cal.recesoFin && dia >= cal.recesoInicio && dia <= cal.recesoFin;

  const proximos = data.events.filter((e) => new Date(e.fecha) >= new Date(hoy.getTime() - 86400000)).sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Celdas del mes: arranca en lunes
  const primero = new Date(mes);
  const offset = (primero.getDay() + 6) % 7;
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => ymd(new Date(mes.getFullYear(), mes.getMonth(), i + 1)))];

  const renderEvento = (e: (typeof data.events)[number]) => (
    <ListItem
      key={e.id}
      left={<Text style={{ fontSize: 22 }}>{TIPO_EVENTO[e.tipo].emoji}</Text>}
      title={e.titulo}
      subtitle={[formatFecha(e.fecha), materia(e.subjectId)?.nombre, TIPO_EVENTO[e.tipo].label].filter(Boolean).join(' · ')}
      onPress={() => router.push({ pathname: '/evento', params: { id: e.id } })}
    />
  );

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Chips options={[{ value: 'proximos', label: 'Próximos' }, { value: 'mes', label: 'Mes' }]} value={vista} onChange={(v) => setVista(v as 'proximos' | 'mes')} />
        <Button title="+ Nuevo" onPress={() => router.push({ pathname: '/evento', params: { fecha: diaSel } })} />
      </Row>

      {vista === 'proximos' ? (
        <Card>
          <Title>Exámenes, entregas y más</Title>
          {proximos.length === 0 ? <Muted>No hay eventos próximos.</Muted> : proximos.map(renderEvento)}
        </Card>
      ) : (
        <>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Button variant="soft" title="‹" onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} />
              <Title>{MESES[mes.getMonth()]} {mes.getFullYear()}</Title>
              <Button variant="soft" title="›" onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} />
            </Row>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <Text key={d} style={{ width: '14.28%', textAlign: 'center', color: colors.muted, fontWeight: '600' }}>{DIAS[d]}</Text>
              ))}
              {celdas.map((c, i) => {
                if (!c) return <View key={`v${i}`} style={{ width: '14.28%', height: 44 }} />;
                const evs = eventosDe(c);
                const fer = feriadoDe(c);
                const sel = c === diaSel;
                return (
                  <Text
                    key={c}
                    onPress={() => setDiaSel(c)}
                    style={{
                      width: '14.28%', height: 44, textAlign: 'center', textAlignVertical: 'center', lineHeight: 40,
                      borderRadius: 10, overflow: 'hidden', fontWeight: sel ? '800' : '500',
                      backgroundColor: sel ? colors.primary : fer ? colors.highlight : enReceso(c) ? colors.recess : 'transparent',
                      color: sel ? colors.onPrimary : fer ? colors.highlightText : colors.text,
                    }}
                  >
                    {Number(c.slice(8))}{evs.length ? '•' : ''}
                  </Text>
                );
              })}
            </View>
            <Muted>🟧 Feriado / puente · 🟩 Receso escolar · • con eventos</Muted>
          </Card>
          <Card>
            <Title>{new Date(diaSel + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Title>
            {feriadoDe(diaSel) && <Text style={{ color: colors.highlightText, fontWeight: '700' }}>🎉 {feriadoDe(diaSel)!.nombre} · {ETIQUETA_FERIADO[feriadoDe(diaSel)!.tipo]}</Text>}
            {enReceso(diaSel) && <Text style={{ color: colors.success, fontWeight: '700' }}>🏖️ Receso escolar</Text>}
            {eventosDe(diaSel).length === 0 ? <Muted>Sin eventos.</Muted> : eventosDe(diaSel).map(renderEvento)}
          </Card>
        </>
      )}
      <Button variant="soft" icon="🇦🇷" title="Feriados y calendario escolar" onPress={() => router.push('/feriados')} />
    </Screen>
  );
}
