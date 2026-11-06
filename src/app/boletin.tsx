import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ConfigBoletin } from '../components/boletin';
import { Button, Card, Muted, NotaBadge, Row, Screen, Title } from '../components/ui';
import { SISTEMAS, concepto, resumenMateria } from '../lib/grades';
import { enviarWhatsApp } from '../lib/share';
import { useData } from '../lib/store';
import { colors } from '../lib/theme';

const COL = { materia: 130, nota: 86, estado: 92 };

export default function Boletin() {
  const { data } = useData();
  const cfg = data.settings.boletin;
  const [editar, setEditar] = useState(false);
  const filas = data.subjects.map((m) => ({ m, r: resumenMateria(data.grades.filter((g) => g.subjectId === m.id), cfg) }));

  const celda = (n: number | null) => {
    const c = concepto(cfg.sistema, n);
    return <NotaBadge nota={n} texto={n == null ? '—' : c ? c.sigla : n.toFixed(1).replace('.', ',')} />;
  };

  const texto = () =>
    [
      `📋 Boletín ${data.profile.nombre ? `de ${data.profile.nombre} ` : ''}${data.school.nombre ? `· ${data.school.nombre}` : ''}`,
      `Sistema: ${SISTEMAS[cfg.sistema].nombre}`,
      '',
      ...filas.map(({ m, r }) => {
        const f = (n: number | null) => (n == null ? '—' : `${n.toFixed(1).replace('.', ',')}${concepto(cfg.sistema, n) ? ` ${concepto(cfg.sistema, n)!.sigla}` : ''}`);
        return `${m.nombre}: 1°C ${f(r.c1)} | 2°C ${f(r.c2)} | Final ${f(r.final)}${r.aprobada === true ? ' ✅' : r.aprobada === false ? ' ❌' : ''}`;
      }),
    ].join('\n');

  if (editar || !cfg.configurado) return <Screen><ConfigBoletin alTerminar={() => setEditar(false)} /></Screen>;

  return (
    <Screen>
      <Card>
        <Title>{SISTEMAS[cfg.sistema].nombre}</Title>
        <Muted>
          {cfg.cuatrimestres === 'promedian' ? 'Los cuatrimestres se promedian.' : 'Cada cuatrimestre se aprueba por separado.'} Aprobación: {String(cfg.notaAprobacion).replace('.', ',')}
        </Muted>
        <Row>
          <Button variant="soft" title="Cambiar sistema" onPress={() => setEditar(true)} />
          <Button variant="soft" icon="💬" title="Compartir" onPress={() => enviarWhatsApp(texto())} />
        </Row>
      </Card>
      <Card>
        <ScrollView horizontal>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              {['Materia', '1° cuatr.', '2° cuatr.', 'Final', 'Estado'].map((h, i) => (
                <Text key={h} style={{ width: i === 0 ? COL.materia : i === 4 ? COL.estado : COL.nota, color: colors.muted, fontWeight: '700' }}>{h}</Text>
              ))}
            </View>
            {filas.map(({ m, r }) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ width: COL.materia, color: colors.text, fontWeight: '600' }} numberOfLines={2}>{m.nombre}</Text>
                <View style={{ width: COL.nota }}>{celda(r.c1)}</View>
                <View style={{ width: COL.nota }}>{celda(r.c2)}</View>
                <View style={{ width: COL.nota }}>{celda(r.final)}</View>
                <Text style={{ width: COL.estado, fontWeight: '700', color: r.aprobada === true ? colors.success : r.aprobada === false ? colors.danger : colors.muted }}>
                  {r.aprobada === true ? 'Aprobada' : r.aprobada === false ? 'A recuperar' : 'En curso'}
                </Text>
              </View>
            ))}
            {filas.length === 0 && <Muted>Todavía no hay materias.</Muted>}
          </View>
        </ScrollView>
      </Card>
      {SISTEMAS[cfg.sistema].escala.length > 0 && (
        <Card>
          <Title>Referencias</Title>
          {SISTEMAS[cfg.sistema].escala.map((e) => (
            <Text key={e.sigla} style={{ color: colors.text }}>
              <Text style={{ fontWeight: '800' }}>{e.sigla}</Text> {e.nombre}: <Text style={{ color: colors.muted }}>{e.detalle}</Text>
            </Text>
          ))}
        </Card>
      )}
    </Screen>
  );
}
