import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, Chips, DateField, Field, ListItem, Muted, NotaBadge, Row, Screen, SwitchRow, Title } from '../../components/ui';
import { DIAS, DIAS_LARGO, dateToHHMM, hhmmToDate, toMin } from '../../lib/time';
import { colors } from '../../lib/theme';
import { uid, useData } from '../../lib/store';
import { ESTADO, INSTANCIA, TIPO_NOTA, textoPromediar, concepto, periodoDe, periodoDeFecha, resumenMateria } from '../../lib/grades';
import type { Grade, GradeEstado, GradeTipo, Subject } from '../../lib/types';

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
  const [editId, setEditId] = useState<string | null>(null);
  const [tDia, setTDia] = useState(1);
  const [tInicio, setTInicio] = useState('18:00');
  const [tFin, setTFin] = useState('19:30');

  if (!materia) return <Screen><Muted>Materia no encontrada.</Muted></Screen>;

  const setMateria = (patch: Partial<Subject>) =>
    update((d) => ({ ...d, subjects: d.subjects.map((m) => (m.id === materia.id ? { ...m, ...patch } : m)) }));
  const agregarHorario = () => {
    if (toMin(tFin) <= toMin(tInicio)) return Alert.alert('Revisá el horario', 'La hora de fin tiene que ser después del inicio.');
    setMateria({ horarios: [...(materia.horarios ?? []), { id: uid(), dia: tDia, inicio: tInicio, fin: tFin }].sort((a, b) => a.dia - b.dia || toMin(a.inicio) - toMin(b.inicio)) });
  };

  const limpiar = () => { setTitulo(''); setNota(''); setEstado('pendiente'); setInstancia('regular'); setEditId(null); };

  const agregar = () => {
    const valor = nota.trim() ? parseFloat(nota.replace(',', '.')) : null;
    const tieneNota = valor != null && !isNaN(valor);
    const g: Grade = {
      id: editId ?? uid(), subjectId: materia.id, tipo, titulo: titulo.trim() || TIPO_NOTA[tipo],
      fecha: fecha.toISOString(), nota: tieneNota ? valor : null,
      estado: tieneNota ? 'calificado' : estado,
      periodo,
      instancia,
    };
    update((d) => ({ ...d, grades: editId ? d.grades.map((x) => (x.id === editId ? g : x)) : [...d.grades, g] }));
    limpiar();
  };

  const editar = (g: Grade) => {
    setEditId(g.id);
    setTipo(g.tipo);
    setTitulo(g.titulo);
    setNota(g.nota != null ? String(g.nota).replace('.', ',') : '');
    setEstado(g.estado === 'calificado' ? 'entregado' : g.estado);
    setFecha(new Date(g.fecha));
    setPeriodo(periodoDe(g));
    setInstancia(g.instancia ?? 'regular');
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

  const opciones = (g: Grade) =>
    Alert.alert(g.titulo, g.nota != null ? `Nota: ${String(g.nota).replace('.', ',')}` : ESTADO[g.estado].label, [
      { text: 'Editar', onPress: () => editar(g) },
      { text: 'Borrar', style: 'destructive', onPress: () => borrar(g) },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  const r = resumenMateria(notas, cfg);
  const etiqueta = (n: number | null) => { const c = concepto(cfg.sistema, n); return n == null ? '—' : `${n.toFixed(2).replace('.', ',')}${c ? ` ${c.sigla}` : ''}`; };

  return (
    <Screen subirCon={editId}>
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
        <Muted>{textoPromediar(cfg)} Se cambia en Notas → Boletín → Cambiar sistema.</Muted>
        <Button variant="soft" icon="📝" title="Apuntes de esta materia" onPress={() => router.push({ pathname: '/apuntes', params: { materia: materia.id } })} />
      </Card>

      {materia.taller && (
        <Card>
          <Title>🎨 Días y horarios del taller</Title>
          <Chips options={[1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: d, label: DIAS[d] }))} value={tDia} onChange={setTDia} />
          <Row style={{ flexWrap: 'nowrap' }}>
            <View style={{ flex: 1 }}><DateField label="Desde" mode="time" value={hhmmToDate(tInicio)} onChange={(d) => setTInicio(dateToHHMM(d))} /></View>
            <View style={{ flex: 1 }}><DateField label="Hasta" mode="time" value={hhmmToDate(tFin)} onChange={(d) => setTFin(dateToHHMM(d))} /></View>
          </Row>
          <Button variant="soft" icon="➕" title="Agregar horario" onPress={agregarHorario} />
          {(materia.horarios ?? []).map((h) => (
            <ListItem
              key={h.id}
              title={`${DIAS_LARGO[h.dia]} · ${h.inicio} – ${h.fin}`}
              right={<Text onPress={() => setMateria({ horarios: (materia.horarios ?? []).filter((x) => x.id !== h.id) })} style={{ color: colors.danger, fontSize: 18 }}>✕</Text>}
            />
          ))}
          {(materia.horarios ?? []).length === 0 && <Muted>Todavía no cargaste horarios. Aparecen en la pestaña Horario.</Muted>}
          <SwitchRow label="Forma parte del boletín" value={!!materia.enBoletin} onChange={(v) => setMateria({ enBoletin: v })} />
        </Card>
      )}

      <Card>
        <Title>{editId ? '✏️ Editar nota o tarea' : 'Cargar nota o tarea'}</Title>
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
        <Button title={editId ? 'Guardar cambios' : 'Guardar'} onPress={agregar} />
        {editId && <Button variant="soft" title="Cancelar edición" onPress={limpiar} />}
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
            onLongPress={() => opciones(g)}
          />
        ))}
        {notas.length > 0 && <Muted>Tocá una tarea para cambiar su estado; mantené presionado para editar o borrar.</Muted>}
      </Card>
    </Screen>
  );
}
