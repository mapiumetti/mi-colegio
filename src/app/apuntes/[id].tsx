import { File } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { Button, Card, Chips, Field, Muted, Row, Screen, s } from '../../components/ui';
import { carpetaMateria, subcarpeta } from '../../lib/files';
import { enviarTelegram, enviarWhatsApp } from '../../lib/share';
import { uid, useData } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Apunte() {
  const params = useLocalSearchParams<{ id: string; materia?: string }>();
  const { data, update } = useData();
  const existente = data.apuntes.find((a) => a.id === params.id);
  const [id] = useState(existente?.id ?? uid());
  const [titulo, setTitulo] = useState(existente?.titulo ?? '');
  const [texto, setTexto] = useState(existente?.texto ?? '');
  const [subjectId, setSubjectId] = useState<string | undefined>(existente?.subjectId ?? (params.materia || undefined));
  const materia = data.subjects.find((m) => m.id === subjectId);

  const guardar = () => {
    const a = { id, titulo: titulo.trim(), texto, subjectId, fecha: new Date().toISOString() };
    update((d) => ({ ...d, apuntes: d.apuntes.some((x) => x.id === id) ? d.apuntes.map((x) => (x.id === id ? a : x)) : [...d.apuntes, a] }));
    router.back();
  };

  // Guarda una copia .txt en la carpeta de la materia (Mis archivos).
  const exportar = () => {
    const dir = materia ? carpetaMateria(materia.nombre) : subcarpeta('Apuntes');
    const nombre = `${(titulo || 'apunte').replace(/[\\/:*?"<>|]/g, '_')}.txt`;
    const f = new File(dir, nombre);
    f.create({ overwrite: true });
    f.write(`${titulo}\n\n${texto}`);
    Alert.alert('Guardado', `Se guardó "${nombre}" en Mis archivos → ${dir.name}.`);
  };

  const borrar = () =>
    Alert.alert('Borrar apunte', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => { update((d) => ({ ...d, apuntes: d.apuntes.filter((x) => x.id !== id) })); router.back(); } },
    ]);

  const compartible = `📝 ${titulo}${materia ? ` (${materia.nombre})` : ''}\n\n${texto}`;

  return (
    <Screen>
      <Card>
        <Field label="Título" value={titulo} onChangeText={setTitulo} placeholder="Revolución de Mayo, Ecuaciones..." />
        {data.subjects.length > 0 && (
          <>
            <Muted>Materia</Muted>
            <Chips
              options={[{ value: '', label: 'Ninguna' }, ...data.subjects.map((m) => ({ value: m.id, label: m.nombre, color: m.color }))]}
              value={subjectId ?? ''}
              onChange={(v) => setSubjectId(v || undefined)}
            />
          </>
        )}
        <TextInput
          style={[s.input, { minHeight: 260, textAlignVertical: 'top' }]}
          multiline
          placeholder="Escribí tu apunte..."
          placeholderTextColor={colors.muted}
          value={texto}
          onChangeText={setTexto}
        />
      </Card>
      <Button icon="💾" title="Guardar" onPress={guardar} />
      <Row>
        <Button variant="soft" icon="📂" title="Guardar .txt en la carpeta" onPress={exportar} />
        <Button variant="soft" icon="💬" title="WhatsApp" onPress={() => enviarWhatsApp(compartible)} />
        <Button variant="soft" icon="✈️" title="Telegram" onPress={() => enviarTelegram(compartible)} />
      </Row>
      {existente && <Button variant="danger" title="Borrar" onPress={borrar} />}
    </Screen>
  );
}
