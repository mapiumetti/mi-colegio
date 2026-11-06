import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Chips, Field, Muted, Screen, Title } from '../../components/ui';
import { colors } from '../../lib/theme';
import { MAGNITUDES, convertir, formatoNumero } from '../../lib/unidades';

export default function Conversor() {
  const [magId, setMagId] = useState(MAGNITUDES[0].id);
  const mag = MAGNITUDES.find((m) => m.id === magId)!;
  const [de, setDe] = useState(mag.unidades[3]?.id ?? mag.unidades[0].id);
  const [valor, setValor] = useState('1');

  const cambiarMagnitud = (id: string) => {
    const m = MAGNITUDES.find((x) => x.id === id)!;
    setMagId(id);
    setDe(m.unidades[0].id);
  };

  const num = parseFloat(valor.replace(',', '.'));
  const desde = mag.unidades.find((u) => u.id === de) ?? mag.unidades[0];

  return (
    <Screen>
      <Chips options={MAGNITUDES.map((m) => ({ value: m.id, label: `${m.icono} ${m.nombre}` }))} value={magId} onChange={cambiarMagnitud} />
      <Card>
        <Field label="Valor" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
        <Muted>Desde</Muted>
        <Chips options={mag.unidades.map((u) => ({ value: u.id, label: u.id }))} value={desde.id} onChange={setDe} />
        <Muted>{desde.nombre}</Muted>
      </Card>
      <Card>
        <Title>Equivale a</Title>
        {mag.unidades.filter((u) => u.id !== desde.id).map((u) => (
          <Pressable key={u.id} onPress={() => setDe(u.id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, flex: 1 }}>{u.nombre}</Text>
              <Text selectable style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
                {isNaN(num) ? '—' : formatoNumero(convertir(mag, num, desde.id, u.id))}
              </Text>
            </View>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
