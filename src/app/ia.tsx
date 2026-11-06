import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { Button, Card, Chips, Field, Muted, Row, s } from '../components/ui';
import { PROVEEDORES, guardarClave, leerClave, preguntar, type Mensaje } from '../lib/ai';
import { APPS, abrirApp } from '../lib/apps';
import { enviarTelegram, enviarWhatsApp } from '../lib/share';
import { useData } from '../lib/store';
import { colors } from '../lib/theme';
import type { AiProviderId } from '../lib/types';

const ATAJOS = [
  { label: '📝 Resumir', prompt: 'Haceme un resumen claro y ordenado de este texto:\n\n' },
  { label: '💡 Explicar', prompt: 'Explicame de forma simple, con ejemplos, el tema: ' },
  { label: '❓ Preguntas de repaso', prompt: 'Armame 10 preguntas de repaso con sus respuestas sobre: ' },
  { label: '🧠 Mapa conceptual', prompt: 'Armame un mapa conceptual en texto (con viñetas jerárquicas) sobre: ' },
];

export default function Ia() {
  const { data, update } = useData();
  const provId = data.settings.aiProvider;
  const prov = PROVEEDORES.find((p) => p.id === provId)!;
  const modelo = data.settings.aiModels[provId] || prov.modeloPorDefecto;

  const [clave, setClave] = useState('');
  const [tieneClave, setTieneClave] = useState(false);
  const [config, setConfig] = useState(false);
  const [texto, setTexto] = useState('');
  const [chat, setChat] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    leerClave(provId).then((k) => { setTieneClave(!!k); setClave(''); });
  }, [provId]);

  const setProv = (id: AiProviderId) => update((d) => ({ ...d, settings: { ...d.settings, aiProvider: id } }));
  const setModelo = (m: string) => update((d) => ({ ...d, settings: { ...d.settings, aiModels: { ...d.settings.aiModels, [provId]: m } } }));

  const enviar = async (contenido = texto) => {
    if (!contenido.trim()) return;
    const nuevo: Mensaje[] = [...chat, { role: 'user', content: contenido.trim() }];
    setChat(nuevo); setTexto(''); setCargando(true);
    try {
      const r = await preguntar(provId, modelo, nuevo);
      setChat([...nuevo, { role: 'assistant', content: r }]);
    } catch (e) {
      Alert.alert('No se pudo responder', e instanceof Error ? e.message : String(e));
      setChat(chat);
      setTexto(contenido);
    } finally {
      setCargando(false);
      setTimeout(() => scroll.current?.scrollToEnd(), 100);
    }
  };

  // Permite traer un .txt o .md (apuntes) para resumir.
  const adjuntarTexto = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['text/*'], copyToCacheDirectory: true });
    if (r.canceled) return;
    const contenido = await new File(r.assets[0].uri).text();
    setTexto(`Haceme un resumen claro y ordenado de este texto:\n\n${contenido.slice(0, 30000)}`);
  };

  const ultimaRespuesta = [...chat].reverse().find((m) => m.role === 'assistant')?.content;

  return (
    <View style={s.screen}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Muted>Abrir la app de IA instalada en el teléfono</Muted>
          <Row>
            {PROVEEDORES.map((p) => <Button key={p.id} variant="soft" title={p.nombre} onPress={() => abrirApp(APPS[p.id])} />)}
          </Row>
        </Card>
        <Muted>O chatear acá mismo con tu clave de API:</Muted>
        <Chips options={PROVEEDORES.map((p) => ({ value: p.id, label: p.nombre }))} value={provId} onChange={setProv} />

        {!prov.conApi ? (
          <Card>
            <Muted>{prov.nombre} no permite conectarse con una clave desde otras apps. Abrimos su app o su web oficial.</Muted>
            <Button title={`Abrir ${prov.nombre}`} onPress={() => abrirApp(APPS[provId])} />
          </Card>
        ) : (
          <>
            {(!tieneClave || config) && (
              <Card>
                <Muted>
                  Para usar {prov.nombre} dentro de la app, pegá tu clave de API (se guarda cifrada en el teléfono).
                  {prov.dondeObtenerClave ? ` Se obtiene en ${prov.dondeObtenerClave}.` : ''} Si no tenés clave, podés abrir la app oficial.
                </Muted>
                <Field label="Clave de API" secureTextEntry autoCapitalize="none" value={clave} onChangeText={setClave} placeholder={tieneClave ? '•••••• (guardada)' : ''} />
                <Field label="Modelo" autoCapitalize="none" value={modelo} onChangeText={setModelo} />
                <Row>
                  <Button title="Guardar" onPress={async () => { if (clave) { await guardarClave(provId, clave); setTieneClave(true); } setConfig(false); }} />
                  {tieneClave && <Button variant="danger" title="Borrar clave" onPress={async () => { await guardarClave(provId, ''); setTieneClave(false); }} />}
                  <Button variant="soft" title={`Abrir ${prov.nombre}`} onPress={() => abrirApp(APPS[provId])} />
                </Row>
              </Card>
            )}
            {tieneClave && !config && (
              <Row>
                <Muted>{prov.nombre} · {modelo}</Muted>
                <Button variant="soft" title="Configurar" onPress={() => setConfig(true)} />
                {chat.length > 0 && <Button variant="soft" title="Nuevo chat" onPress={() => setChat([])} />}
              </Row>
            )}
          </>
        )}

        {chat.map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', padding: 12, borderRadius: 14,
              backgroundColor: m.role === 'user' ? colors.primary : colors.card, borderWidth: m.role === 'user' ? 0 : 1, borderColor: colors.border,
            }}
          >
            <Text selectable style={{ color: m.role === 'user' ? colors.onPrimary : colors.text, fontSize: 15 }}>{m.content}</Text>
          </View>
        ))}
        {cargando && <ActivityIndicator color={colors.primary} />}
        {ultimaRespuesta && (
          <Row>
            <Button variant="soft" icon="💬" title="WhatsApp" onPress={() => enviarWhatsApp(ultimaRespuesta)} />
            <Button variant="soft" icon="✈️" title="Telegram" onPress={() => enviarTelegram(ultimaRespuesta)} />
          </Row>
        )}
      </ScrollView>

      {prov.conApi && tieneClave && (
        <View style={{ padding: 12, gap: 8, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ATAJOS.map((a) => <Button key={a.label} variant="soft" title={a.label} onPress={() => setTexto(a.prompt + texto)} />)}
            <Button variant="soft" title="📎 Apunte .txt" onPress={adjuntarTexto} />
          </ScrollView>
          <Row style={{ flexWrap: 'nowrap' }}>
            <TextInput style={[s.input, { flex: 1, maxHeight: 120 }]} multiline placeholder="Preguntá lo que quieras..." placeholderTextColor={colors.muted} value={texto} onChangeText={setTexto} />
            <Button title="Enviar" onPress={() => enviar()} disabled={cargando} />
          </Row>
        </View>
      )}
    </View>
  );
}
