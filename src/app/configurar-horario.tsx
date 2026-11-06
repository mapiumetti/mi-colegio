import { router } from 'expo-router';
import { Alert } from 'react-native';
import { Button, Card, Chips, DateField, Field, Muted, Screen, SwitchRow, Title } from '../components/ui';
import { useData } from '../lib/store';
import { DIAS, TURNO_NOMBRE, dateToHHMM, generarBloques, hhmmToDate } from '../lib/time';
import type { ScheduleConfig, Turno } from '../lib/types';

export default function ConfigurarHorario() {
  const { data, update } = useData();
  const cfg = data.schedule;
  const set = (fn: (c: ScheduleConfig) => ScheduleConfig) => update((d) => ({ ...d, schedule: fn(d.schedule) }));
  const setTurno = (id: Turno['id'], patch: Partial<Turno>) =>
    set((c) => ({ ...c, turnos: c.turnos.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const num = (v: string) => Math.max(0, parseInt(v.replace(/\D/g, ''), 10) || 0);

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
        <SwitchRow
          label="Almuerzo entre turnos (doble turno)"
          value={cfg.almuerzo.activo}
          onChange={(v) => set((c) => ({ ...c, almuerzo: { ...c.almuerzo, activo: v } }))}
        />
        {cfg.almuerzo.activo && (
          <>
            <DateField label="Inicio del almuerzo" mode="time" value={hhmmToDate(cfg.almuerzo.inicio)} onChange={(d) => set((c) => ({ ...c, almuerzo: { ...c.almuerzo, inicio: dateToHHMM(d) } }))} />
            <DateField label="Fin del almuerzo" mode="time" value={hhmmToDate(cfg.almuerzo.fin)} onChange={(d) => set((c) => ({ ...c, almuerzo: { ...c.almuerzo, fin: dateToHHMM(d) } }))} />
          </>
        )}
      </Card>

      <Card>
        <Title>Módulos y recreos</Title>
        <Field label="Duración de cada materia / módulo (minutos)" keyboardType="number-pad" value={String(cfg.duracionModulo)} onChangeText={(v) => set((c) => ({ ...c, duracionModulo: Math.max(5, num(v)) }))} />
        <Field label="Duración del recreo (minutos)" keyboardType="number-pad" value={String(cfg.recreo.duracion)} onChangeText={(v) => set((c) => ({ ...c, recreo: { ...c.recreo, duracion: num(v) } }))} />
        <Field label="Recreo cada cuántos módulos" keyboardType="number-pad" value={String(cfg.recreo.cadaModulos)} onChangeText={(v) => set((c) => ({ ...c, recreo: { ...c.recreo, cadaModulos: num(v) } }))} />
        <Muted>Al generar, se arma la grilla de cada día. Las materias que ya asignaste se conservan si el horario coincide.</Muted>
      </Card>

      <Button icon="✨" title="Generar horario" onPress={generar} />
    </Screen>
  );
}
