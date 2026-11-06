import { router, type Href } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { Card, Muted, Screen, Title } from '../../components/ui';
import { APPS, abrirApp, type AppExterna } from '../../lib/apps';
import { abrirPlataforma } from '../../lib/share';
import { colors } from '../../lib/theme';

type Item = { icon: string; label: string; href?: Href; app?: AppExterna; url?: string };

const SECCIONES: { titulo: string; items: Item[] }[] = [
  {
    titulo: 'Para estudiar',
    items: [
      { icon: '📝', label: 'Apuntes', href: '/apuntes' },
      { icon: '📏', label: 'Conversor de unidades', href: '/herramientas/conversor' },
      { icon: '⚗️', label: 'Tabla periódica', href: '/herramientas/tabla-periodica' },
      { icon: '🚀', label: 'Fórmulas de física', href: '/herramientas/fisica' },
      { icon: '🧮', label: 'Calculadora', href: '/calculadora' },
      { icon: '🎙️', label: 'Grabadora', href: '/grabadora' },
    ],
  },
  {
    titulo: 'Mapas e idiomas',
    items: [
      { icon: '🗺️', label: 'Google Maps', app: APPS.maps },
      { icon: '🌐', label: 'Google Traductor', app: APPS.traductor },
      { icon: '🧭', label: 'Mapas escolares IGN', url: 'https://mapasescolares.ign.gob.ar/' },
      { icon: '⬇️', label: 'Descargar mapas IGN', url: 'https://www.ign.gob.ar/AreaServicios/Descargas/MapasEscolares' },
    ],
  },
  {
    titulo: 'Educ.ar',
    items: [
      { icon: '📚', label: 'Recursos Educ.ar', url: 'https://www.educ.ar/recursos' },
      { icon: '🧪', label: 'Claves de Química', url: 'https://www.educ.ar/recursos/158342/claves-en-un-minuto-quimica' },
      { icon: '🏛️', label: 'Claves de Historia', url: 'https://www.educ.ar/recursos/158359/claves-en-un-minuto-historia' },
    ],
  },
];

export default function Herramientas() {
  const abrir = (it: Item) => {
    if (it.href) router.push(it.href);
    else if (it.app) abrirApp(it.app);
    else if (it.url) abrirPlataforma(it.url, false).catch(() => Linking.openURL(it.url!));
  };
  return (
    <Screen>
      {SECCIONES.map((sec) => (
        <Card key={sec.titulo}>
          <Title>{sec.titulo}</Title>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {sec.items.map((it) => (
              <Pressable
                key={it.label}
                onPress={() => abrir(it)}
                style={({ pressed }) => ({
                  width: '30%', minHeight: 92, borderRadius: 14, backgroundColor: colors.primarySoft, padding: 8,
                  alignItems: 'center', justifyContent: 'center', gap: 4, opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 28 }}>{it.icon}</Text>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 12, textAlign: 'center' }}>{it.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ))}
      <Muted>Los enlaces web se abren dentro de la app; desde ahí podés pasarlos a Chrome.</Muted>
    </Screen>
  );
}
