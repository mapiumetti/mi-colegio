import { useState } from 'react';
import { Alert, Linking, Text } from 'react-native';
import { Button, Card, Field, ListItem, Muted, Row, Screen, Title } from '../../components/ui';
import { abrirPlataforma } from '../../lib/share';
import { uid, useData } from '../../lib/store';
import { colors } from '../../lib/theme';
import type { Sitio } from '../../lib/types';

const conProtocolo = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`);
const dominio = (u: string) => conProtocolo(u).replace(/^https?:\/\//i, '').split('/')[0];

/** Mis Sitios: enlaces guardados, como los favoritos del navegador. */
export default function MisSitios() {
  const { data, update } = useData();
  const [nombre, setNombre] = useState('');
  const [url, setUrl] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const setSitios = (fn: (l: Sitio[]) => Sitio[]) => update((d) => ({ ...d, sitios: fn(d.sitios ?? []) }));
  const sitios = data.sitios ?? [];

  const limpiar = () => { setNombre(''); setUrl(''); setEditId(null); };

  const guardar = () => {
    if (!url.trim()) return Alert.alert('Falta el enlace', 'Escribí o pegá la dirección del sitio.');
    const s: Sitio = { id: editId ?? uid(), nombre: nombre.trim() || dominio(url), url: conProtocolo(url) };
    setSitios((l) => (editId ? l.map((x) => (x.id === editId ? s : x)) : [...l, s]));
    limpiar();
  };

  const mover = (id: string, d: -1 | 1) =>
    setSitios((l) => {
      const i = l.findIndex((x) => x.id === id);
      const j = i + d;
      if (i < 0 || j < 0 || j >= l.length) return l;
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const opciones = (s: Sitio) =>
    Alert.alert(s.nombre, s.url, [
      { text: 'Abrir en Chrome', onPress: () => abrirPlataforma(s.url, true) },
      { text: 'Editar', onPress: () => { setEditId(s.id); setNombre(s.nombre); setUrl(s.url); } },
      { text: 'Subir', onPress: () => mover(s.id, -1) },
      { text: 'Borrar', style: 'destructive', onPress: () => setSitios((l) => l.filter((x) => x.id !== s.id)) },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  return (
    <Screen subirCon={editId}>
      <Card>
        <Title>{editId ? '✏️ Editar sitio' : '⭐ Agregar sitio'}</Title>
        <Field label="Nombre" placeholder="Campus virtual, Khan Academy..." value={nombre} onChangeText={setNombre} />
        <Field label="Enlace" placeholder="www.ejemplo.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={url} onChangeText={setUrl} />
        <Row>
          <Button icon="💾" title={editId ? 'Guardar cambios' : 'Agregar'} onPress={guardar} />
          {editId && <Button variant="soft" title="Cancelar" onPress={limpiar} />}
        </Row>
      </Card>

      <Card>
        <Title>Mis Sitios</Title>
        {sitios.length === 0 && <Muted>Todavía no guardaste sitios. Podés agregar todos los que necesites.</Muted>}
        {sitios.map((s) => (
          <ListItem
            key={s.id}
            left={<Text style={{ fontSize: 22 }}>🔗</Text>}
            title={s.nombre}
            subtitle={dominio(s.url)}
            onPress={() => abrirPlataforma(s.url, false).catch(() => Linking.openURL(s.url))}
            onLongPress={() => opciones(s)}
            right={<Text onPress={() => opciones(s)} style={{ fontSize: 20, color: colors.muted }}>⋯</Text>}
          />
        ))}
        {sitios.length > 0 && <Muted>Tocá un sitio para abrirlo; mantené presionado para editar, ordenar o borrar.</Muted>}
      </Card>
    </Screen>
  );
}
