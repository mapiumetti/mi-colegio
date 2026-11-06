import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, Chips, DateField, Field, Muted, Row, Screen, SwitchRow, Title } from '../components/ui';
import { colors } from '../lib/theme';
import { useData } from '../lib/store';
import { DIAS, DIAS_LARGO, TURNO_NOMBRE, dateToHHMM, fromMin, generarBloques, hhmmToDate, horarioTurno, toMin } from '../lib/time';
import type { ScheduleConfig, Turno } from '../lib/types';

export default function ConfigurarHorario() {
  const { data, update } = useData();
  const cfg = data.schedule;
  const set = (fn: (c: ScheduleConfig) => ScheduleConfig) => update((d) => ({ ...d, schedule: fn(d.schedule) }));
  const setTurno = (id: Turno['id'], patch: Partial<Turno>) =>
    set((c) => ({ ...c, turnos: c.turnos.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const num = (v: string) => Math.max(0, parseInt(v.replace(/\D/g, ''), 10) || 0);
  const [diaEdit, setDiaEdit] = useState<number>(cfg.dias[0] ?? 1);
  const recreos = cfg.recreos ?? [];
  const durAlmuerzo = Math.max(0, toMin(cfg.almuerzo.fin) - toMin(cfg.almuerzo.inicio));

  const setPorDia = (dia: number, turno: Turno['id'], patch: { entrada?: string; salida?: string } | null) =>
    set((c) => {
      const porDia = { ...(c.porDia ?? {}) };
      const delDia = { ...(porDia[String(dia)] ?? {}) };
      if (patch === null) delete delDia[turno];
      else delDia[turno] = { ...horarioTurno(c, dia, turno), ...patch };
      porDia[String(dia)] = delDia;
      return { ...c, porDia };
    });

  const setRecreos = (lista: { despuesDe: number; duracion: number }[]) =>
    set((c) => ({ ...c, recreos: [...lista].sort((a, b) => a.despuesDe - b.despuesDe) }));
  const agregarRecreo = () => {
    const ult = recreos[recreos.length - 1]?.despuesDe ?? 0;
    setRecreos([...recreos, { despuesDe: ult + 2, duracion: 10 }]);
  };

  const generar = () => {
    if (!cfg.turnos.some((t) => t.activo)) {
      Alert.alert('Elegí un turno', 'Activá al menos un turno.');
      return;
    }
    update((d) => ({ ...d, blocks: generarBloques(d.schedule, d.blocks) }));
    router.back();
  };

  return (
    <Screen>
      <Card>
        <Title>Días de clase</Title>
        <Chips
          multi
          options={[1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: DIAS[d] }))}
          value={cfg.dias}
          onChange={(d) => set((c) => ({ ...c, dias: c.dias.includes(d) ? c.dias.filter((x) => x !== d) : [...c.dias, d].sort() }))}
        />
      </Card>

      {cfg.turnos.map((t) => (
        <Card key={t.id}>
          <SwitchRow label={`Turno ${TURNO_NOMBRE[t.id]}`} value={t.activo} onChange={(v) => setTurno(t.id, { activo: v })} />
          {t.activo && (
            <>
              <DateField label="Entrada" mode="time" value={hhmmToDate(t.entrada)} onChange={(d) => setTurno(t.id, { entrada: dateToHHMM(d) })} />
              <DateField label="Salida" mode="time" value={hhmmToDate(t.salida)} onChange={(d) => setTurno(t.id, { salida: dateToHHMM(d) })} />
            </>
          )}
        </Card>
      ))}

      <Card>
        <Title>📅 Horario distinto según el día</Title>
        <Muted>Si algún día salís más tarde (p. ej. los martes hasta las 14:15), elegí el día y cambiá la entrada o la salida. Los demás días usan el horario general.</Muted>
        <Chips options={cfg.dias.map((d) => ({ value: d, label: DIAS[d] }))} value={diaEdit} onChange={setDiaEdit} />
        {cfg.turnos.filter((t) => t.activo).map((t) => {
          const h = horarioTurno(cfg, diaEdit, t.id);
          const propio = !!cfg.porDia?.[String(diaEdit)]?.[t.id];
          return (
            <View key={t.id} style={{ gap: 8 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {DIAS_LARGO[diaEdit]} · {TURNO_NOMBRE[t.id]} {propio ? '(horario propio)' : '(horario general)'}
              </Text>
              <Row style={{ flexWrap: 'nowrap' }}>
                <View style={{ flex: 1 }}><DateField label="Entrada" mode="time" value={hhmmToDate(h.entrada)} onChange={(d) => setPorDia(diaEdit, t.id, { entrada: dateToHHMM(d) })} /></View>
                <View style={{ flex: 1 }}><DateField label="Salida" mode="time" value={hhmmToDate(h.salida)} onChange={(d) => setPorDia(diaEdit, t.id, { salida: dateToHHMM(d) })} /></View>
              </Row>
              {propio && <Button variant="soft" title="Volver al horario general" onPress={() => setPorDia(diaEdit, t.id, null)} />}
            </View>
          );
        })}
      </Card>

      <Card>
        <SwitchRow
          label="🍽️ Almuerzo"
          value={cfg.almuerzo.activo}
          onChange={(v) => set((c) => ({ ...c, almuerzo: { ...c.almuerzo, activo: v } }))}
        />
        {cfg.almuerzo.activo && (
          <>
            <DateField
              label="Hora de inicio del almuerzo"
              mode="time"
              value={hhmmToDate(cfg.almuerzo.inicio)}
              onChange={(d) => set((c) => ({ ...c, almuerzo: { ...c.almuerzo, inicio: dateToHHMM(d), fin: fromMin(toMin(dateToHHMM(d)) + durAlmuerzo) } }))}
            />
            <Field
              label="Duración del almuerzo (minutos)"
              keyboardType="number-pad"
              value={String(durAlmuerzo)}
              onChangeText={(v) => set((c) => ({ ...c, almuerzo: { ...c.almuerzo, fin: fromMin(toMin(c.almuerzo.inicio) + num(v)) } }))}
            />
            <Muted>Termina a las {cfg.almuerzo.fin}. Si una clase cae en ese horario, se corre para después del almuerzo.</Muted>
          </>
        )}
      </Card>

      <Card>
        <Title>⏰ Módulos</Title>
        <Field label="Duración de cada materia / módulo (minutos)" keyboardType="number-pad" value={String(cfg.duracionModulo)} onChangeText={(v) => set((c) => ({ ...c, duracionModulo: Math.max(5, num(v)) }))} />
      </Card>

      <Card>
        <Title>☕ Recreos</Title>
        {recreos.length === 0 ? (
          <>
            <Muted>Todos los recreos duran lo mismo. Si algunos son de 5 minutos y otros de 15, tocá "Recreos con distinta duración".</Muted>
            <Field label="Duración del recreo (minutos)" keyboardType="number-pad" value={String(cfg.recreo.duracion)} onChangeText={(v) => set((c) => ({ ...c, recreo: { ...c.recreo, duracion: num(v) } }))} />
            <Field label="Recreo cada cuántos módulos" keyboardType="number-pad" value={String(cfg.recreo.cadaModulos)} onChangeText={(v) => set((c) => ({ ...c, recreo: { ...c.recreo, cadaModulos: num(v) } }))} />
            <Button
              variant="soft"
              icon="⏱️"
              title="Recreos con distinta duración"
              onPress={() => {
                const cada = Math.max(1, cfg.recreo.cadaModulos);
                setRecreos([1, 2, 3].map((i) => ({ despuesDe: cada * i, duracion: cfg.recreo.duracion })));
              }}
            />
          </>
        ) : (
          <>
            <Muted>Cada recreo con su duración. "Después del módulo 2" = después de la 2ª hora de clase de cada turno.</Muted>
            {recreos.map((r, i) => (
              <Row key={i} style={{ flexWrap: 'nowrap' }}>
                <View style={{ flex: 1 }}>
                  <Field label="Después del módulo" keyboardType="number-pad" value={String(r.despuesDe)} onChangeText={(v) => setRecreos(recreos.map((x, j) => (j === i ? { ...x, despuesDe: Math.max(1, num(v)) } : x)))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Minutos" keyboardType="number-pad" value={String(r.duracion)} onChangeText={(v) => setRecreos(recreos.map((x, j) => (j === i ? { ...x, duracion: num(v) } : x)))} />
                </View>
                <Button variant="danger" title="✕" style={{ marginTop: 18 }} onPress={() => setRecreos(recreos.filter((_, j) => j !== i))} />
              </Row>
            ))}
            <Row>
              <Button variant="soft" icon="➕" title="Agregar recreo" onPress={agregarRecreo} />
              <Button variant="soft" title="Todos iguales" onPress={() => setRecreos([])} />
            </Row>
          </>
        )}
        <Muted>Al generar, se arma la grilla de cada día. Las materias que ya asignaste se conservan si el horario coincide.</Muted>
      </Card>

      <Button icon="✨" title="Generar horario" onPress={generar} />
    </Screen>
  );
}
