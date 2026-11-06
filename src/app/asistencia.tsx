import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Button, Card, Chips, DateField, Field, ListItem, Muted, Row, Screen, SwitchRow, Title } from '../components/ui';
import { motivoSinClases } from '../lib/fechas';
import { guardarCopia, mimeDe, subcarpeta } from '../lib/files';
import { compartirArchivo } from '../lib/share';
import { uid, useData } from '../lib/store';
import { colors } from '../lib/theme';
import { formatYmd, ymd } from '../lib/time';
import type { Asistencia, Conducta } from '../lib/types';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const VALORES = [0.25, 0.5, 0.75, 1];
const FRACCION: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾', '1': '1' };
const COLOR = { asistio: '#22C55E', cuarto: '#FACC15', medio: '#FB923C', entera: '#EF4444', sinClases: '#60A5FA' };

/** "1,75" → 1,75 · "2" → 2 */
const fmt = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');
const fraccion = (n: number) => FRACCION[String(n)] ?? fmt(n);
const numero = (v: string, min = 0) => Math.max(min, parseFloat(v.replace(',', '.')) || 0);

export default function AsistenciaConducta() {
  const { data, update } = useData();
  const asis = data.asistencia;
  const cond = data.conducta;
  const setAsis = (fn: (a: Asistencia) => Asistencia) => update((d) => ({ ...d, asistencia: fn(d.asistencia) }));
  const setCond = (fn: (c: Conducta) => Conducta) => update((d) => ({ ...d, conducta: fn(d.conducta) }));

  // ---------- Faltas ----------
  const [fecha, setFecha] = useState(new Date());
  const [valor, setValor] = useState(1);
  const [justificada, setJustificada] = useState(false);
  const [certificado, setCertificado] = useState<string | undefined>();
  const [nota, setNota] = useState('');

  const total = asis.faltas.reduce((a, f) => a + f.valor, 0);
  const totalJust = asis.faltas.filter((f) => f.justificada).reduce((a, f) => a + f.valor, 0);
  const quedan = asis.limite - total;

  const adjuntar = async (desde: 'camara' | 'archivo') => {
    const dir = subcarpeta('Certificados');
    if (desde === 'camara') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permiso necesario', 'Habilitá la cámara en los ajustes.');
      const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!r.canceled) setCertificado(guardarCopia(r.assets[0].uri, dir, `certificado-${ymd(fecha)}.jpg`).uri);
    } else {
      const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (!r.canceled) setCertificado(guardarCopia(r.assets[0].uri, dir, r.assets[0].name).uri);
    }
  };

  const verCertificado = async (uri: string) => {
    const f = new File(uri);
    try {
      await f.preview({ title: f.name, mimeType: mimeDe(f.name) });
    } catch {
      await compartirArchivo(uri, mimeDe(f.name));
    }
  };

  const confirmarFalta = () => {
    const dia = ymd(fecha);
    const sin = motivoSinClases(data, dia);
    const texto =
      `${formatYmd(dia)}: ${fraccion(valor)} de falta ${justificada ? 'JUSTIFICADA' : 'sin justificar'}.` +
      `${justificada && !certificado ? '\n\nTodavía no adjuntaste el certificado (lo podés agregar después).' : ''}` +
      `${sin ? `\n\nOjo: ese día figura sin clases (${sin}).` : ''}` +
      `\n\nTe quedarían ${fmt(quedan - valor)} faltas.`;
    Alert.alert('¿Confirmar falta?', texto, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: () => {
          setAsis((a) => ({
            ...a,
            faltas: [...a.faltas, { id: uid(), fecha: dia, valor, justificada, certificadoUri: justificada ? certificado : undefined, nota: nota.trim() || undefined }],
          }));
          setCertificado(undefined);
          setNota('');
          setJustificada(false);
          const restan = quedan - valor;
          if (restan <= 0) Alert.alert('⚠️ Límite alcanzado', 'Llegaste al total de faltas permitido. Consultá con preceptoría por la reincorporación.');
          else if (restan <= 5) Alert.alert('⚠️ Atención', `Te quedan solo ${fmt(restan)} faltas.`);
        },
      },
    ]);
  };

  const opcionesFalta = (id: string) => {
    const f = asis.faltas.find((x) => x.id === id);
    if (!f) return;
    Alert.alert(`${formatYmd(f.fecha)} · ${fraccion(f.valor)}`, f.nota, [
      ...(f.certificadoUri ? [{ text: 'Ver certificado', onPress: () => verCertificado(f.certificadoUri!) }] : []),
      { text: f.justificada ? 'Marcar sin justificar' : 'Marcar justificada', onPress: () => setAsis((a) => ({ ...a, faltas: a.faltas.map((x) => (x.id === id ? { ...x, justificada: !x.justificada } : x)) })) },
      { text: 'Borrar', style: 'destructive', onPress: () => setAsis((a) => ({ ...a, faltas: a.faltas.filter((x) => x.id !== id) })) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // ---------- Calendario mensual ----------
  const [mes, setMes] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const hoy = ymd(new Date());
  const offset = (mes.getDay() + 6) % 7;
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas: (Date | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))];
  const { inicioClases, finClases } = data.schoolCalendar;

  const colorDia = (d: Date): string | null => {
    const dia = ymd(d);
    if (motivoSinClases(data, dia)) return COLOR.sinClases;
    const falta = Math.min(1, asis.faltas.filter((f) => f.fecha === dia).reduce((a, f) => a + f.valor, 0));
    if (falta >= 1) return COLOR.entera;
    if (falta >= 0.5) return COLOR.medio;
    if (falta > 0) return COLOR.cuarto;
    const esDiaDeClase = data.schedule.dias.includes(d.getDay());
    const enCiclo = (!inicioClases || dia >= inicioClases) && (!finClases || dia <= finClases);
    return esDiaDeClase && enCiclo && dia <= hoy ? COLOR.asistio : null;
  };

  // ---------- Conducta ----------
  const [motivo, setMotivo] = useState('');
  const [valorSancion, setValorSancion] = useState(0.25);
  const suma = cond.registros.reduce((a, r) => a + r.valor, 0);
  const esCreditos = cond.sistema === 'creditos';
  const actual = esCreditos ? cond.creditosIniciales - suma : suma;
  const enAlerta = esCreditos ? actual <= cond.alertaCreditos : actual >= cond.alertaAmonestaciones;
  const alMaximo = esCreditos ? actual <= 0 : actual >= cond.maximoAmonestaciones;

  const cargarSancion = () => {
    const nuevo = esCreditos ? actual - valorSancion : actual + valorSancion;
    Alert.alert(
      esCreditos ? '¿Descontar créditos?' : '¿Sumar amonestaciones?',
      `${fmt(valorSancion)} ${esCreditos ? 'crédito(s)' : 'amonestación(es)'}${motivo.trim() ? ` · ${motivo.trim()}` : ''}.\nQuedarías en ${fmt(nuevo)}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setCond((c) => ({ ...c, registros: [...c.registros, { id: uid(), fecha: hoy, valor: valorSancion, motivo: motivo.trim() }] }));
            setMotivo('');
            if (esCreditos ? nuevo <= 0 : nuevo >= cond.maximoAmonestaciones) Alert.alert('🚨 Máximo alcanzado', esCreditos ? 'Te quedaste sin créditos.' : 'Llegaste al máximo de amonestaciones.');
            else if (esCreditos ? nuevo <= cond.alertaCreditos : nuevo >= cond.alertaAmonestaciones)
              Alert.alert('⚠️ Atención', esCreditos ? `Te quedan ${fmt(nuevo)} créditos.` : `Llevás ${fmt(nuevo)} amonestaciones.`);
          },
        },
      ],
    );
  };

  return (
    <Screen>
      {/* Resumen de faltas */}
      <Card>
        <Title>🙋 Asistencia</Title>
        <Row style={{ justifyContent: 'space-around' }}>
          {[
            ['Faltas', fmt(total), colors.text],
            ['Justificadas', fmt(totalJust), colors.text],
            ['Te quedan', fmt(quedan), quedan <= 0 ? colors.danger : quedan <= 5 ? colors.warning : colors.success],
          ].map(([l, v, c]) => (
            <View key={l} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: c }}>{v}</Text>
              <Muted>{l}</Muted>
            </View>
          ))}
        </Row>
        <Field
          label="Total de faltas permitido (1ª instancia)"
          keyboardType="decimal-pad"
          value={fmt(asis.limite)}
          onChangeText={(v) => setAsis((a) => ({ ...a, limite: numero(v) }))}
        />
      </Card>

      {/* Cargar falta */}
      <Card>
        <Title>Cargar falta</Title>
        <DateField label="Día" mode="date" value={fecha} onChange={setFecha} />
        <Chips options={VALORES.map((v) => ({ value: v, label: fraccion(v) }))} value={valor} onChange={setValor} />
        <SwitchRow label="☑️ La falta está justificada" value={justificada} onChange={setJustificada} />
        {justificada && (
          <>
            <Muted>Certificado médico (foto o PDF):</Muted>
            <Row>
              <Button variant="soft" icon="📷" title="Sacar foto" onPress={() => adjuntar('camara')} />
              <Button variant="soft" icon="📄" title="Elegir PDF o imagen" onPress={() => adjuntar('archivo')} />
            </Row>
            {certificado && (
              <Pressable onPress={() => verCertificado(certificado)}>
                <Text style={{ color: colors.success, fontWeight: '700' }}>✅ Adjunto: {new File(certificado).name} (tocá para ver)</Text>
              </Pressable>
            )}
          </>
        )}
        <Field label="Nota (opcional)" placeholder="Turno médico, llegada tarde..." value={nota} onChangeText={setNota} />
        <Button icon="✔️" title="Confirmar falta" onPress={confirmarFalta} />
      </Card>

      {/* Calendario */}
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Button variant="soft" title="‹" onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} />
          <Title>{MESES[mes.getMonth()]} {mes.getFullYear()}</Title>
          <Button variant="soft" title="›" onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} />
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <Text key={d} style={{ width: '14.28%', textAlign: 'center', color: colors.muted, fontWeight: '600' }}>{d}</Text>
          ))}
          {celdas.map((d, i) => {
            if (!d) return <View key={`v${i}`} style={{ width: '14.28%', height: 42 }} />;
            const c = colorDia(d);
            return (
              <View key={i} style={{ width: '14.28%', height: 42, padding: 3 }}>
                <View style={{ flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c ?? 'transparent', borderWidth: ymd(d) === hoy ? 2 : 0, borderColor: colors.text }}>
                  <Text style={{ color: c ? '#111827' : colors.text, fontWeight: '700' }}>{d.getDate()}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <Row>
          {[
            [COLOR.asistio, 'Asistió'], [COLOR.cuarto, '¼ falta'], [COLOR.medio, '½ o ¾'], [COLOR.entera, '1 falta'], [COLOR.sinClases, 'Feriado / sin clases'],
          ].map(([c, l]) => (
            <Row key={l} style={{ gap: 4 }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: c }} />
              <Muted>{l}</Muted>
            </Row>
          ))}
        </Row>
      </Card>

      {/* Lista de faltas */}
      {asis.faltas.length > 0 && (
        <Card>
          <Title>Faltas cargadas</Title>
          {[...asis.faltas].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((f) => (
            <ListItem
              key={f.id}
              left={<View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: f.valor >= 1 ? COLOR.entera : f.valor >= 0.5 ? COLOR.medio : COLOR.cuarto }} />}
              title={`${formatYmd(f.fecha)} · ${fraccion(f.valor)}`}
              subtitle={[f.justificada ? 'Justificada' : 'Sin justificar', f.certificadoUri ? '📎 certificado' : '', f.nota].filter(Boolean).join(' · ')}
              onPress={() => opcionesFalta(f.id)}
            />
          ))}
        </Card>
      )}

      {/* Conducta */}
      <Card>
        <Title>⚖️ Conducta</Title>
        <Chips
          options={[{ value: 'creditos', label: 'Sistema de créditos' }, { value: 'amonestaciones', label: 'Amonestaciones' }]}
          value={cond.sistema}
          onChange={(v) => setCond((c) => ({ ...c, sistema: v as Conducta['sistema'] }))}
        />
        <View style={{ alignItems: 'center', padding: 8, borderRadius: 12, backgroundColor: alMaximo ? '#FDECEC' : enAlerta ? '#FFF7E6' : colors.primarySoft }}>
          <Text style={{ fontSize: 34, fontWeight: '800', color: alMaximo ? colors.danger : enAlerta ? '#B45309' : colors.dark && !enAlerta ? colors.text : colors.primary }}>{fmt(actual)}</Text>
          <Text style={{ color: alMaximo ? colors.danger : enAlerta ? '#B45309' : colors.dark ? colors.text : colors.primary, fontWeight: '600' }}>
            {esCreditos ? `créditos de ${fmt(cond.creditosIniciales)}` : `amonestaciones (máximo ${fmt(cond.maximoAmonestaciones)})`}
          </Text>
          {alMaximo ? <Text style={{ color: colors.danger, fontWeight: '800' }}>🚨 Llegaste al máximo</Text> : enAlerta ? <Text style={{ color: '#B45309', fontWeight: '800' }}>⚠️ Atención</Text> : null}
        </View>
        <Muted>{esCreditos ? 'Se descuentan créditos de a 1 o fracciones de 0,25.' : 'Las amonestaciones se suman desde 0, de a 1 o fracciones de 0,25.'}</Muted>
        <Chips options={VALORES.map((v) => ({ value: v, label: fmt(v) }))} value={valorSancion} onChange={setValorSancion} />
        <Field label="Motivo (opcional)" placeholder="Uso del celular, llegada tarde..." value={motivo} onChangeText={setMotivo} />
        <Button variant={esCreditos ? 'danger' : 'primary'} icon={esCreditos ? '➖' : '➕'} title={esCreditos ? 'Descontar créditos' : 'Sumar amonestaciones'} onPress={cargarSancion} />

        {esCreditos ? (
          <Row style={{ flexWrap: 'nowrap' }}>
            <View style={{ flex: 1 }}><Field label="Créditos iniciales" keyboardType="decimal-pad" value={fmt(cond.creditosIniciales)} onChangeText={(v) => setCond((c) => ({ ...c, creditosIniciales: numero(v) }))} /></View>
            <View style={{ flex: 1 }}><Field label="Avisar al llegar a" keyboardType="decimal-pad" value={fmt(cond.alertaCreditos)} onChangeText={(v) => setCond((c) => ({ ...c, alertaCreditos: numero(v) }))} /></View>
          </Row>
        ) : (
          <Row style={{ flexWrap: 'nowrap' }}>
            <View style={{ flex: 1 }}><Field label="Avisar al llegar a" keyboardType="decimal-pad" value={fmt(cond.alertaAmonestaciones)} onChangeText={(v) => setCond((c) => ({ ...c, alertaAmonestaciones: numero(v) }))} /></View>
            <View style={{ flex: 1 }}><Field label="Máximo admitido" keyboardType="decimal-pad" value={fmt(cond.maximoAmonestaciones)} onChangeText={(v) => setCond((c) => ({ ...c, maximoAmonestaciones: numero(v) }))} /></View>
          </Row>
        )}

        {[...cond.registros].reverse().map((r) => (
          <ListItem
            key={r.id}
            title={`${esCreditos ? '−' : '+'}${fmt(r.valor)} · ${formatYmd(r.fecha)}`}
            subtitle={r.motivo || undefined}
            onLongPress={() =>
              Alert.alert('Borrar registro', '¿Seguro?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Borrar', style: 'destructive', onPress: () => setCond((c) => ({ ...c, registros: c.registros.filter((x) => x.id !== r.id) })) },
              ])
            }
          />
        ))}
        {cond.registros.length > 0 && <Muted>Mantené presionado un registro para borrarlo.</Muted>}
      </Card>
    </Screen>
  );
}
