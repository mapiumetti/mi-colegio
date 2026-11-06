import { useRef, useState, type ComponentRef } from 'react';
import { Alert, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { ConfigBoletin } from '../components/boletin';
import { Button, Card, Muted, NotaBadge, Row, Screen, Title } from '../components/ui';
import { SISTEMAS, concepto, resumenMateria } from '../lib/grades';
import { compartirArchivo } from '../lib/share';
import { useData } from '../lib/store';
import { colors } from '../lib/theme';

const COL = { materia: 120, nota: 62, estado: 84 };

export default function Boletin() {
  const { data } = useData();
  const cfg = data.settings.boletin;
  const [editar, setEditar] = useState(false);
  const filas = data.subjects.map((m) => ({ m, r: resumenMateria(data.grades.filter((g) => g.subjectId === m.id), cfg) }));

  const celda = (n: number | null) => {
    const c = concepto(cfg.sistema, n);
    return <NotaBadge nota={n} texto={n == null ? '—' : c ? c.sigla : n.toFixed(1).replace('.', ',')} />;
  };

  const hoja = useRef<ComponentRef<typeof View>>(null);
  const [compartiendo, setCompartiendo] = useState(false);
  const hayRecup = filas.some(({ r }) => r.recuperatorio != null);

  // Se comparte siempre como imagen (WhatsApp, Telegram, mail, Drive...).
  const compartir = async () => {
    setCompartiendo(true);
    try {
      const uri = await captureRef(hoja as unknown as Parameters<typeof captureRef>[0], { format: 'png', quality: 1, result: 'tmpfile' });
      await compartirArchivo(uri.startsWith('file://') ? uri : `file://${uri}`, 'image/png');
    } catch {
      Alert.alert('No se pudo', 'No se pudo armar la imagen del boletín.');
    } finally {
      setCompartiendo(false);
    }
  };

  if (editar || !cfg.configurado) return <Screen><ConfigBoletin alTerminar={() => setEditar(false)} /></Screen>;

  return (
    <Screen>
      <Card>
        <Title>{SISTEMAS[cfg.sistema].nombre}</Title>
        <Muted>
          {cfg.cuatrimestres === 'promedian' ? 'Los cuatrimestres se promedian.' : 'Cada cuatrimestre se aprueba por separado.'} Aprobación: {String(cfg.notaAprobacion).replace('.', ',')}
        </Muted>
        <Row>
          <Button variant="soft" title="Cambiar sistema" onPress={() => setEditar(true)} />
          <Button variant="soft" icon="🖼️" title="Compartir como imagen" onPress={compartir} disabled={compartiendo || filas.length === 0} />
        </Row>
      </Card>
      <View ref={hoja} collapsable={false} style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
          📋 Boletín{data.profile.nombre ? ` de ${data.profile.nombre} ${data.profile.apellido}`.trimEnd() : ''}
        </Text>
        <Muted>
          {[data.school.nombre, [data.profile.anio, data.profile.curso].filter(Boolean).join(' '), SISTEMAS[cfg.sistema].nombre, new Date().toLocaleDateString('es-AR')].filter(Boolean).join(' · ')}
        </Muted>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              {['Materia', '1° C', '2° C', 'Final', ...(hayRecup ? ['Recup.'] : []), 'Estado'].map((h, i, arr) => (
                <Text key={h} style={{ width: i === 0 ? COL.materia : i === arr.length - 1 ? COL.estado : COL.nota, color: colors.muted, fontWeight: '700' }}>{h}</Text>
              ))}
            </View>
            {filas.map(({ m, r }) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ width: COL.materia, color: colors.text, fontWeight: '600' }} numberOfLines={2}>{m.nombre}</Text>
                <View style={{ width: COL.nota }}>{celda(r.c1)}</View>
                <View style={{ width: COL.nota }}>{celda(r.c2)}</View>
                <View style={{ width: COL.nota }}>{celda(r.final)}</View>
                {hayRecup && <View style={{ width: COL.nota }}>{r.recuperatorio != null ? celda(r.recuperatorio) : null}</View>}
                <Text style={{ width: COL.estado, fontWeight: '700', color: r.aprobada === true ? colors.success : r.aprobada === false ? colors.danger : colors.muted }}>
                  {r.aprobada === true ? 'Aprobada' : r.aprobada === false ? 'A recuperar' : 'En curso'}
                </Text>
              </View>
            ))}
            {filas.length === 0 && <Muted>Todavía no hay materias.</Muted>}
          </View>
      </View>
      {SISTEMAS[cfg.sistema].escala.length > 0 && (
        <Card>
          <Title>Referencias</Title>
          {SISTEMAS[cfg.sistema].escala.map((e) => (
            <Text key={e.sigla} style={{ color: colors.text }}>
              <Text style={{ fontWeight: '800' }}>{e.sigla}</Text> {e.nombre}: <Text style={{ color: colors.muted }}>{e.detalle}</Text>
            </Text>
          ))}
        </Card>
      )}
    </Screen>
  );
}
