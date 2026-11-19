import { Fragment } from 'react';
import Svg, { ClipPath, Defs, G, Line, Mask, Path, Rect, Text as SvgText } from 'react-native-svg';
import { caminoLapiz, geometria, limites } from '../lib/pizarra';
import type { Pizarra, Trazo } from '../lib/types';

const transparente = (hex: string, alfa: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex + alfa : hex);

/** Dibuja una figura (contorno + aristas) con su color, relleno y grosor. */
function Figura({ t, mask, clip, soloBorde }: { t: Trazo; mask?: string; clip?: string; soloBorde?: boolean }) {
  const g = geometria(t);
  const comun = { stroke: t.color, strokeWidth: t.grosor, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <G mask={mask} clipPath={clip}>
      {g.contorno && <Path d={g.contorno} fill={t.relleno && !soloBorde ? transparente(t.color, '55') : 'none'} {...comun} />}
      {g.lineas.map((l, i) => (
        <Path key={i} d={l.d} fill="none" {...comun} strokeDasharray={l.punteada ? [t.grosor * 2 + 4, t.grosor * 2 + 2] : undefined} />
      ))}
    </G>
  );
}

const FULL = { x: -5000, y: -5000, width: 20000, height: 20000 };

/** Recorte entre dos figuras usando máscaras: A − B, A ∩ B o A ∪ B. */
function Recorte({ t }: { t: Trazo }) {
  const a = t.a!, b = t.b!;
  const ca = geometria(a).contorno ?? '', cb = geometria(b).contorno ?? '';
  const id = t.id.replace(/[^a-z0-9]/gi, '');
  const sinA = `sinA${id}`, sinB = `sinB${id}`, enA = `enA${id}`, enB = `enB${id}`;
  // Los dos lados del recorte toman el color del recorte.
  const A = { ...a, color: t.color, relleno: t.relleno, grosor: t.grosor };
  const B = { ...b, color: t.color, relleno: t.relleno, grosor: t.grosor };
  return (
    <G>
      <Defs>
        <Mask id={sinA} maskUnits="userSpaceOnUse" {...FULL}>
          <Rect {...FULL} fill="white" />
          <Path d={ca} fill="black" />
        </Mask>
        <Mask id={sinB} maskUnits="userSpaceOnUse" {...FULL}>
          <Rect {...FULL} fill="white" />
          <Path d={cb} fill="black" />
        </Mask>
        <ClipPath id={enA}><Path d={ca} /></ClipPath>
        <ClipPath id={enB}><Path d={cb} /></ClipPath>
      </Defs>
      {t.op === 'restar' && (
        <>
          <Figura t={A} mask={`url(#${sinB})`} />
          <Figura t={B} clip={`url(#${enA})`} soloBorde />
        </>
      )}
      {t.op === 'intersecar' && (
        <>
          <Figura t={B} clip={`url(#${enA})`} />
          <Figura t={A} clip={`url(#${enB})`} soloBorde />
        </>
      )}
      {t.op === 'unir' && (
        <>
          <Figura t={A} mask={`url(#${sinB})`} />
          <Figura t={B} />
          <G mask={`url(#${sinA})`}><Figura t={B} soloBorde /></G>
        </>
      )}
    </G>
  );
}

export function Elemento({ t }: { t: Trazo }) {
  if (t.tipo === 'lapiz' || t.tipo === 'resaltador') {
    return (
      <Path
        d={caminoLapiz(t.puntos ?? [])}
        fill="none"
        stroke={t.tipo === 'resaltador' ? transparente(t.color, '66') : t.color}
        strokeWidth={t.tipo === 'resaltador' ? t.grosor * 3 + 6 : t.grosor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  if (t.tipo === 'texto') {
    return <SvgText x={t.x1} y={t.y1} fill={t.color} fontSize={t.tam ?? 22} fontWeight="600">{t.texto}</SvgText>;
  }
  if (t.tipo === 'combo' && t.a && t.b) return <Recorte t={t} />;
  return <Figura t={t} />;
}

/** Fondo de la pizarra: liso, cuadriculado o con renglones. */
function Fondo({ ancho, alto, fondo, oscuro }: { ancho: number; alto: number; fondo: Pizarra['fondo']; oscuro: boolean }) {
  const linea = oscuro ? '#2A3A4F' : '#E3E8EF';
  const paso = 28;
  return (
    <G>
      <Rect x={0} y={0} width={ancho} height={alto} fill={oscuro ? '#0F1B2D' : '#FFFFFF'} />
      {fondo !== 'liso' &&
        Array.from({ length: Math.ceil(alto / paso) }, (_, i) => (
          <Line key={`h${i}`} x1={0} x2={ancho} y1={(i + 1) * paso} y2={(i + 1) * paso} stroke={linea} strokeWidth={1} />
        ))}
      {fondo === 'cuadricula' &&
        Array.from({ length: Math.ceil(ancho / paso) }, (_, i) => (
          <Line key={`v${i}`} y1={0} y2={alto} x1={(i + 1) * paso} x2={(i + 1) * paso} stroke={linea} strokeWidth={1} />
        ))}
    </G>
  );
}

/** Todo el dibujo de la pizarra. `seleccion` marca con un recuadro el elemento elegido. */
export function Lienzo({ ancho, alto, pizarra, extra, seleccion, oscuro }: {
  ancho: number; alto: number; pizarra: Pizarra; extra?: Trazo | null; seleccion?: string[]; oscuro: boolean;
}) {
  return (
    <Svg width={ancho} height={alto}>
      <Fondo ancho={ancho} alto={alto} fondo={pizarra.fondo} oscuro={oscuro} />
      {pizarra.trazos.map((t) => (
        <Fragment key={t.id}>
          <Elemento t={t} />
        </Fragment>
      ))}
      {extra && <Elemento t={extra} />}
      {pizarra.trazos
        .filter((t) => seleccion?.includes(t.id))
        .map((t) => {
          const b = limites(t);
          return <Rect key={`sel${t.id}`} x={b.x - 8} y={b.y - 8} width={b.w + 16} height={b.h + 16} fill="none" stroke="#2563EB" strokeWidth={2} strokeDasharray={[6, 4]} />;
        })}
    </Svg>
  );
}
