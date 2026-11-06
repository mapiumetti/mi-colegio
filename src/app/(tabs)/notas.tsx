import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { ConfigBoletin } from '../../components/boletin';
import { Button, Card, Dot, ListItem, Muted, NotaBadge, Row, Screen, Title } from '../../components/ui';
import { ESTADO, TIPO_NOTA, concepto, resumenMateria } from '../../lib/grades';
import { useData } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Notas() {
  const { data } = useData();
  const cfg = data.settings.boletin;
  const pendientes = data.grades.filter((g) => g.estado === 'pendiente').sort((a, b) => a.fecha.localeCompare(b.fecha));
  const materia = (id: string) => data.subjects.find((m) => m.id === id);

  return (
    <Screen>
      {!cfg.configurado && <ConfigBoletin />}

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Title>Promedios por materia</Title>
          <Button variant="soft" icon="📋" title="Boletín" onPress={() => router.push('/boletin')} />
        </Row>
        {data.subjects.length === 0 && (
          <>
            <Muted>Cargá tus materias para registrar notas de exámenes, trabajos prácticos y entregas.</Muted>
            <Button title="Cargar materias" onPress={() => router.push('/materias')} />
          </>
        )}
        {data.subjects.map((m) => {
          const notas = data.grades.filter((g) => g.subjectId === m.id);
          const r = resumenMateria(notas, cfg);
          const c = concepto(cfg.sistema, r.final);
          return (
            <ListItem
              key={m.id}
              left={<Dot color={m.color} />}
              title={m.nombre}
              subtitle={[
                `${notas.length} registro(s)`,
                r.pendientes ? `${r.pendientes} pendiente(s)` : '',
                c ? c.nombre : '',
              ].filter(Boolean).join(' · ')}
              right={<NotaBadge nota={r.final} texto={r.final == null ? '—' : c ? `${r.final.toFixed(1).replace('.', ',')} ${c.sigla}` : undefined} />}
              onPress={() => router.push({ pathname: '/materia/[id]', params: { id: m.id } })}
            />
          );
        })}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <NotaBadge nota={9.5} texto="9 a 10" />
          <NotaBadge nota={8} texto="7 a 8,99" />
          <NotaBadge nota={5} texto="4 a 6,99" />
          <NotaBadge nota={2} texto="menos de 4" />
        </View>
      </Card>

      {pendientes.length > 0 && (
        <Card style={{ borderLeftWidth: 6, borderLeftColor: colors.warning }}>
          <Title>⚠️ Pendientes de entregar</Title>
          {pendientes.map((g) => (
            <ListItem
              key={g.id}
              left={<Dot color={materia(g.subjectId)?.color ?? colors.muted} />}
              title={g.titulo}
              subtitle={`${materia(g.subjectId)?.nombre ?? ''} · ${TIPO_NOTA[g.tipo]} · ${new Date(g.fecha).toLocaleDateString('es-AR')}`}
              right={<Text style={{ color: ESTADO.pendiente.color, fontWeight: '700' }}>Pendiente</Text>}
              onPress={() => router.push({ pathname: '/materia/[id]', params: { id: g.subjectId } })}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
