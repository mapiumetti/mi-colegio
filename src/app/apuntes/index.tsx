import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, Chips, Dot, ListItem, Muted, Screen } from '../../components/ui';
import { useData } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Apuntes() {
  const params = useLocalSearchParams<{ materia?: string }>();
  const { data } = useData();
  const [filtro, setFiltro] = useState<string>(params.materia ?? '');
  const lista = data.apuntes
    .filter((a) => !filtro || (filtro === 'sin' ? !a.subjectId : a.subjectId === filtro))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const materia = (id?: string) => data.subjects.find((m) => m.id === id);

  return (
    <Screen>
      <Button icon="✏️" title="Nuevo apunte" onPress={() => router.push({ pathname: '/apuntes/[id]', params: { id: 'nuevo', materia: filtro && filtro !== 'sin' ? filtro : '' } })} />
      <Chips
        options={[{ value: '', label: 'Todos' }, ...data.subjects.map((m) => ({ value: m.id, label: m.nombre, color: m.color })), { value: 'sin', label: 'Sin materia' }]}
        value={filtro}
        onChange={setFiltro}
      />
      <Card>
        {lista.length === 0 && <Muted>No hay apuntes todavía.</Muted>}
        {lista.map((a) => (
          <ListItem
            key={a.id}
            left={<Dot color={materia(a.subjectId)?.color ?? colors.muted} />}
            title={a.titulo || 'Sin título'}
            subtitle={`${materia(a.subjectId)?.nombre ?? 'Sin materia'} · ${new Date(a.fecha).toLocaleDateString('es-AR')}`}
            right={<Text style={{ color: colors.muted }} numberOfLines={1}>›</Text>}
            onPress={() => router.push({ pathname: '/apuntes/[id]', params: { id: a.id } })}
          />
        ))}
      </Card>
    </Screen>
  );
}
