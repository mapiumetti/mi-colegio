/**
 * Evaluador de expresiones para la calculadora (sin usar eval).
 * Soporta + - × ÷ ^ %, paréntesis, π, e y funciones: sin cos tan √ log ln.
 * Los ángulos se interpretan en grados, como en las calculadoras escolares.
 */
function funciones(radianes: boolean): Record<string, (x: number) => number> {
  const a = (x: number) => (radianes ? x : (x * Math.PI) / 180);
  return {
    sqrt: Math.sqrt,
    asin: (x) => (radianes ? Math.asin(x) : (Math.asin(x) * 180) / Math.PI),
    acos: (x) => (radianes ? Math.acos(x) : (Math.acos(x) * 180) / Math.PI),
    atan: (x) => (radianes ? Math.atan(x) : (Math.atan(x) * 180) / Math.PI),
    sen: (x) => Math.sin(a(x)),
    sin: (x) => Math.sin(a(x)),
    cos: (x) => Math.cos(a(x)),
    tan: (x) => Math.tan(a(x)),
    tg: (x) => Math.tan(a(x)),
    abs: Math.abs,
    exp: Math.exp,
    '√': Math.sqrt,
    log: Math.log10,
    ln: Math.log,
  };
}
const FUNCS_GRADOS = funciones(false);
const FUNCS_RAD = funciones(true);

/**
 * Evalúa una expresión. Con `x` definido sirve para graficar funciones (p. ej. "2x^2 - 3sen(x)").
 * `radianes`: los ángulos de sen/cos/tan se toman en radianes (en la calculadora, en grados).
 */
export function evaluar(expr: string, x?: number, radianes = false): number {
  const FUNCS = radianes ? FUNCS_RAD : FUNCS_GRADOS;
  const s = expr.toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\*\*/g, '^').replace(/pi/g, 'π').replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];

  function numero(): number {
    if (s.startsWith('π', i)) { i++; return Math.PI; }
    if (s[i] === 'x' && x !== undefined) { i++; return x; }
    if (s[i] === 'e' && !s.startsWith('exp', i)) { i++; return Math.E; }
    for (const f of Object.keys(FUNCS)) {
      if (s.startsWith(f, i)) {
        i += f.length;
        return FUNCS[f](factor());
      }
    }
    if (peek() === '(') {
      i++;
      const v = suma();
      if (peek() === ')') i++;
      return v;
    }
    const m = /^\d*\.?\d+(e[+-]?\d+)?/.exec(s.slice(i));
    if (!m) throw new Error('Expresión inválida');
    i += m[0].length;
    return parseFloat(m[0]);
  }

  function factor(): number {
    if (peek() === '-') { i++; return -factor(); }
    if (peek() === '+') { i++; return factor(); }
    let v = numero();
    while (peek() === '%') { i++; v = v / 100; }
    if (peek() === '^') { i++; v = Math.pow(v, factor()); }
    return v;
  }

  function producto(): number {
    let v = factor();
    // Multiplicación implícita: 2(3), 2π, 2x, 3sen(x)
    while (peek() === '*' || peek() === '/' || (peek() !== undefined && /[(πx√a-z]/.test(peek()))) {
      const op = peek();
      if (op === '*' || op === '/') i++;
      const d = factor();
      v = op === '/' ? v / d : v * d; // multiplicación implícita: 2(3) o 2π
    }
    return v;
  }

  function suma(): number {
    let v = producto();
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      const d = producto();
      v = op === '+' ? v + d : v - d;
    }
    return v;
  }

  const r = suma();
  if (i < s.length) throw new Error('Expresión inválida');
  return r;
}

export function formatear(n: number): string {
  if (!isFinite(n)) return 'Error';
  const r = Math.round(n * 1e10) / 1e10;
  return String(r).replace('.', ',');
}
