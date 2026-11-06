import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, Chips, Muted, Row, Screen, Title, s } from '../../components/ui';
import { useData } from '../../lib/store';
import { colors } from '../../lib/theme';
import { DIAS, TURNO_NOMBRE } from '../../lib/time';
import type { Block } from '../../lib/types';

export default function Horario() {
  const { data, update } = useData();
  const diasCfg = data.schedule.dias;
  const hoy = new Date().getDay();
  const [dia, setDia] = useState(diasCfg.includes(hoy) ? hoy : diasCfg[0] ?? 1);
  const [editando, setEditando] = useState<Block | null>(null);
  const bloques = data.blocks.filter((b) => b.dia === dia);
  const materia = (id?: string) => data.subjects.find((x) => x.id === id);

  const asignar = (subjectId: string | undefined) => {
    if (!editando) return;
    update((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === editando.id ? { ...b, subjectId } : b)) }));
    setEditando(null);
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Button variant="soft" icon="⚙️" title="Turnos y horarios" onPress={() => router.push('/configurar-horario')} />
        <Button variant="soft" icon="📚" title="Materias" onPress={() => router.push('/materias')} />
      </Row>

      <Chips options={diasCfg.map((d) => ({ value: d, label: DIAS[d] }))} value={dia} onChange={setDia} />

      {data.blocks.length === 0 ? (
        <Card>
          <Title>Armá tu horario</Title>
          <Muted>
            1) Cargá tus materias. 2) Configurá los turnos (mañana, tarde o noche), la duración de cada módulo, los
            recreos y el almuerzo. 3) Tocá cada módulo para asignarle la materia.
          </Muted>
          <Button title="Empezar" onPress={() => router.push('/configurar-horario')} />
        </Card>
      ) : (
        <Card>
          {bloques.map((b, i) => {
            const m = materia(b.subjectId);
            const cambioTurno = i > 0 && bloques[i - 1].turno !== b.turno && b.tipo !== 'almuerzo';
            if (b.tipo !== 'materia') {
              return (
                <View key={b.id} style={{ paddingVertical: 6, alignItems: 'center' }}>
                  <Text style={{ color: colors.muted }}>
                    {b.tipo === 'recreo' ? '☕ Recreo' : '🍽️ Almuerzo'} · {b.inicio} – {b.fin}
                  </Text>
                </View>
              );
            }
            return (
              <View key={b.id}>
                {(i === 0 || cambioTurno) && <Text style={[s.label, { marginTop: 6 }]}>Turno {TURNO_NOMBRE[b.turno]}</Text>}
                <Pressable
                  onPress={() => setEditando(b)}
                  style={{
                    flexDirection: 'row', gap: 12, padding: 12, marginVertical: 4, borderRadius: 12,
                    backgroundColor: m ? `${m.color}22` : colors.bg, borderLeftWidth: 5, borderLeftColor: m?.color ?? colors.border,
                  }}
                >
                  <Text style={{ width: 96, color: colors.muted }}>{b.inicio} – {b.fin}</Text>
                  <Text style={{ fontWeight: '700', color: colors.text, flex: 1 }}>{m?.nombre ?? 'Tocar para asignar'}</Text>
                </Pressable>
              </View>
            );
          })}
        </Card>
      )}

      <Modal visible={!!editando} transparent animationType="slide" onRequestClose={() => setEditando(null)}>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <Title>¿Qué materia es a las {editando?.inicio}?</Title>
            <ScrollView style={{ maxHeight: 360 }}>
              {data.subjects.map((m) => (
                <Pressable key={m.id} onPress={() => asignar(m.id)} style={{ padding: 14, borderRadius: 12, backgroundColor: `${m.color}22`, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{m.nombre}</Text>
                </Pressable>
              ))}
              {data.subjects.length === 0 && <Muted>Primero cargá tus materias.</Muted>}
            </ScrollView>
            <Row>
              <Button variant="soft" title="Hora libre" onPress={() => asignar(undefined)} />
              <Button variant="soft" title="Cargar materias" onPress={() => { setEditando(null); router.push('/materias'); }} />
              <Button variant="danger" title="Cancelar" onPress={() => setEditando(null)} />
            </Row>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
