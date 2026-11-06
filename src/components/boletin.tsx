import { useState } from 'react';
import { Text } from 'react-native';
import { SISTEMAS, sistemaSugerido } from '../lib/grades';
import { useData } from '../lib/store';
import { colors } from '../lib/theme';
import type { BoletinConfig, SistemaBoletin } from '../lib/types';
import { Button, Card, Chips, Field, Muted, Title } from './ui';

/** Asistente para configurar cómo es el boletín del colegio. */
export function ConfigBoletin({ alTerminar }: { alTerminar?: () => void }) {
  const { data, update } = useData();
  const actual = data.settings.boletin;
  const [cfg, setCfg] = useState<BoletinConfig>(
    actual.configurado ? actual : { ...actual, sistema: sistemaSugerido(data.schoolCalendar.provincia), notaAprobacion: SISTEMAS[sistemaSugerido(data.schoolCalendar.provincia)].aprobacion },
  );
  const guardar = () => {
    update((d) => ({ ...d, settings: { ...d.settings, boletin: { ...cfg, configurado: true } } }));
    alTerminar?.();
  };
  return (
    <Card>
      <Title>📋 ¿Cómo es tu boletín?</Title>
      <Muted>1. ¿Los cuatrimestres se promedian o hay que aprobar cada uno por separado?</Muted>
      <Chips
        options={[{ value: 'promedian', label: 'Se promedian' }, { value: 'individual', label: 'Se aprueba cada uno' }]}
        value={cfg.cuatrimestres}
        onChange={(v) => setCfg({ ...cfg, cuatrimestres: v as BoletinConfig['cuatrimestres'] })}
      />
      <Muted>2. ¿Cómo califica tu jurisdicción? (Vos cargás números y la app arma el boletín.)</Muted>
      <Chips
        options={(Object.keys(SISTEMAS) as SistemaBoletin[]).map((s) => ({ value: s, label: SISTEMAS[s].nombre }))}
        value={cfg.sistema}
        onChange={(v) => setCfg({ ...cfg, sistema: v as SistemaBoletin, notaAprobacion: SISTEMAS[v as SistemaBoletin].aprobacion })}
      />
      {SISTEMAS[cfg.sistema].escala.map((e) => (
        <Text key={e.sigla} style={{ color: colors.text }}>
          <Text style={{ fontWeight: '800' }}>{e.sigla}</Text> {e.nombre}: <Text style={{ color: colors.muted }}>{e.detalle}</Text>
        </Text>
      ))}
      <Field
        label="3. Nota mínima para aprobar"
        keyboardType="decimal-pad"
        value={String(cfg.notaAprobacion).replace('.', ',')}
        onChangeText={(v) => setCfg({ ...cfg, notaAprobacion: parseFloat(v.replace(',', '.')) || 0 })}
      />
      <Button title="Guardar" onPress={guardar} />
    </Card>
  );
}

