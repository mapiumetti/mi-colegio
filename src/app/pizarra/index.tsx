import { router } from 'expo-router';
import { Alert, View } from 'react-native';
import { Lienzo } from '../../components/lienzo';
import { Button, Card, ListItem, Muted, Screen } from '../../components/ui';
import { uid, useData } from '../../lib/store';
import type { Pizarra } from '../../lib/types';

/** Lista de pizarras guardadas. */
export default function Pizarras() {
  const { data, update } = useData();
  const lista = [...data.pizarras].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const materia = (id?: string) => data.subjects.find((m) => m.id === id);

  const nueva = () => {
    const p: Pizarra = { id: uid(), titulo: `Pizarra ${data.pizarras.length + 1}`, fecha: new Date().toISOString(), fondo: 'cuadricula', trazos: [] };
    update((d) => ({ ...d, pizarras: [...d.pizarras, p] }));
    router.push({ pathname: '/pizarra/[id]', params: { id: p.id } });
  };

  const borrar = (p: Pizarra) =>
    Alert.alert('Eliminar pizarra', `¿Eliminar "${p.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => update((d) => ({ ...d, pizarras: d.pizarras.filter((x) => x.id !== p.id) })) },
    ]);

  return (
    <Screen>
      <Button icon="✏️" title="Nueva pizarra" onPress={nueva} />
      <Card>
        {lista.length === 0 && (
          <Muted>
            Dibujá con el lápiz en colores, agregá figuras (planas, poliedros y cuerpos redondos), recortalas entre sí y pedile a la IA que
            resuelva lo que escribiste.
          </Muted>
        )}
        {lista.map((p) => (
          <ListItem
            key={p.id}
            left={
              <View style={{ width: 64, height: 48, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
                <View style={{ transform: [{ scale: 0.16 }], transformOrigin: 'top left' }} pointerEvents="none">
                  <Lienzo ancho={400} alto={300} pizarra={p} oscuro={false} />
                </View>
              </View>
            }
            title={p.titulo}
            subtitle={[materia(p.subjectId)?.nombre, new Date(p.fecha).toLocaleDateString('es-AR'), `${p.trazos.length} elemento(s)`].filter(Boolean).join(' · ')}
            onPress={() => router.push({ pathname: '/pizarra/[id]', params: { id: p.id } })}
            onLongPress={() => borrar(p)}
          />
        ))}
        {lista.length > 0 && <Muted>Mantené presionada una pizarra para eliminarla.</Muted>}
      </Card>
    </Screen>
  );
}
