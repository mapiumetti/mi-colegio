import { router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Dot, ListItem, Muted, Screen, Title } from '../../components/ui';
import { ESTADO, TIPO_NOTA, promedio } from '../../lib/grades';
import { useData } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Notas() {
  const { data } = useData();
  const pendientes = data.grades.filter((g) => g.estado === 'pendiente').sort((a, b) => a.fecha.localeCompare(b.fecha));
  const materia = (id: string) => data.subjects.find((m) => m.id === id);

  return (
    <Screen>
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

      <Card>
        <Title>Promedios por materia</Title>
        {data.subjects.length === 0 && (
          <>
            <Muted>Cargá tus materias para registrar notas de exámenes, trabajos prácticos y entregas.</Muted>
            <Button title="Cargar materias" onPress={() => router.push('/materias')} />
          </>
        )}
        {data.subjects.map((m) => {
          const notas = data.grades.filter((g) => g.subjectId === m.id);
          const p = promedio(notas);
          return (
            <ListItem
              key={m.id}
              left={<Dot color={m.color} />}
              title={m.nombre}
              subtitle={`${notas.length} registro(s)`}
              right={<Text style={{ fontSize: 20, fontWeight: '800', color: p == null ? colors.muted : p >= 6 ? colors.success : colors.danger }}>{p != null ? p.toFixed(1) : '—'}</Text>}
              onPress={() => router.push({ pathname: '/materia/[id]', params: { id: m.id } })}
            />
          );
        })}
      </Card>
    </Screen>
  );
}
