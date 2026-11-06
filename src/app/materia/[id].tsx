import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, Chips, DateField, Field, ListItem, Muted, NotaBadge, Row, Screen, Title } from '../../components/ui';
import { colors } from '../../lib/theme';
import { uid, useData } from '../../lib/store';
import { ESTADO, INSTANCIA, TIPO_NOTA, concepto, periodoDe, periodoDeFecha, resumenMateria } from '../../lib/grades';
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
  const [instancia, setInstancia] = useState<NonNullable<Grade['instancia']>>('regular');
  const [periodo, setPeriodo] = useState<1 | 2>(periodoDeFecha(new Date().toISOString()));
  const cfg = data.settings.boletin;

  if (!materia) return <Screen><Muted>Materia no encontrada.</Muted></Screen>;

  const agregar = () => {
    const valor = nota.trim() ? parseFloat(nota.replace(',', '.')) : null;
    const g: Grade = {
      id: uid(), subjectId: materia.id, tipo, titulo: titulo.trim() || TIPO_NOTA[tipo],
      fecha: fecha.toISOString(), nota: valor != null && !isNaN(valor) ? valor : null,
      estado: valor != null && !isNaN(valor) ? 'calificado' : estado,
      periodo,
      instancia,
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

  const r = resumenMateria(notas, cfg);
  const etiqueta = (n: number | null) => { const c = concepto(cfg.sistema, n); return n == null ? '—' : `${n.toFixed(2).replace('.', ',')}${c ? ` ${c.sigla}` : ''}`; };

  return (
    <Screen>
      <Stack.Screen options={{ title: materia.nombre }} />
      <Card style={{ borderLeftWidth: 6, borderLeftColor: materia.color }}>
        <Title>{materia.nombre}</Title>
        <Muted>{[materia.profesor, materia.aula].filter(Boolean).join(' · ')}</Muted>
        <Row style={{ justifyContent: 'space-between' }}>
          {([['1° cuatr.', r.c1], ['2° cuatr.', r.c2], ['Final', r.final], ...(r.recuperatorio != null ? [['Recup.', r.recuperatorio]] : [])] as [string, number | null][]).map(([l, n]) => (
            <View key={l} style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.muted, fontWeight: '600' }}>{l}</Text>
              <NotaBadge nota={n} texto={etiqueta(n)} grande={l === 'Final'} />
            </View>
          ))}
        </Row>
        {concepto(cfg.sistema, r.final) && <Muted>{concepto(cfg.sistema, r.final)!.nombre}</Muted>}
        {r.aprobada != null && (
          <Text style={{ fontWeight: '700', color: r.aprobada ? colors.success : colors.danger }}>{r.aprobada ? '✅ Aprobada' : '❌ A recuperar'}</Text>
        )}
        <Button variant="soft" icon="📝" title="Apuntes de esta materia" onPress={() => router.push({ pathname: '/apuntes', params: { materia: materia.id } })} />
      </Card>

      <Card>
        <Title>Cargar nota o tarea</Title>
        <Chips options={(Object.keys(TIPO_NOTA) as GradeTipo[]).map((t) => ({ value: t, label: TIPO_NOTA[t] }))} value={tipo} onChange={setTipo} />
        <Field label="Título" placeholder="Parcial 1, TP 3..." value={titulo} onChangeText={setTitulo} />
        <DateField label="Fecha" mode="date" value={fecha} onChange={(d) => { setFecha(d); setPeriodo(periodoDeFecha(d.toISOString())); }} />
        <Chips options={[{ value: 1, label: '1° cuatrimestre' }, { value: 2, label: '2° cuatrimestre' }]} value={periodo} onChange={(v) => setPeriodo(v as 1 | 2)} />
        <Muted>Instancia</Muted>
        <Chips options={(Object.keys(INSTANCIA) as (keyof typeof INSTANCIA)[]).map((k) => ({ value: k, label: INSTANCIA[k] }))} value={instancia} onChange={setInstancia} />
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
            title={g.titulo}
            subtitle={`${TIPO_NOTA[g.tipo]}${g.instancia && g.instancia !== 'regular' ? ` · ${INSTANCIA[g.instancia]}` : ''} · ${periodoDe(g)}° cuatr. · ${new Date(g.fecha).toLocaleDateString('es-AR')}`}
            right={g.nota != null ? <NotaBadge nota={g.nota} texto={String(g.nota).replace('.', ',')} /> : <Text style={{ color: ESTADO[g.estado].color, fontWeight: '700' }}>{ESTADO[g.estado].label}</Text>}
            onPress={() => cambiarEstado(g)}
            onLongPress={() => borrar(g)}
          />
        ))}
        {notas.length > 0 && <Muted>Tocá una tarea para cambiar su estado; mantené presionado para borrar.</Muted>}
      </Card>
    </Screen>
  );
}
