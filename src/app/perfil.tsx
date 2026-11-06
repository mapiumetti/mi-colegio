import { Card, Field, Muted, Screen } from '../components/ui';
import { useData } from '../lib/store';
import type { Profile } from '../lib/types';

export default function Perfil() {
  const { data, update } = useData();
  const p = data.profile;
  const set = (k: keyof Profile) => (v: string) => update((d) => ({ ...d, profile: { ...d.profile, [k]: v } }));
  return (
    <Screen>
      <Card>
        <Field label="Nombre" value={p.nombre} onChangeText={set('nombre')} />
        <Field label="Apellido" value={p.apellido} onChangeText={set('apellido')} />
        <Field label="Edad" keyboardType="number-pad" value={p.edad} onChangeText={set('edad')} />
        <Field label="Año" placeholder="3° año" value={p.anio} onChangeText={set('anio')} />
        <Field label="Curso / división" placeholder="B" value={p.curso} onChangeText={set('curso')} />
        <Field label="Orientación" placeholder="Ciencias Naturales" value={p.orientacion} onChangeText={set('orientacion')} />
        <Field label="Email" keyboardType="email-address" autoCapitalize="none" value={p.email} onChangeText={set('email')} />
        <Field label="Teléfono" keyboardType="phone-pad" value={p.telefono} onChangeText={set('telefono')} />
        <Muted>Los datos se guardan solo en este teléfono.</Muted>
      </Card>
    </Screen>
  );
}
