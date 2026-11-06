import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Card, Chips, DateField, Field, ListItem, Muted, Screen, Title } from '../../components/ui';
import { uid, useData } from '../../lib/store';
import { ESTADO, TIPO_NOTA, promedio } from '../../lib/grades';
import type { Grade, GradeEstado, GradeTipo } from '../../lib/types';

export default function MateriaDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, update } = useData();
  const materia = data.subjects.find((m) => m.id === id);
  const notas = data.grades.filter((g) => g.subjectId === id).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const [tipo, setTipo] = useState<GradeTipo>('examen');
  const [titulo, setTitulo] = useState('');
  const [nota, setNota] = useState('');
  const [estado, setEstado] = useState<GradeEstado>('pendiente');
  const [fecha, setFecha] = useState(new Date());

  if (!materia) return <Screen><Muted>Materia no encontrada.</Muted></Screen>;

  const agregar = () => {
    const valor = nota.trim() ? parseFloat(nota.replace(',', '.')) : null;
    const g: Grade = {
      id: uid(), subjectId: materia.id, tipo, titulo: titulo.trim() || TIPO_NOTA[tipo],
      fecha: fecha.toISOString(), nota: valor != null && !isNaN(valor) ? valor : null,
      estado: valor != null && !isNaN(valor) ? 'calificado' : estado,
    };
    update((d) => ({ ...d, grades: [...d.grades, g] }));
    setTitulo(''); setNota('');
  };

  const cambiarEstado = (g: Grade) => {
    const orden: GradeEstado[] = ['pendiente', 'entregado', 'calificado'];
    const sig = orden[(orden.indexOf(g.estado) + 1) % orden.length];
    update((d) => ({ ...d, grades: d.grades.map((x) => (x.id === g.id ? { ...x, estado: sig } : x)) }));
  };

  const borrar = (g: Grade) =>
    Alert.alert('Borrar', `¿Borrar "${g.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => update((d) => ({ ...d, grades: d.grades.filter((x) => x.id !== g.id) })) },
    ]);

  const prom = promedio(notas);

  return (
    <Screen>
      <Stack.Screen options={{ title: materia.nombre }} />
      <Card style={{ borderLeftWidth: 6, borderLeftColor: materia.color }}>
        <Title>{materia.nombre}</Title>
        <Muted>{[materia.profesor, materia.aula].filter(Boolean).join(' · ')}</Muted>
        <Text style={{ fontSize: 28, fontWeight: '800', color: materia.color }}>Promedio: {prom != null ? prom.toFixed(2) : '—'}</Text>
      </Card>

      <Card>
        <Title>Cargar nota o tarea</Title>
        <Chips options={(Object.keys(TIPO_NOTA) as GradeTipo[]).map((t) => ({ value: t, label: TIPO_NOTA[t] }))} value={tipo} onChange={setTipo} />
        <Field label="Título" placeholder="Parcial 1, TP 3..." value={titulo} onChangeText={setTitulo} />
        <DateField label="Fecha" mode="date" value={fecha} onChange={setFecha} />
        <Field label="Nota (dejar vacío si todavía no hay)" keyboardType="decimal-pad" placeholder="8,5" value={nota} onChangeText={setNota} />
        {!nota.trim() && (
          <Chips
            options={(['pendiente', 'entregado'] as GradeEstado[]).map((e) => ({ value: e, label: ESTADO[e].label, color: ESTADO[e].color }))}
            value={estado}
            onChange={setEstado}
          />
        )}
        <Button title="Guardar" onPress={agregar} />
      </Card>

      <Card>
        <Title>Historial</Title>
        {notas.length === 0 && <Muted>Sin notas todavía.</Muted>}
        {notas.map((g) => (
          <ListItem
            key={g.id}
            title={`${g.titulo}${g.nota != null ? ` — ${g.nota}` : ''}`}
            subtitle={`${TIPO_NOTA[g.tipo]} · ${new Date(g.fecha).toLocaleDateString('es-AR')}`}
            right={<Text style={{ color: ESTADO[g.estado].color, fontWeight: '700' }}>{ESTADO[g.estado].label}</Text>}
            onPress={() => cambiarEstado(g)}
            onLongPress={() => borrar(g)}
          />
        ))}
        {notas.length > 0 && <Muted>Tocá una tarea para cambiar su estado; mantené presionado para borrar.</Muted>}
      </Card>
    </Screen>
  );
}
