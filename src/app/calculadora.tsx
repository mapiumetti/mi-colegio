import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Chips, Screen } from '../components/ui';
import { evaluar, formatear } from '../lib/calc';
import { colors } from '../lib/theme';

const BASICA = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['±', '0', ',', '='],
];
const CIENTIFICA = [
  ['sin', 'cos', 'tan', '^'],
  ['√', 'log', 'ln', 'π'],
  ['(', ')', 'x²', 'e'],
];

export default function Calculadora() {
  const [expr, setExpr] = useState('');
  const [resultado, setResultado] = useState('');
  const [modo, setModo] = useState<'basica' | 'cientifica'>('basica');

  const tocar = (k: string) => {
    if (k === 'C') { setExpr(''); setResultado(''); return; }
    if (k === '⌫') { setExpr((e) => e.slice(0, -1)); return; }
    if (k === '=') {
      try {
        const r = formatear(evaluar(expr));
        setResultado(r);
        setExpr(r === 'Error' ? '' : r);
      } catch {
        setResultado('Error');
      }
      return;
    }
    if (k === '±') { setExpr((e) => (e.startsWith('-') ? e.slice(1) : `-(${e})`)); return; }
    if (k === 'x²') { setExpr((e) => `(${e})^2`); return; }
    if (['sin', 'cos', 'tan', '√', 'log', 'ln'].includes(k)) { setExpr((e) => `${e}${k}(`); return; }
    setExpr((e) => e + k);
  };

  const filas = modo === 'cientifica' ? [...CIENTIFICA, ...BASICA] : BASICA;
  let vistaPrevia = '';
  try { vistaPrevia = expr ? formatear(evaluar(expr)) : ''; } catch { /* expresión incompleta */ }

  return (
    <Screen scroll={false}>
      <Chips options={[{ value: 'basica', label: 'Básica' }, { value: 'cientifica', label: 'Científica (grados)' }]} value={modo} onChange={(v) => setModo(v as 'basica' | 'cientifica')} />
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 8 }}>
        <Text style={{ fontSize: 30, color: colors.text, textAlign: 'right' }} numberOfLines={2}>{expr || '0'}</Text>
        <Text style={{ fontSize: 22, color: colors.muted, textAlign: 'right' }}>{resultado === 'Error' ? 'Error' : vistaPrevia && vistaPrevia !== expr ? `= ${vistaPrevia}` : ''}</Text>
      </View>
      <View style={{ gap: 8 }}>
        {filas.map((fila, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            {fila.map((k) => {
              const op = ['÷', '×', '-', '+', '='].includes(k);
              const fn = i < (modo === 'cientifica' ? CIENTIFICA.length : 0);
              return (
                <Pressable
                  key={k}
                  onPress={() => tocar(k)}
                  style={({ pressed }) => ({
                    flex: 1, height: fn ? 48 : 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: op ? colors.primary : fn ? colors.primarySoft : colors.card,
                    borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: fn ? 18 : 24, fontWeight: '600', color: op ? colors.onPrimary : colors.text }}>{k}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </Screen>
  );
}
