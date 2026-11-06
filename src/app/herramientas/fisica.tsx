import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Muted, Screen } from '../../components/ui';
import { TEMAS } from '../../lib/fisica';
import { colors } from '../../lib/theme';

export default function Fisica() {
  const [abierto, setAbierto] = useState<string | null>(TEMAS[0].id);
  return (
    <Screen>
      {TEMAS.map((t) => {
        const open = abierto === t.id;
        return (
          <Card key={t.id}>
            <Pressable onPress={() => setAbierto(open ? null : t.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 24 }}>{t.icono}</Text>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.text }}>{t.titulo}</Text>
              <Text style={{ color: colors.muted, fontSize: 18 }}>{open ? '▲' : '▼'}</Text>
            </Pressable>
            {open && (
              <View style={{ gap: 10 }}>
                {t.variables && <Muted>{t.variables}</Muted>}
                {t.formulas.map((f) => (
                  <View key={f.nombre} style={{ backgroundColor: colors.primarySoft, borderRadius: 10, padding: 10, gap: 2 }}>
                    <Text style={{ color: colors.muted, fontWeight: '600' }}>{f.nombre}</Text>
                    <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{f.formula}</Text>
                    {f.nota && <Text style={{ color: colors.muted, fontSize: 13 }}>{f.nota}</Text>}
                  </View>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
