import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Card, Field, ListItem, Muted, Screen, Title } from '../../components/ui';
import { CATEGORIAS, ELEMENTOS, configuracion, type Elemento } from '../../lib/elementos';
import { colors } from '../../lib/theme';

const T = 44; // tamaño de cada casilla

// Fila y columna de cada elemento en la tabla (lantánidos y actínidos abajo).
function posicion(e: Elemento): { fila: number; col: number } {
  if (e.cat === 'la' && e.grupo === 0) return { fila: 8, col: e.z - 57 + 3 };
  if (e.cat === 'ac' && e.grupo === 0) return { fila: 9, col: e.z - 89 + 3 };
  return { fila: e.periodo - 1, col: e.grupo - 1 };
}

export default function TablaPeriodica() {
  const [sel, setSel] = useState<Elemento>(ELEMENTOS[0]);
  const [busqueda, setBusqueda] = useState('');
  const q = busqueda.trim().toLowerCase();
  const encontrados = q
    ? ELEMENTOS.filter((e) => e.nombre.toLowerCase().includes(q) || e.simbolo.toLowerCase() === q || String(e.z) === q)
    : [];

  return (
    <Screen>
      <Card style={{ borderLeftWidth: 8, borderLeftColor: CATEGORIAS[sel.cat].color }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: CATEGORIAS[sel.cat].color, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 11, color: '#111' }}>{sel.z}</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#111' }}>{sel.simbolo}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Title>{sel.nombre}</Title>
            <Muted>{CATEGORIAS[sel.cat].nombre}</Muted>
            <Text style={{ color: colors.text }}>Masa atómica: {sel.masa} u</Text>
            <Text style={{ color: colors.text }}>Período {sel.periodo}{sel.grupo ? ` · Grupo ${sel.grupo}` : ''}</Text>
          </View>
        </View>
        <Text style={{ color: colors.text }}>Configuración electrónica: {configuracion(sel.z)}</Text>
        <Muted>Según la regla de las diagonales. Algunos elementos (como Cr y Cu) tienen excepciones.</Muted>
      </Card>

      <Field label="Buscar elemento" placeholder="Nombre, símbolo o número" value={busqueda} onChangeText={setBusqueda} />
      {encontrados.slice(0, 6).map((e) => (
        <ListItem key={e.z} title={`${e.simbolo} · ${e.nombre}`} subtitle={`Z = ${e.z}`} onPress={() => { setSel(e); setBusqueda(''); }} />
      ))}

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ width: T * 18 + 17 * 2, height: T * 10 + 9 * 2 + 12 }}>
          {ELEMENTOS.map((e) => {
            const p = posicion(e);
            const top = p.fila * (T + 2) + (p.fila >= 8 ? 12 : 0);
            return (
              <Pressable
                key={e.z}
                onPress={() => setSel(e)}
                style={{
                  position: 'absolute', left: p.col * (T + 2), top, width: T, height: T, borderRadius: 6,
                  backgroundColor: CATEGORIAS[e.cat].color, alignItems: 'center', justifyContent: 'center',
                  borderWidth: sel.z === e.z ? 3 : 0, borderColor: colors.text,
                }}
              >
                <Text style={{ fontSize: 8, color: '#111' }}>{e.z}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#111' }}>{e.simbolo}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Card>
        {Object.values(CATEGORIAS).map((c) => (
          <View key={c.nombre} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: c.color }} />
            <Text style={{ color: colors.text }}>{c.nombre}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
