import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Button, Card, Dot, Field, ListItem, Muted, Row, Screen, SwitchRow, Title } from '../components/ui';
import { uid, useData } from '../lib/store';
import { carpetaMateria } from '../lib/files';
import { colors, subjectColors } from '../lib/theme';

export default function Materias() {
  const { data, update } = useData();
  const [nombre, setNombre] = useState('');
  const [profesor, setProfesor] = useState('');
  const [aula, setAula] = useState('');
  const [color, setColor] = useState(subjectColors[data.subjects.length % subjectColors.length]);
  const [taller, setTaller] = useState(false);

  const guardar = (enBoletin?: boolean) => {
    // Cada materia (y cada taller) tiene su carpeta en Mis archivos.
    try { carpetaMateria(nombre.trim()); } catch { /* se crea más tarde */ }
    const id = uid();
    update((d) => ({
      ...d,
      subjects: [...d.subjects, { id, nombre: nombre.trim(), profesor, aula, color, ...(taller ? { taller: true, enBoletin: !!enBoletin, horarios: [] } : {}) }],
    }));
    setNombre(''); setProfesor(''); setAula('');
    setColor(subjectColors[(data.subjects.length + 1) % subjectColors.length]);
    // Al taller se le cargan los días y horarios en su pantalla.
    if (taller) router.push({ pathname: '/materia/[id]', params: { id } });
  };

  const agregar = () => {
    if (!nombre.trim()) return;
    if (!taller) return guardar();
    Alert.alert('¿Va en el boletín?', `¿El taller "${nombre.trim()}" forma parte del boletín de calificaciones?`, [
      { text: 'No, es un extra', onPress: () => guardar(false) },
      { text: 'Sí, va en el boletín', onPress: () => guardar(true) },
    ]);
  };

  const materias = data.subjects.filter((m) => !m.taller);
  const talleres = data.subjects.filter((m) => m.taller);
  const item = (m: (typeof data.subjects)[number]) => (
    <ListItem
      key={m.id}
      left={<Dot color={m.color} />}
      title={m.nombre}
      subtitle={
        m.taller
          ? [`${m.horarios?.length ?? 0} horario(s)`, m.enBoletin ? 'en el boletín' : 'extra, fuera del boletín'].join(' · ')
          : [m.profesor, m.aula].filter(Boolean).join(' · ') || 'Tocá para ver notas · mantené presionado para borrar'
      }
      onPress={() => router.push({ pathname: '/materia/[id]', params: { id: m.id } })}
      onLongPress={() => borrar(m.id, m.nombre)}
    />
  );

  const borrar = (id: string, n: string) =>
    Alert.alert('Borrar materia', `¿Borrar "${n}" y sus notas?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar', style: 'destructive',
        onPress: () => update((d) => ({
          ...d,
          subjects: d.subjects.filter((x) => x.id !== id),
          grades: d.grades.filter((g) => g.subjectId !== id),
          blocks: d.blocks.map((b) => (b.subjectId === id ? { ...b, subjectId: undefined } : b)),
        })),
      },
    ]);

  return (
    <Screen>
      <Card>
        <Title>{taller ? 'Nuevo taller' : 'Nueva materia'}</Title>
        <SwitchRow label="🎨 Es un taller (arte, idioma, canto, actuación...)" value={taller} onChange={setTaller} />
        <Field label="Nombre" placeholder={taller ? 'Taller de teatro' : 'Matemática'} value={nombre} onChangeText={setNombre} />
        <Field label="Profesor/a" placeholder="Prof. García" value={profesor} onChangeText={setProfesor} />
        <Field label="Aula" placeholder="Aula 12" value={aula} onChangeText={setAula} />
        <Row>
          {subjectColors.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.text }} />
            </Pressable>
          ))}
        </Row>
        <Button title={taller ? 'Agregar taller' : 'Agregar materia'} onPress={agregar} />
        {taller && <Muted>Los talleres son extras: pueden ser hasta tarde (21 hs) y te pregunto si van en el boletín.</Muted>}
      </Card>

      <Card>
        <Title>Mis materias</Title>
        {materias.length === 0 && <Muted>Todavía no cargaste materias.</Muted>}
        {materias.map(item)}
      </Card>

      {talleres.length > 0 && (
        <Card>
          <Title>🎨 Mis talleres</Title>
          {talleres.map(item)}
        </Card>
      )}
    </Screen>
  );
}
