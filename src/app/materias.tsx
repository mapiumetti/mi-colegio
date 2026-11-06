import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Button, Card, Dot, Field, ListItem, Muted, Row, Screen, Title } from '../components/ui';
import { uid, useData } from '../lib/store';
import { carpetaMateria } from '../lib/files';
import { colors, subjectColors } from '../lib/theme';

export default function Materias() {
  const { data, update } = useData();
  const [nombre, setNombre] = useState('');
  const [profesor, setProfesor] = useState('');
  const [aula, setAula] = useState('');
  const [color, setColor] = useState(subjectColors[data.subjects.length % subjectColors.length]);

  const agregar = () => {
    if (!nombre.trim()) return;
    // Cada materia tiene su carpeta en Mis archivos.
    try { carpetaMateria(nombre.trim()); } catch { /* se crea más tarde */ }
    update((d) => ({ ...d, subjects: [...d.subjects, { id: uid(), nombre: nombre.trim(), profesor, aula, color }] }));
    setNombre(''); setProfesor(''); setAula('');
    setColor(subjectColors[(data.subjects.length + 1) % subjectColors.length]);
  };

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
        <Title>Nueva materia</Title>
        <Field label="Nombre" placeholder="Matemática" value={nombre} onChangeText={setNombre} />
        <Field label="Profesor/a" placeholder="Prof. García" value={profesor} onChangeText={setProfesor} />
        <Field label="Aula" placeholder="Aula 12" value={aula} onChangeText={setAula} />
        <Row>
          {subjectColors.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.text }} />
            </Pressable>
          ))}
        </Row>
        <Button title="Agregar materia" onPress={agregar} />
      </Card>

      <Card>
        <Title>Mis materias</Title>
        {data.subjects.length === 0 && <Muted>Todavía no cargaste materias.</Muted>}
        {data.subjects.map((m) => (
          <ListItem
            key={m.id}
            left={<Dot color={m.color} />}
            title={m.nombre}
            subtitle={[m.profesor, m.aula].filter(Boolean).join(' · ') || 'Tocá para ver notas · mantené presionado para borrar'}
            onPress={() => router.push({ pathname: '/materia/[id]', params: { id: m.id } })}
            onLongPress={() => borrar(m.id, m.nombre)}
          />
        ))}
      </Card>
    </Screen>
  );
}
