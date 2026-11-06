import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Screen, Title } from '../../components/ui';
import { colors } from '../../lib/theme';

const ITEMS: { icon: string; label: string; href: Href }[] = [
  { icon: '🎧', label: 'Concentración', href: '/concentracion' },
  { icon: '🙋', label: 'Asistencia y conducta', href: '/asistencia' },
  { icon: '🧰', label: 'Herramientas', href: '/herramientas' },
  { icon: '📝', label: 'Apuntes', href: '/apuntes' },
  { icon: '👤', label: 'Mis datos', href: '/perfil' },
  { icon: '🏫', label: 'Mi colegio', href: '/colegio' },
  { icon: '📚', label: 'Materias', href: '/materias' },
  { icon: '📁', label: 'Archivos y cámara', href: '/archivos' },
  { icon: '🎙️', label: 'Grabadora', href: '/grabadora' },
  { icon: '👥', label: 'Contactos', href: '/contactos' },
  { icon: '🤖', label: 'Asistente IA', href: '/ia' },
  { icon: '🧮', label: 'Calculadora', href: '/calculadora' },
  { icon: '☁️', label: 'Nubes y documentos', href: '/nubes' },
  { icon: '🇦🇷', label: 'Feriados', href: '/feriados' },
  { icon: '📋', label: 'Boletín', href: '/boletin' },
  { icon: '🎨', label: 'Apariencia y copias', href: '/ajustes' },
];

export default function Mas() {
  return (
    <Screen>
      <Title>Herramientas</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {ITEMS.map((it) => (
          <Pressable
            key={it.label}
            onPress={() => router.push(it.href)}
            style={({ pressed }) => ({
              width: '47%', aspectRatio: 1.4, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
              borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 34 }}>{it.icon}</Text>
            <Text style={{ fontWeight: '700', color: colors.text, textAlign: 'center' }}>{it.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
