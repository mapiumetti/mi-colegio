import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Alert, Modal, PanResponder, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Lienzo } from '../../components/lienzo';
import { Button, Chips, Field, Muted, Row, Title, s } from '../../components/ui';
import { PROVEEDORES, leerClave, preguntarConImagen } from '../../lib/ai';
import { carpetaMateria, guardarCopia, subcarpeta } from '../../lib/files';
import { COLORES, FIGURAS, GROSORES, PROMPTS, recortable, toca, trasladar } from '../../lib/pizarra';
import { uid, useData } from '../../lib/store';
import { colors } from '../../lib/theme';
import type { Pizarra, Trazo } from '../../lib/types';

type Herramienta = 'lapiz' | 'resaltador' | 'goma' | 'mover' | 'texto' | 'figura';

const nombreFigura = (id: string) => FIGURAS.find((f) => f.id === id);

export default function EditorPizarra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, update } = useData();
  const guardada = data.pizarras.find((p) => p.id === id);
  const [piz, setPiz] = useState<Pizarra | undefined>(guardada);

  // Herramienta y estilo actuales
  const [herr, setHerr] = useState<Herramienta>('lapiz');
  const [figura, setFigura] = useState('rect');
  const [color, setColor] = useState(COLORES[1]);
  const [grosor, setGrosor] = useState(GROSORES[1]);
  const [relleno, setRelleno] = useState(false);

  // Dibujo en curso, selección, recorte y deshacer
  const [enCurso, setEnCurso] = useState<Trazo | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [arrastre, setArrastre] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [recortando, setRecortando] = useState<string | null>(null);
  const [historia, setHistoria] = useState<Trazo[][]>([]);
  const [rehacer, setRehacer] = useState<Trazo[][]>([]);
  const [tam, setTam] = useState({ w: 300, h: 400 });

  // Ventanas
  const [verFiguras, setVerFiguras] = useState(false);
  const [textoEn, setTextoEn] = useState<{ x: number; y: number } | null>(null);
  const [textoNuevo, setTextoNuevo] = useState('');
  const [verOpciones, setVerOpciones] = useState(false);
  const [verIA, setVerIA] = useState(false);

  const lienzo = useRef<ComponentRef<typeof View>>(null);

  // Si la pizarra recién se creó, puede llegar un instante después.
  useEffect(() => {
    if (!piz && guardada) setPiz(guardada);
  }, [piz, guardada]);

  // Se guarda sola en el teléfono con cada cambio.
  useEffect(() => {
    if (!piz) return;
    update((d) => ({ ...d, pizarras: d.pizarras.map((p) => (p.id === piz.id ? piz : p)) }));
  }, [piz, update]);

  // Referencia siempre actualizada para los gestos.
  const st = useRef({ piz, herr, figura, color, grosor, relleno, sel, recortando, enCurso, arrastre });
  st.current = { piz, herr, figura, color, grosor, relleno, sel, recortando, enCurso, arrastre };

  // Cada cambio guarda el estado anterior para poder deshacer.
  const cambiar = (fn: (t: Trazo[]) => Trazo[]) => {
    const p = st.current.piz;
    if (!p) return;
    const nueva = { ...p, trazos: fn(p.trazos), fecha: new Date().toISOString() };
    st.current.piz = nueva;
    setHistoria((h) => [...h.slice(-49), p.trazos]);
    setRehacer([]);
    setPiz(nueva);
  };

  const tocado = (x: number, y: number, filtro?: (t: Trazo) => boolean) => {
    const lista = st.current.piz?.trazos ?? [];
    for (let i = lista.length - 1; i >= 0; i--) if ((!filtro || filtro(lista[i])) && toca(lista[i], x, y)) return lista[i];
    return undefined;
  };

  const combinar = (aId: string, bId: string, op: NonNullable<Trazo['op']>) =>
    cambiar((l) => {
      const a = l.find((t) => t.id === aId), b = l.find((t) => t.id === bId);
      if (!a || !b) return l;
      const combo: Trazo = { id: uid(), tipo: 'combo', op, a, b, color: a.color, grosor: a.grosor, relleno: a.relleno || b.relleno };
      return l.flatMap((t) => (t.id === aId ? [combo] : t.id === bId ? [] : [t]));
    });

  const elegirRecorte = (aId: string, bId: string) => {
    setRecortando(null);
    Alert.alert('✂️ Recortar figuras', '¿Qué hacemos con las dos figuras?', [
      { text: 'Restar (la 1ª menos la 2ª)', onPress: () => combinar(aId, bId, 'restar') },
      { text: 'Intersección (lo común)', onPress: () => combinar(aId, bId, 'intersecar') },
      { text: 'Unir', onPress: () => combinar(aId, bId, 'unir') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          const c = st.current;
          switch (c.herr) {
            case 'lapiz':
            case 'resaltador':
              setEnCurso({ id: uid(), tipo: c.herr, color: c.color, grosor: c.grosor, puntos: [x, y] });
              break;
            case 'figura':
              setEnCurso({ id: uid(), tipo: c.figura, color: c.color, grosor: c.grosor, relleno: c.relleno, x1: x, y1: y, x2: x, y2: y });
              break;
            case 'texto':
              setTextoEn({ x, y });
              break;
            case 'goma': {
              const t = tocado(x, y);
              cambiar((l) => l.filter((z) => z.id !== t?.id));
              break;
            }
            case 'mover': {
              if (c.recortando) {
                const b = tocado(x, y, (t) => recortable(t) && t.id !== c.recortando);
                if (b) elegirRecorte(c.recortando, b.id);
                else Alert.alert('Tocá otra figura', 'Tocá la figura que va a cortar a la primera (por ejemplo, el círculo).');
                return;
              }
              const t = tocado(x, y);
              setSel(t?.id ?? null);
              if (t) setArrastre({ id: t.id, dx: 0, dy: 0 });
              break;
            }
          }
        },
        onPanResponderMove: (e, g) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          const c = st.current;
          if ((c.herr === 'lapiz' || c.herr === 'resaltador') && c.enCurso) {
            setEnCurso((t) => (t ? { ...t, puntos: [...(t.puntos ?? []), x, y] } : t));
          } else if (c.herr === 'figura' && c.enCurso) {
            setEnCurso((t) => (t ? { ...t, x2: x, y2: y } : t));
          } else if (c.herr === 'goma') {
            const t = tocado(x, y);
            const p = st.current.piz;
            if (t && p) {
              const nueva = { ...p, trazos: p.trazos.filter((z) => z.id !== t.id) };
              st.current.piz = nueva;
              setPiz(nueva);
            }
          } else if (c.herr === 'mover' && c.arrastre) {
            setArrastre({ id: c.arrastre.id, dx: g.dx, dy: g.dy });
          }
        },
        onPanResponderRelease: () => {
          const c = st.current;
          if (c.enCurso) {
            const t = c.enCurso;
            const chico = t.puntos ? false : Math.abs((t.x2 ?? 0) - (t.x1 ?? 0)) + Math.abs((t.y2 ?? 0) - (t.y1 ?? 0)) < 8;
            if (!chico) cambiar((l) => [...l, t]);
            setEnCurso(null);
          }
          if (c.arrastre) {
            const { id: aid, dx, dy } = c.arrastre;
            if (Math.abs(dx) + Math.abs(dy) > 2) cambiar((l) => l.map((t) => (t.id === aid ? trasladar(t, dx, dy) : t)));
            setArrastre(null);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!piz) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: colors.bg }}>
        <Muted>No se encontró la pizarra.</Muted>
      </View>
    );
  }

  const deshacer = () => {
    const prev = historia[historia.length - 1];
    if (!prev) return;
    setRehacer((r) => [...r, piz.trazos]);
    setHistoria((h) => h.slice(0, -1));
    setPiz({ ...piz, trazos: prev });
  };
  const rehacerUno = () => {
    const sig = rehacer[rehacer.length - 1];
    if (!sig) return;
    setHistoria((h) => [...h, piz.trazos]);
    setRehacer((r) => r.slice(0, -1));
    setPiz({ ...piz, trazos: sig });
  };

  const elegido = piz.trazos.find((t) => t.id === sel);
  const mostrada: Pizarra = arrastre ? { ...piz, trazos: piz.trazos.map((t) => (t.id === arrastre.id ? trasladar(t, arrastre.dx, arrastre.dy) : t)) } : piz;

  const capturar = async (formato: 'tmpfile' | 'base64') => {
    setSel(null);
    await new Promise((r) => setTimeout(r, 60));
    return captureRef(lienzo, { format: 'png', quality: 1, result: formato });
  };

  const guardarImagen = async () => {
    try {
      const uri = await capturar('tmpfile');
      const materia = data.subjects.find((m) => m.id === piz.subjectId);
      const dir = materia ? carpetaMateria(materia.nombre) : subcarpeta('Pizarras');
      const f = guardarCopia(uri.startsWith('file://') ? uri : `file://${uri}`, dir, `${piz.titulo || 'pizarra'}.png`);
      Alert.alert('Guardada', `Se guardó "${f.name}" en Mis archivos → ${dir.name}.`);
    } catch {
      Alert.alert('No se pudo', 'No se pudo guardar la imagen.');
    }
  };

  const compartir = async () => {
    const uri = await capturar('tmpfile');
    await Sharing.shareAsync(uri.startsWith('file://') ? uri : `file://${uri}`, { mimeType: 'image/png', dialogTitle: 'Compartir pizarra' });
  };

  const herramientas: { id: Herramienta; icono: string; label: string }[] = [
    { id: 'lapiz', icono: '✏️', label: 'Lápiz' },
    { id: 'resaltador', icono: '🖍️', label: 'Resaltar' },
    { id: 'figura', icono: nombreFigura(figura)?.icono ?? '▭', label: 'Figuras' },
    { id: 'texto', icono: '🔤', label: 'Texto' },
    { id: 'mover', icono: '✋', label: 'Elegir' },
    { id: 'goma', icono: '🧽', label: 'Goma' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: piz.titulo || 'Pizarra' }} />

      {/* Herramientas */}
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, padding: 8 }} showsHorizontalScrollIndicator={false}>
        {herramientas.map((h) => (
          <Pressable
            key={h.id}
            onPress={() => {
              if (h.id === 'figura') setVerFiguras(true);
              setHerr(h.id);
              if (h.id !== 'mover') { setSel(null); setRecortando(null); }
            }}
            style={{ alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: herr === h.id ? colors.primary : colors.card, borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ fontSize: 20 }}>{h.icono}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: herr === h.id ? colors.onPrimary : colors.text }}>{h.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={deshacer} disabled={!historia.length} style={{ justifyContent: 'center', paddingHorizontal: 10, opacity: historia.length ? 1 : 0.35 }}>
          <Text style={{ fontSize: 24, color: colors.text }}>↶</Text>
        </Pressable>
        <Pressable onPress={rehacerUno} disabled={!rehacer.length} style={{ justifyContent: 'center', paddingHorizontal: 10, opacity: rehacer.length ? 1 : 0.35 }}>
          <Text style={{ fontSize: 24, color: colors.text }}>↷</Text>
        </Pressable>
      </ScrollView>

      {/* Colores, grosor y relleno */}
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 8, paddingBottom: 8, alignItems: 'center' }} showsHorizontalScrollIndicator={false}>
        {COLORES.map((c) => (
          <Pressable
            key={c}
            onPress={() => {
              setColor(c);
              if (elegido) cambiar((l) => l.map((t) => (t.id === elegido.id ? { ...t, color: c } : t)));
            }}
            style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: color === c ? 3 : 1, borderColor: color === c ? colors.primary : colors.border }}
          />
        ))}
        {GROSORES.map((g) => (
          <Pressable key={g} onPress={() => setGrosor(g)} style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: grosor === g ? colors.primarySoft : 'transparent' }}>
            <View style={{ width: g + 2, height: g + 2, borderRadius: g, backgroundColor: colors.text }} />
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            setRelleno(!relleno);
            if (elegido) cambiar((l) => l.map((t) => (t.id === elegido.id ? { ...t, relleno: !relleno } : t)));
          }}
          style={[s.chip, relleno && { backgroundColor: colors.primary, borderColor: colors.primary }]}
        >
          <Text style={{ color: relleno ? colors.onPrimary : colors.text, fontWeight: '600' }}>{relleno ? '■ Con relleno' : '□ Sin relleno'}</Text>
        </Pressable>
      </ScrollView>

      {/* Acciones sobre la figura elegida */}
      {herr === 'mover' && (
        <View style={{ paddingHorizontal: 8, paddingBottom: 6 }}>
          {recortando ? (
            <Row>
              <Text style={{ color: colors.primary, fontWeight: '700', flex: 1 }}>✂️ Ahora tocá la figura que corta a la primera</Text>
              <Button variant="soft" title="Cancelar" onPress={() => setRecortando(null)} />
            </Row>
          ) : elegido ? (
            <ScrollView horizontal contentContainerStyle={{ gap: 6 }} showsHorizontalScrollIndicator={false}>
              {recortable(elegido) && <Button variant="soft" title="✂️ Recortar con…" onPress={() => setRecortando(elegido.id)} />}
              {elegido.tipo === 'combo' && (
                <Button
                  variant="soft"
                  title="↩️ Separar"
                  onPress={() => { cambiar((l) => l.flatMap((t) => (t.id === elegido.id && t.a && t.b ? [t.a, t.b] : [t]))); setSel(null); }}
                />
              )}
              <Button variant="soft" title="⧉ Duplicar" onPress={() => cambiar((l) => [...l, { ...trasladar(elegido, 24, 24), id: uid() }])} />
              <Button variant="soft" title="⬆️ Al frente" onPress={() => cambiar((l) => [...l.filter((t) => t.id !== elegido.id), elegido])} />
              <Button variant="danger" title="🗑 Borrar" onPress={() => { cambiar((l) => l.filter((t) => t.id !== elegido.id)); setSel(null); }} />
            </ScrollView>
          ) : (
            <Muted>Tocá una figura para elegirla y arrastrala para moverla. Elegí un color o el relleno para cambiarla.</Muted>
          )}
        </View>
      )}

      {/* Pizarra */}
      <View style={{ flex: 1, marginHorizontal: 8, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
        <View
          ref={lienzo}
          collapsable={false}
          style={{ flex: 1 }}
          onLayout={(e) => setTam({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          {...pan.panHandlers}
        >
          <View pointerEvents="none">
            <Lienzo ancho={tam.w} alto={tam.h} pizarra={mostrada} extra={enCurso} seleccion={sel ? [sel] : []} oscuro={false} />
          </View>
        </View>
      </View>

      {/* Acciones de la pizarra */}
      <Row style={{ padding: 8, flexWrap: 'nowrap' }}>
        <Button style={{ flex: 1 }} icon="🧮" title="Resolver con IA" onPress={() => setVerIA(true)} />
        <Button variant="soft" title="💾" onPress={guardarImagen} />
        <Button variant="soft" title="📤" onPress={compartir} />
        <Button variant="soft" title="⋯" onPress={() => setVerOpciones(true)} />
      </Row>

      {/* Elegir figura */}
      <Modal visible={verFiguras} transparent animationType="slide" onRequestClose={() => setVerFiguras(false)}>
        <View style={s.modalBg}>
          <View style={s.modal}>
            {(['plana', 'cuerpo'] as const).map((g) => (
              <View key={g} style={{ gap: 8 }}>
                <Title>{g === 'plana' ? 'Figuras planas' : 'Cuerpos y poliedros'}</Title>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {FIGURAS.filter((f) => f.grupo === g).map((f) => (
                    <Pressable
                      key={f.id}
                      onPress={() => { setFigura(f.id); setHerr('figura'); setVerFiguras(false); }}
                      style={{ width: '22%', alignItems: 'center', padding: 6, borderRadius: 10, backgroundColor: figura === f.id ? colors.primarySoft : colors.bg }}
                    >
                      <Text style={{ fontSize: 22, color: colors.text }}>{f.icono}</Text>
                      <Text style={{ fontSize: 11, color: colors.text, textAlign: 'center' }} numberOfLines={2}>{f.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            <Muted>Arrastrá el dedo en la pizarra para dibujar la figura del tamaño que quieras.</Muted>
            <Button variant="soft" title="Cerrar" onPress={() => setVerFiguras(false)} />
          </View>
        </View>
      </Modal>

      {/* Escribir texto */}
      <Modal visible={!!textoEn} transparent animationType="fade" onRequestClose={() => setTextoEn(null)}>
        <View style={[s.modalBg, { justifyContent: 'center', padding: 16 }]}>
          <View style={[s.modal, { borderRadius: 16 }]}>
            <Title>Escribir texto</Title>
            <TextInput autoFocus style={s.input} placeholder="a = 3 cm, x² + 2x = 8..." placeholderTextColor={colors.muted} value={textoNuevo} onChangeText={setTextoNuevo} />
            <Row>
              <Button
                title="Agregar"
                onPress={() => {
                  if (textoNuevo.trim() && textoEn) {
                    cambiar((l) => [...l, { id: uid(), tipo: 'texto', texto: textoNuevo.trim(), x1: textoEn.x, y1: textoEn.y + 10, color, grosor, tam: 16 + grosor * 2 }]);
                  }
                  setTextoNuevo('');
                  setTextoEn(null);
                }}
              />
              <Button variant="soft" title="Cancelar" onPress={() => setTextoEn(null)} />
            </Row>
          </View>
        </View>
      </Modal>

      <OpcionesPizarra
        visible={verOpciones}
        piz={piz}
        cerrar={() => setVerOpciones(false)}
        cambiar={(patch) => setPiz({ ...piz, ...patch })}
        borrarTodo={() => cambiar(() => [])}
        eliminar={() => {
          update((d) => ({ ...d, pizarras: d.pizarras.filter((p) => p.id !== piz.id) }));
          setPiz(undefined);
          router.back();
        }}
      />

      <ResolverConIA visible={verIA} cerrar={() => setVerIA(false)} capturar={capturar} piz={piz} />
    </View>
  );
}

/** Título, materia, fondo y borrar. */
function OpcionesPizarra({ visible, piz, cerrar, cambiar, borrarTodo, eliminar }: {
  visible: boolean; piz: Pizarra; cerrar: () => void; cambiar: (p: Partial<Pizarra>) => void; borrarTodo: () => void; eliminar: () => void;
}) {
  const { data } = useData();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={cerrar}>
      <View style={s.modalBg}>
        <View style={s.modal}>
          <Field label="Título" value={piz.titulo} onChangeText={(t) => cambiar({ titulo: t })} />
          <Muted>Materia (la imagen se guarda en su carpeta)</Muted>
          <Chips
            options={[{ value: '', label: 'Ninguna' }, ...data.subjects.map((m) => ({ value: m.id, label: m.nombre, color: m.color }))]}
            value={piz.subjectId ?? ''}
            onChange={(v) => cambiar({ subjectId: v || undefined })}
          />
          <Muted>Fondo</Muted>
          <Chips
            options={[{ value: 'liso', label: 'Liso' }, { value: 'cuadricula', label: 'Cuadriculado' }, { value: 'renglones', label: 'Renglones' }]}
            value={piz.fondo}
            onChange={(v) => cambiar({ fondo: v as Pizarra['fondo'] })}
          />
          <Row>
            <Button variant="soft" title="🧹 Borrar todo el dibujo" onPress={() => { borrarTodo(); cerrar(); }} />
            <Button
              variant="danger"
              title="Eliminar pizarra"
              onPress={() =>
                Alert.alert('Eliminar pizarra', '¿Seguro? No se puede deshacer.', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => { cerrar(); eliminar(); } },
                ])
              }
            />
          </Row>
          <Button title="Listo" onPress={cerrar} />
        </View>
      </View>
    </Modal>
  );
}

/** Manda la pizarra a una IA para que la lea y resuelva. */
function ResolverConIA({ visible, cerrar, capturar, piz }: {
  visible: boolean; cerrar: () => void; capturar: (f: 'tmpfile' | 'base64') => Promise<string>; piz: Pizarra;
}) {
  const { data, update } = useData();
  const provId = data.settings.aiProvider;
  const prov = PROVEEDORES.find((p) => p.id === provId)!;
  const modelo = data.settings.aiModels[provId] || prov.modeloPorDefecto;
  const [tarea, setTarea] = useState(PROMPTS[0].id);
  const [extra, setExtra] = useState('');
  const [tieneClave, setTieneClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [respuesta, setRespuesta] = useState('');

  useEffect(() => {
    if (visible) leerClave(provId).then((k) => setTieneClave(!!k)).catch(() => setTieneClave(false));
  }, [visible, provId]);

  const pregunta = `${PROMPTS.find((p) => p.id === tarea)!.texto}${extra.trim() ? `\n\nDatos o aclaraciones: ${extra.trim()}` : ''}`;

  const resolverAca = async () => {
    setCargando(true);
    setRespuesta('');
    try {
      const b64 = await capturar('base64');
      setRespuesta(await preguntarConImagen(provId, modelo, pregunta, b64.replace(/^data:image\/png;base64,/, '')));
    } catch (e) {
      Alert.alert('No se pudo', e instanceof Error ? e.message : String(e));
    } finally {
      setCargando(false);
    }
  };

  // Gratis: se copia la pregunta y se comparte la imagen con la app de IA instalada.
  const enviarAApp = async () => {
    await Clipboard.setStringAsync(pregunta);
    Alert.alert('📋 Pregunta copiada', 'Elegí Claude, ChatGPT o Gemini en la lista y, en el chat, mantené apretado y tocá "Pegar" para mandar la pregunta junto con la imagen.', [
      {
        text: 'Seguir',
        onPress: async () => {
          const uri = await capturar('tmpfile');
          await Sharing.shareAsync(uri.startsWith('file://') ? uri : `file://${uri}`, { mimeType: 'image/png', dialogTitle: 'Enviar a la IA' });
        },
      },
    ]);
  };

  const guardarApunte = () => {
    update((d) => ({
      ...d,
      apuntes: [...d.apuntes, { id: uid(), subjectId: piz.subjectId, titulo: `${piz.titulo || 'Pizarra'} (IA)`, texto: respuesta, fecha: new Date().toISOString() }],
    }));
    Alert.alert('Guardado', 'La respuesta quedó en Apuntes.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={cerrar}>
      <View style={s.modalBg}>
        <View style={[s.modal, { maxHeight: '90%' }]}>
          <Title>🧮 Resolver con IA</Title>
          <Chips options={PROMPTS.map((p) => ({ value: p.id, label: p.label }))} value={tarea} onChange={setTarea} />
          <Field label="Datos o pregunta extra (opcional)" placeholder="El cateto mide 3 cm y la hipotenusa 5 cm..." value={extra} onChangeText={setExtra} />
          {respuesta ? (
            <>
              <ScrollView style={{ maxHeight: 320, backgroundColor: colors.bg, borderRadius: 12, padding: 10 }}>
                <Text selectable style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{respuesta}</Text>
              </ScrollView>
              <Row>
                <Button variant="soft" title="📝 Guardar en Apuntes" onPress={guardarApunte} />
                <Button variant="soft" title="📋 Copiar" onPress={() => Clipboard.setStringAsync(respuesta)} />
              </Row>
            </>
          ) : null}
          {cargando && <ActivityIndicator color={colors.primary} />}
          {prov.conApi && tieneClave ? (
            <Button icon="⚡" title={`Resolver acá con ${prov.nombre}`} onPress={resolverAca} disabled={cargando} />
          ) : (
            <Muted>Para ver la respuesta dentro de Mi Colegio cargá tu clave de API en Más → Asistente IA. Si no, usá el botón de abajo (gratis).</Muted>
          )}
          <Button variant="soft" icon="📤" title="Enviar a la app de IA (gratis)" onPress={enviarAApp} />
          <Button variant="soft" title="Cerrar" onPress={() => { setRespuesta(''); cerrar(); }} />
        </View>
      </View>
    </Modal>
  );
}
