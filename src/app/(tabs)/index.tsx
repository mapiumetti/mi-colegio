import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Dot, ListItem, Muted, Row, Screen, Title } from '../../components/ui';
import { ETIQUETA_FERIADO, descargarFeriados } from '../../lib/holidays';
import { TIPO_EVENTO } from '../../lib/notifications';
import { abrirPlataforma } from '../../lib/share';
import { useData } from '../../lib/store';
import { colors } from '../../lib/theme';
import { DIAS_LARGO, formatFecha, formatYmd, toMin, ymd } from '../../lib/time';

export default function Inicio() {
  const { data, update } = useData();

  // Descarga los feriados nacionales (y puentes) una vez por semana, en silencio.
  useEffect(() => {
    const viejo = !data.holidaysUpdated || Date.now() - new Date(data.holidaysUpdated).getTime() > 7 * 86400000;
    if (!viejo) return;
    const anio = new Date().getFullYear();
    Promise.all([descargarFeriados(anio), descargarFeriados(anio + 1).catch(() => [])])
      .then((l) => update((d) => ({ ...d, holidays: l.flat(), holidaysUpdated: new Date().toISOString() })))
      .catch(() => {});
  }, [data.holidaysUpdated, update]);
  const { profile, school, subjects, blocks, events, holidays } = data;
  const hoy = new Date();
  const ahora = hoy.getHours() * 60 + hoy.getMinutes();
  const materia = (id?: string) => subjects.find((x) => x.id === id);
  const clasesHoy = blocks.filter((b) => b.dia === hoy.getDay() && b.tipo === 'materia' && b.subjectId);
  const proximos = events.filter((e) => new Date(e.fecha) >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4);
  const pendientes = data.grades.filter((g) => g.estado === 'pendiente').length;
  const feriadoHoy = holidays.find((h) => h.fecha === ymd(hoy));
  const proxFeriado = holidays.filter((h) => h.fecha > ymd(hoy)).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

  return (
    <Screen>
      <Card style={{ alignItems: 'center' }}>
        {school.logoUri ? (
          <Image source={{ uri: school.logoUri }} style={{ width: 96, height: 96, borderRadius: 16 }} contentFit="contain" />
        ) : (
          <Text style={{ fontSize: 56 }}>🏫</Text>
        )}
        <Title>{school.nombre || 'Mi Colegio'}</Title>
        <Muted>
          {profile.nombre ? `¡Hola, ${profile.nombre}!` : '¡Hola!'} {profile.anio ? `· ${profile.anio} ${profile.curso}` : ''}
        </Muted>
        {!profile.nombre && <Button variant="soft" title="Cargar mis datos" onPress={() => router.push('/perfil')} />}
        {school.plataformaUrl ? (
          <Row>
            <Button icon="🌐" title={school.plataformaNombre || 'Plataforma'} onPress={() => abrirPlataforma(school.plataformaUrl, false)} />
            <Button variant="soft" title="Abrir en Chrome" onPress={() => abrirPlataforma(school.plataformaUrl, true)} />
          </Row>
        ) : (
          <Button variant="soft" icon="🌐" title="Configurar plataforma del colegio" onPress={() => router.push('/colegio')} />
        )}
      </Card>

      {feriadoHoy && (
        <Card style={{ backgroundColor: '#FFF7E6' }}>
          <Title>🎉 Hoy no hay clases</Title>
          <Muted>{feriadoHoy.nombre} · {ETIQUETA_FERIADO[feriadoHoy.tipo]}</Muted>
        </Card>
      )}

      <Card>
        <Title>📅 {DIAS_LARGO[hoy.getDay()]}</Title>
        {clasesHoy.length === 0 ? (
          <Muted>No hay clases cargadas para hoy.</Muted>
        ) : (
          clasesHoy.map((b) => {
            const m = materia(b.subjectId);
            const enCurso = ahora >= toMin(b.inicio) && ahora < toMin(b.fin);
            return (
              <ListItem
                key={b.id}
                left={<Dot color={m?.color ?? colors.muted} />}
                title={m?.nombre ?? 'Materia'}
                subtitle={`${b.inicio} – ${b.fin}${m?.aula ? ` · ${m.aula}` : ''}`}
                right={enCurso ? <Text style={{ color: colors.success, fontWeight: '700' }}>Ahora</Text> : null}
              />
            );
          })
        )}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Title>⏰ Próximos</Title>
          <Button variant="soft" title="+ Agregar" onPress={() => router.push('/evento')} />
        </Row>
        {proximos.length === 0 ? (
          <Muted>Nada agendado. ¡Agregá exámenes, entregas o torneos!</Muted>
        ) : (
          proximos.map((e) => (
            <ListItem
              key={e.id}
              left={<Text style={{ fontSize: 22 }}>{TIPO_EVENTO[e.tipo].emoji}</Text>}
              title={e.titulo}
              subtitle={[formatFecha(e.fecha), materia(e.subjectId)?.nombre].filter(Boolean).join(' · ')}
              onPress={() => router.push({ pathname: '/evento', params: { id: e.id } })}
            />
          ))
        )}
        {pendientes > 0 && <Text style={{ color: colors.warning, fontWeight: '600' }}>Tenés {pendientes} tarea(s) pendiente(s) de entregar.</Text>}
      </Card>

      {proxFeriado && (
        <Card>
          <Title>🇦🇷 Próximo feriado</Title>
          <Muted>{formatYmd(proxFeriado.fecha)} · {proxFeriado.nombre}</Muted>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button style={{ flex: 1 }} variant="soft" icon="🤖" title="Preguntar a la IA" onPress={() => router.push('/ia')} />
        <Button style={{ flex: 1 }} variant="soft" icon="🧮" title="Calculadora" onPress={() => router.push('/calculadora')} />
      </View>
    </Screen>
  );
}
