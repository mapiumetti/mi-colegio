import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import { Button, Card, Chips, Muted, Row, Screen, Title, s } from '../../components/ui';
import { evaluar, formatear } from '../../lib/calc';
import { colors } from '../../lib/theme';

const COLORES = ['#2563EB', '#DC2626', '#16A34A'];
const EJEMPLOS = ['x^2', '2x+1', 'sen(x)', 'x^3-3x', '1/x', '√x', 'abs(x)', 'e^x', 'ln(x)', 'cos(x)'];
const ALTO = 340;

/** Paso "lindo" para la grilla: 1, 2, 5, 10, 20, 50... */
function pasoGrilla(rango: number) {
  const bruto = rango / 8;
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  const f = bruto / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}
const etiqueta = (n: number) => formatear(Math.abs(n) < 1e-9 ? 0 : n);

/** Graficador de funciones en el plano cartesiano XY. */
export default function Graficador() {
  const [funciones, setFunciones] = useState<string[]>(['x^2', '', '']);
  const [ancho, setAncho] = useState(320);
  const [centro, setCentro] = useState({ x: 0, y: 0 });
  const [escala, setEscala] = useState(10); // unidades de x desde el centro hasta el borde
  const [radianes, setRadianes] = useState(true);
  const [xValor, setXValor] = useState('');

  const mitadX = escala;
  const mitadY = (escala * ALTO) / ancho;
  const xMin = centro.x - mitadX;
  const xMax = centro.x + mitadX;
  const yMin = centro.y - mitadY;
  const yMax = centro.y + mitadY;
  const aPx = (x: number) => ((x - xMin) / (xMax - xMin)) * ancho;
  const aPy = (y: number) => ALTO - ((y - yMin) / (yMax - yMin)) * ALTO;

  // Arrastrar con el dedo para mover el gráfico.
  const vista = useRef({ centro, escala, ancho });
  vista.current = { centro, escala, ancho };
  const arrastre = useRef<{ x: number; y: number } | null>(null);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => { arrastre.current = { ...vista.current.centro }; },
        onPanResponderMove: (_e, g) => {
          if (!arrastre.current) return;
          const { escala: e, ancho: w } = vista.current;
          const uPorPx = (2 * e) / w;
          setCentro({ x: arrastre.current.x - g.dx * uPorPx, y: arrastre.current.y + g.dy * uPorPx });
        },
        onPanResponderRelease: () => { arrastre.current = null; },
      }),
    [],
  );

  const curvas = useMemo(
    () =>
      funciones.map((f) => {
        if (!f.trim()) return { d: '', error: false };
        const n = Math.max(200, Math.round(ancho * 1.5));
        let d = '';
        let subir = true;
        let error = false;
        let previoY: number | null = null;
        for (let i = 0; i <= n; i++) {
          const x = xMin + ((xMax - xMin) * i) / n;
          let y: number;
          try { y = evaluar(f, x, radianes); } catch { error = true; break; }
          // Se corta la línea donde la función no existe o "salta" (asíntotas).
          if (!isFinite(y) || (previoY != null && Math.abs(y - previoY) > (yMax - yMin) * 2)) {
            subir = true;
            previoY = isFinite(y) ? y : null;
            continue;
          }
          const py = Math.max(-ALTO * 5, Math.min(ALTO * 6, aPy(y)));
          d += `${subir ? 'M' : 'L'}${aPx(x).toFixed(1)},${py.toFixed(1)} `;
          subir = false;
          previoY = y;
        }
        return { d, error };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [funciones, xMin, xMax, yMin, yMax, ancho, radianes],
  );

  const paso = pasoGrilla(xMax - xMin);
  const lineasX: number[] = [];
  for (let v = Math.ceil(xMin / paso) * paso; v <= xMax; v += paso) lineasX.push(v);
  const lineasY: number[] = [];
  for (let v = Math.ceil(yMin / paso) * paso; v <= yMax; v += paso) lineasY.push(v);
  const ejeX = Math.min(ALTO - 2, Math.max(2, aPy(0))); // posición del eje X (y = 0)
  const ejeY = Math.min(ancho - 2, Math.max(2, aPx(0))); // posición del eje Y (x = 0)
  const grilla = colors.dark ? '#334155' : '#E5E7EB';
  const ejes = colors.dark ? '#CBD5E1' : '#374151';

  const zoom = (f: number) => setEscala((e) => Math.min(1e6, Math.max(0.01, e * f)));
  const mover = (dx: number, dy: number) => setCentro((c) => ({ x: c.x + dx * escala * 0.5, y: c.y + dy * escala * 0.5 }));

  const xNum = parseFloat(xValor.replace(',', '.'));

  return (
    <Screen>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View onLayout={(e) => setAncho(Math.max(100, e.nativeEvent.layout.width))} {...pan.panHandlers}>
          <Svg width={ancho} height={ALTO} style={{ backgroundColor: colors.card }}>
            {lineasX.map((v) => <Line key={`gx${v}`} x1={aPx(v)} y1={0} x2={aPx(v)} y2={ALTO} stroke={grilla} strokeWidth={1} />)}
            {lineasY.map((v) => <Line key={`gy${v}`} x1={0} y1={aPy(v)} x2={ancho} y2={aPy(v)} stroke={grilla} strokeWidth={1} />)}
            <Line x1={0} y1={ejeX} x2={ancho} y2={ejeX} stroke={ejes} strokeWidth={1.5} />
            <Line x1={ejeY} y1={0} x2={ejeY} y2={ALTO} stroke={ejes} strokeWidth={1.5} />
            {lineasX.filter((v) => Math.abs(v) > paso / 2).map((v) => (
              <SvgText key={`lx${v}`} x={aPx(v)} y={Math.min(ALTO - 4, ejeX + 14)} fontSize={10} fill={colors.muted} textAnchor="middle">{etiqueta(v)}</SvgText>
            ))}
            {lineasY.filter((v) => Math.abs(v) > paso / 2).map((v) => (
              <SvgText key={`ly${v}`} x={Math.min(ancho - 4, ejeY + 4)} y={aPy(v) + 3} fontSize={10} fill={colors.muted}>{etiqueta(v)}</SvgText>
            ))}
            <SvgText x={ancho - 10} y={ejeX - 6} fontSize={12} fontWeight="bold" fill={ejes}>x</SvgText>
            <SvgText x={ejeY + 6} y={12} fontSize={12} fontWeight="bold" fill={ejes}>y</SvgText>
            {curvas.map((c, i) => (c.d ? <Path key={i} d={c.d} stroke={COLORES[i]} strokeWidth={2.5} fill="none" /> : null))}
          </Svg>
        </View>
      </Card>

      <Row style={{ justifyContent: 'center' }}>
        <Button variant="soft" title="＋" onPress={() => zoom(0.5)} />
        <Button variant="soft" title="－" onPress={() => zoom(2)} />
        <Button variant="soft" title="←" onPress={() => mover(-1, 0)} />
        <Button variant="soft" title="→" onPress={() => mover(1, 0)} />
        <Button variant="soft" title="↑" onPress={() => mover(0, 1)} />
        <Button variant="soft" title="↓" onPress={() => mover(0, -1)} />
        <Button variant="soft" title="⟲ Centrar" onPress={() => { setCentro({ x: 0, y: 0 }); setEscala(10); }} />
      </Row>
      <Muted>Deslizá el gráfico con el dedo para moverlo. x va de {etiqueta(xMin)} a {etiqueta(xMax)}.</Muted>

      <Card>
        <Title>Funciones</Title>
        {funciones.map((f, i) => (
          <Row key={i} style={{ flexWrap: 'nowrap' }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: COLORES[i] }} />
            <Text style={{ color: colors.text, fontWeight: '700' }}>f{i + 1}(x) =</Text>
            <TextInput
              style={[s.input, { flex: 1 }, curvas[i].error && { borderColor: colors.danger }]}
              placeholder={i === 0 ? 'x^2' : 'opcional'}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              value={f}
              onChangeText={(t) => setFunciones((l) => l.map((x, j) => (j === i ? t : x)))}
            />
          </Row>
        ))}
        {curvas.some((c) => c.error) && <Text style={{ color: colors.danger }}>Hay una función mal escrita (marcada en rojo).</Text>}
        <Muted>Ejemplos (tocá para usar en f1):</Muted>
        <Row>
          {EJEMPLOS.map((e) => (
            <Pressable key={e} onPress={() => setFunciones((l) => [e, l[1], l[2]])} style={s.chip}>
              <Text style={{ color: colors.text }}>{e}</Text>
            </Pressable>
          ))}
        </Row>
        <Chips options={[{ value: 'rad', label: 'Ángulos en radianes' }, { value: 'gra', label: 'En grados' }]} value={radianes ? 'rad' : 'gra'} onChange={(v) => setRadianes(v === 'rad')} />
        <Muted>
          Se escribe así: potencia x^2 · raíz √x o sqrt(x) · sen(x), cos(x), tan(x) · ln(x), log(x) · abs(x) · e^x · π o pi.
          Se puede omitir el ×: 2x, 3sen(x), 2(x+1).
        </Muted>
      </Card>

      <Card>
        <Title>Valor de la función</Title>
        <Row style={{ flexWrap: 'nowrap' }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>x =</Text>
          <TextInput style={[s.input, { flex: 1 }]} keyboardType="numbers-and-punctuation" placeholder="2" placeholderTextColor={colors.muted} value={xValor} onChangeText={setXValor} />
        </Row>
        {!isNaN(xNum) &&
          funciones.map((f, i) => {
            if (!f.trim()) return null;
            let r = '—';
            try { r = formatear(evaluar(f, xNum, radianes)); } catch { r = 'error'; }
            return <Text key={i} style={{ color: COLORES[i], fontWeight: '700', fontSize: 16 }}>f{i + 1}({xValor}) = {r === 'Error' ? 'no existe' : r}</Text>;
          })}
      </Card>
    </Screen>
  );
}
