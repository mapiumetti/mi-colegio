/**
 * Evaluador de expresiones para la calculadora (sin usar eval).
 * Soporta + - × ÷ ^ %, paréntesis, π, e y funciones: sin cos tan √ log ln.
 * Los ángulos se interpretan en grados, como en las calculadoras escolares.
 */
const FUNCS: Record<string, (x: number) => number> = {
  sin: (x) => Math.sin((x * Math.PI) / 180),
  cos: (x) => Math.cos((x * Math.PI) / 180),
  tan: (x) => Math.tan((x * Math.PI) / 180),
  '√': Math.sqrt,
  log: Math.log10,
  ln: Math.log,
};

export function evaluar(expr: string): number {
  const s = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];

  function numero(): number {
    if (s.startsWith('π', i)) { i++; return Math.PI; }
    if (s[i] === 'e' && !/[a-z]/.test(s[i + 1] ?? '')) { i++; return Math.E; }
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
    while (peek() === '*' || peek() === '/' || peek() === '(' || peek() === 'π') {
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
