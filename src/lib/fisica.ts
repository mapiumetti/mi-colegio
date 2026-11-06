export type Formula = { nombre: string; formula: string; nota?: string };
export type Tema = { id: string; titulo: string; icono: string; formulas: Formula[]; variables?: string };

// Fórmulas de física para la escuela secundaria, separadas por tema.
export const TEMAS: Tema[] = [
  {
    id: 'mru', titulo: 'Movimiento rectilíneo uniforme (MRU)', icono: '➡️',
    variables: 'x: posición · v: velocidad · t: tiempo',
    formulas: [
      { nombre: 'Velocidad', formula: 'v = Δx / Δt' },
      { nombre: 'Posición', formula: 'x = x₀ + v · t' },
      { nombre: 'Encuentro', formula: 'x₁(t) = x₂(t)', nota: 'Se igualan las posiciones y se despeja t' },
    ],
  },
  {
    id: 'mruv', titulo: 'Movimiento rectilíneo uniformemente variado (MRUV)', icono: '🏎️',
    variables: 'a: aceleración · v₀: velocidad inicial',
    formulas: [
      { nombre: 'Aceleración', formula: 'a = Δv / Δt' },
      { nombre: 'Velocidad', formula: 'v = v₀ + a · t' },
      { nombre: 'Posición', formula: 'x = x₀ + v₀ · t + ½ · a · t²' },
      { nombre: 'Sin tiempo', formula: 'v² = v₀² + 2 · a · Δx' },
      { nombre: 'Velocidad media', formula: 'vₘ = (v₀ + v) / 2' },
    ],
  },
  {
    id: 'caida', titulo: 'Caída libre y tiro vertical', icono: '⬇️',
    variables: 'g ≈ 9,8 m/s² (a veces se usa 10 m/s²) · y: altura',
    formulas: [
      { nombre: 'Velocidad', formula: 'v = v₀ − g · t', nota: 'Eje y positivo hacia arriba' },
      { nombre: 'Altura', formula: 'y = y₀ + v₀ · t − ½ · g · t²' },
      { nombre: 'Sin tiempo', formula: 'v² = v₀² − 2 · g · Δy' },
      { nombre: 'Altura máxima', formula: 'h_máx = v₀² / (2g)' },
      { nombre: 'Tiempo de subida', formula: 't_s = v₀ / g' },
      { nombre: 'Caída desde el reposo', formula: 't = √(2h / g)   ·   v = √(2 g h)' },
    ],
  },
  {
    id: 'tiro', titulo: 'Tiro oblicuo y horizontal', icono: '🏀',
    variables: 'α: ángulo de lanzamiento',
    formulas: [
      { nombre: 'Componentes de la velocidad', formula: 'v₀ₓ = v₀ · cos α   ·   v₀ᵧ = v₀ · sen α' },
      { nombre: 'Horizontal (MRU)', formula: 'x = v₀ₓ · t' },
      { nombre: 'Vertical (MRUV)', formula: 'y = v₀ᵧ · t − ½ · g · t²' },
      { nombre: 'Alcance máximo', formula: 'R = v₀² · sen(2α) / g', nota: 'Si sale y llega a la misma altura' },
      { nombre: 'Altura máxima', formula: 'H = (v₀ · sen α)² / (2g)' },
      { nombre: 'Tiempo de vuelo', formula: 't_v = 2 · v₀ · sen α / g' },
      { nombre: 'Tiro horizontal', formula: 'x = v₀ · t   ·   y = h − ½ · g · t²' },
    ],
  },
  {
    id: 'circular', titulo: 'Movimiento circular uniforme (MCU)', icono: '🔄',
    variables: 'T: período · f: frecuencia · ω: velocidad angular · r: radio',
    formulas: [
      { nombre: 'Frecuencia', formula: 'f = 1 / T' },
      { nombre: 'Velocidad angular', formula: 'ω = 2π / T = 2π · f' },
      { nombre: 'Velocidad tangencial', formula: 'v = ω · r' },
      { nombre: 'Aceleración centrípeta', formula: 'a_c = v² / r = ω² · r' },
      { nombre: 'Fuerza centrípeta', formula: 'F_c = m · v² / r' },
    ],
  },
  {
    id: 'dinamica', titulo: 'Dinámica (leyes de Newton)', icono: '💪',
    variables: 'F: fuerza (N) · m: masa (kg) · μ: coeficiente de rozamiento',
    formulas: [
      { nombre: '1ª ley (inercia)', formula: 'ΣF = 0  ⇒  v = constante' },
      { nombre: '2ª ley (masa)', formula: 'ΣF = m · a' },
      { nombre: '3ª ley (acción y reacción)', formula: 'F₁₂ = −F₂₁' },
      { nombre: 'Peso', formula: 'P = m · g' },
      { nombre: 'Rozamiento', formula: 'F_r = μ · N' },
      { nombre: 'Plano inclinado', formula: 'Pₓ = P · sen α   ·   Pᵧ = P · cos α' },
      { nombre: 'Ley de Hooke (resortes)', formula: 'F = −k · Δx' },
    ],
  },
  {
    id: 'energia', titulo: 'Trabajo, energía y potencia', icono: '⚡',
    variables: 'W: trabajo (J) · E: energía (J) · P: potencia (W)',
    formulas: [
      { nombre: 'Trabajo', formula: 'W = F · d · cos α' },
      { nombre: 'Energía cinética', formula: 'E_c = ½ · m · v²' },
      { nombre: 'Energía potencial gravitatoria', formula: 'E_p = m · g · h' },
      { nombre: 'Energía potencial elástica', formula: 'E_pe = ½ · k · x²' },
      { nombre: 'Energía mecánica', formula: 'E_m = E_c + E_p' },
      { nombre: 'Teorema trabajo-energía', formula: 'W_total = ΔE_c' },
      { nombre: 'Potencia', formula: 'P = W / t = F · v' },
      { nombre: 'Rendimiento', formula: 'η = P_útil / P_total · 100%' },
    ],
  },
  {
    id: 'conservacion', titulo: 'Conservación de la energía', icono: '♻️',
    formulas: [
      { nombre: 'Sin rozamiento', formula: 'E_m inicial = E_m final', nota: 'E_c₁ + E_p₁ = E_c₂ + E_p₂' },
      { nombre: 'Con rozamiento', formula: 'E_m final = E_m inicial − W_roz' },
      { nombre: 'Caída desde altura h', formula: 'm g h = ½ m v²  ⇒  v = √(2 g h)' },
    ],
  },
  {
    id: 'impulso', titulo: 'Cantidad de movimiento e impulso', icono: '🎱',
    variables: 'p: cantidad de movimiento (kg·m/s) · I: impulso (N·s)',
    formulas: [
      { nombre: 'Cantidad de movimiento', formula: 'p = m · v' },
      { nombre: 'Impulso', formula: 'I = F · Δt = Δp' },
      { nombre: 'Conservación', formula: 'm₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′' },
      { nombre: 'Choque plástico', formula: 'm₁v₁ + m₂v₂ = (m₁ + m₂) · v′' },
    ],
  },
  {
    id: 'gravitacion', titulo: 'Gravitación', icono: '🪐',
    variables: 'G = 6,67 × 10⁻¹¹ N·m²/kg²',
    formulas: [
      { nombre: 'Ley de gravitación universal', formula: 'F = G · m₁ · m₂ / d²' },
      { nombre: 'Gravedad en un planeta', formula: 'g = G · M / R²' },
      { nombre: '3ª ley de Kepler', formula: 'T² / r³ = constante' },
    ],
  },
  {
    id: 'fluidos', titulo: 'Fluidos e hidrostática', icono: '💧',
    variables: 'ρ: densidad (kg/m³) · p: presión (Pa)',
    formulas: [
      { nombre: 'Densidad', formula: 'ρ = m / V' },
      { nombre: 'Peso específico', formula: 'Pe = P / V = ρ · g' },
      { nombre: 'Presión', formula: 'p = F / A' },
      { nombre: 'Presión hidrostática', formula: 'p = ρ · g · h' },
      { nombre: 'Teorema fundamental', formula: 'Δp = ρ · g · Δh' },
      { nombre: 'Principio de Pascal (prensa)', formula: 'F₁ / A₁ = F₂ / A₂' },
      { nombre: 'Empuje (Arquímedes)', formula: 'E = ρ_líquido · g · V_sumergido' },
      { nombre: 'Caudal', formula: 'Q = V / t = A · v' },
      { nombre: 'Continuidad', formula: 'A₁ · v₁ = A₂ · v₂' },
    ],
  },
  {
    id: 'calor', titulo: 'Calor y temperatura', icono: '🔥',
    variables: 'Q: calor · c: calor específico · L: calor latente',
    formulas: [
      { nombre: 'Calor sensible', formula: 'Q = m · c · ΔT' },
      { nombre: 'Calor latente', formula: 'Q = m · L' },
      { nombre: 'Equilibrio térmico', formula: 'ΣQ = 0  (Q_ganado = −Q_cedido)' },
      { nombre: 'Escalas', formula: 'K = °C + 273,15   ·   °F = °C · 9/5 + 32' },
      { nombre: 'Dilatación lineal', formula: 'ΔL = L₀ · α · ΔT' },
      { nombre: 'Gases ideales', formula: 'p · V = n · R · T', nota: 'R = 0,082 atm·L/(mol·K) = 8,31 J/(mol·K)' },
      { nombre: '1° principio de la termodinámica', formula: 'ΔU = Q − W' },
    ],
  },
  {
    id: 'ondas', titulo: 'Ondas y sonido', icono: '🌊',
    variables: 'λ: longitud de onda · f: frecuencia · v: velocidad de propagación',
    formulas: [
      { nombre: 'Velocidad de una onda', formula: 'v = λ · f' },
      { nombre: 'Período', formula: 'T = 1 / f' },
      { nombre: 'Velocidad del sonido en el aire', formula: 'v ≈ 340 m/s' },
      { nombre: 'Velocidad de la luz', formula: 'c = 3 × 10⁸ m/s' },
    ],
  },
  {
    id: 'optica', titulo: 'Óptica', icono: '🔍',
    variables: 'n: índice de refracción · f: distancia focal',
    formulas: [
      { nombre: 'Índice de refracción', formula: 'n = c / v' },
      { nombre: 'Ley de Snell', formula: 'n₁ · sen θ₁ = n₂ · sen θ₂' },
      { nombre: 'Reflexión', formula: 'ángulo de incidencia = ángulo de reflexión' },
      { nombre: 'Lentes y espejos', formula: '1/f = 1/d₀ + 1/dᵢ' },
      { nombre: 'Aumento', formula: 'A = −dᵢ / d₀ = hᵢ / h₀' },
    ],
  },
  {
    id: 'electricidad', titulo: 'Electricidad', icono: '🔋',
    variables: 'q: carga (C) · V: tensión (V) · I: corriente (A) · R: resistencia (Ω)',
    formulas: [
      { nombre: 'Ley de Coulomb', formula: 'F = k · q₁ · q₂ / d²', nota: 'k = 9 × 10⁹ N·m²/C²' },
      { nombre: 'Campo eléctrico', formula: 'E = F / q' },
      { nombre: 'Corriente', formula: 'I = q / t' },
      { nombre: 'Ley de Ohm', formula: 'V = I · R' },
      { nombre: 'Potencia eléctrica', formula: 'P = V · I = I² · R = V² / R' },
      { nombre: 'Energía consumida', formula: 'E = P · t' },
      { nombre: 'Resistencias en serie', formula: 'R_eq = R₁ + R₂ + …' },
      { nombre: 'Resistencias en paralelo', formula: '1/R_eq = 1/R₁ + 1/R₂ + …' },
      { nombre: 'Resistencia de un conductor', formula: 'R = ρ · L / A' },
    ],
  },
];
