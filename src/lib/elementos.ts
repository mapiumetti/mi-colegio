export type Categoria = 'am' | 'at' | 'tr' | 'pt' | 'ml' | 'nm' | 'hal' | 'gn' | 'la' | 'ac';

export const CATEGORIAS: Record<Categoria, { nombre: string; color: string }> = {
  am: { nombre: 'Metal alcalino', color: '#F87171' },
  at: { nombre: 'Metal alcalinotérreo', color: '#FB923C' },
  tr: { nombre: 'Metal de transición', color: '#FACC15' },
  pt: { nombre: 'Otros metales', color: '#A3E635' },
  ml: { nombre: 'Metaloide', color: '#34D399' },
  nm: { nombre: 'No metal', color: '#22D3EE' },
  hal: { nombre: 'Halógeno', color: '#60A5FA' },
  gn: { nombre: 'Gas noble', color: '#A78BFA' },
  la: { nombre: 'Lantánido', color: '#F472B6' },
  ac: { nombre: 'Actínido', color: '#E879F9' },
};

export type Elemento = { z: number; simbolo: string; nombre: string; masa: string; grupo: number; periodo: number; cat: Categoria };

// Z|símbolo|nombre|masa atómica|grupo (0 = lantánidos/actínidos)|período|categoría
const DATOS = `1|H|Hidrógeno|1,008|1|1|nm
2|He|Helio|4,003|18|1|gn
3|Li|Litio|6,94|1|2|am
4|Be|Berilio|9,012|2|2|at
5|B|Boro|10,81|13|2|ml
6|C|Carbono|12,011|14|2|nm
7|N|Nitrógeno|14,007|15|2|nm
8|O|Oxígeno|15,999|16|2|nm
9|F|Flúor|18,998|17|2|hal
10|Ne|Neón|20,180|18|2|gn
11|Na|Sodio|22,990|1|3|am
12|Mg|Magnesio|24,305|2|3|at
13|Al|Aluminio|26,982|13|3|pt
14|Si|Silicio|28,085|14|3|ml
15|P|Fósforo|30,974|15|3|nm
16|S|Azufre|32,06|16|3|nm
17|Cl|Cloro|35,45|17|3|hal
18|Ar|Argón|39,948|18|3|gn
19|K|Potasio|39,098|1|4|am
20|Ca|Calcio|40,078|2|4|at
21|Sc|Escandio|44,956|3|4|tr
22|Ti|Titanio|47,867|4|4|tr
23|V|Vanadio|50,942|5|4|tr
24|Cr|Cromo|51,996|6|4|tr
25|Mn|Manganeso|54,938|7|4|tr
26|Fe|Hierro|55,845|8|4|tr
27|Co|Cobalto|58,933|9|4|tr
28|Ni|Níquel|58,693|10|4|tr
29|Cu|Cobre|63,546|11|4|tr
30|Zn|Zinc|65,38|12|4|tr
31|Ga|Galio|69,723|13|4|pt
32|Ge|Germanio|72,630|14|4|ml
33|As|Arsénico|74,922|15|4|ml
34|Se|Selenio|78,971|16|4|nm
35|Br|Bromo|79,904|17|4|hal
36|Kr|Kriptón|83,798|18|4|gn
37|Rb|Rubidio|85,468|1|5|am
38|Sr|Estroncio|87,62|2|5|at
39|Y|Itrio|88,906|3|5|tr
40|Zr|Circonio|91,224|4|5|tr
41|Nb|Niobio|92,906|5|5|tr
42|Mo|Molibdeno|95,95|6|5|tr
43|Tc|Tecnecio|(98)|7|5|tr
44|Ru|Rutenio|101,07|8|5|tr
45|Rh|Rodio|102,906|9|5|tr
46|Pd|Paladio|106,42|10|5|tr
47|Ag|Plata|107,868|11|5|tr
48|Cd|Cadmio|112,414|12|5|tr
49|In|Indio|114,818|13|5|pt
50|Sn|Estaño|118,710|14|5|pt
51|Sb|Antimonio|121,760|15|5|ml
52|Te|Telurio|127,60|16|5|ml
53|I|Yodo|126,904|17|5|hal
54|Xe|Xenón|131,293|18|5|gn
55|Cs|Cesio|132,905|1|6|am
56|Ba|Bario|137,327|2|6|at
57|La|Lantano|138,905|0|6|la
58|Ce|Cerio|140,116|0|6|la
59|Pr|Praseodimio|140,908|0|6|la
60|Nd|Neodimio|144,242|0|6|la
61|Pm|Prometio|(145)|0|6|la
62|Sm|Samario|150,36|0|6|la
63|Eu|Europio|151,964|0|6|la
64|Gd|Gadolinio|157,25|0|6|la
65|Tb|Terbio|158,925|0|6|la
66|Dy|Disprosio|162,500|0|6|la
67|Ho|Holmio|164,930|0|6|la
68|Er|Erbio|167,259|0|6|la
69|Tm|Tulio|168,934|0|6|la
70|Yb|Iterbio|173,045|0|6|la
71|Lu|Lutecio|174,967|3|6|la
72|Hf|Hafnio|178,49|4|6|tr
73|Ta|Tantalio|180,948|5|6|tr
74|W|Wolframio|183,84|6|6|tr
75|Re|Renio|186,207|7|6|tr
76|Os|Osmio|190,23|8|6|tr
77|Ir|Iridio|192,217|9|6|tr
78|Pt|Platino|195,084|10|6|tr
79|Au|Oro|196,967|11|6|tr
80|Hg|Mercurio|200,592|12|6|tr
81|Tl|Talio|204,38|13|6|pt
82|Pb|Plomo|207,2|14|6|pt
83|Bi|Bismuto|208,980|15|6|pt
84|Po|Polonio|(209)|16|6|pt
85|At|Astato|(210)|17|6|hal
86|Rn|Radón|(222)|18|6|gn
87|Fr|Francio|(223)|1|7|am
88|Ra|Radio|(226)|2|7|at
89|Ac|Actinio|(227)|0|7|ac
90|Th|Torio|232,038|0|7|ac
91|Pa|Protactinio|231,036|0|7|ac
92|U|Uranio|238,029|0|7|ac
93|Np|Neptunio|(237)|0|7|ac
94|Pu|Plutonio|(244)|0|7|ac
95|Am|Americio|(243)|0|7|ac
96|Cm|Curio|(247)|0|7|ac
97|Bk|Berkelio|(247)|0|7|ac
98|Cf|Californio|(251)|0|7|ac
99|Es|Einstenio|(252)|0|7|ac
100|Fm|Fermio|(257)|0|7|ac
101|Md|Mendelevio|(258)|0|7|ac
102|No|Nobelio|(259)|0|7|ac
103|Lr|Lawrencio|(266)|3|7|ac
104|Rf|Rutherfordio|(267)|4|7|tr
105|Db|Dubnio|(268)|5|7|tr
106|Sg|Seaborgio|(269)|6|7|tr
107|Bh|Bohrio|(270)|7|7|tr
108|Hs|Hasio|(277)|8|7|tr
109|Mt|Meitnerio|(278)|9|7|tr
110|Ds|Darmstatio|(281)|10|7|tr
111|Rg|Roentgenio|(282)|11|7|tr
112|Cn|Copernicio|(285)|12|7|tr
113|Nh|Nihonio|(286)|13|7|pt
114|Fl|Flerovio|(289)|14|7|pt
115|Mc|Moscovio|(290)|15|7|pt
116|Lv|Livermorio|(293)|16|7|pt
117|Ts|Teneso|(294)|17|7|hal
118|Og|Oganesón|(294)|18|7|gn`;

export const ELEMENTOS: Elemento[] = DATOS.split('\n').map((l) => {
  const [z, simbolo, nombre, masa, grupo, periodo, cat] = l.split('|');
  return { z: Number(z), simbolo, nombre, masa, grupo: Number(grupo), periodo: Number(periodo), cat: cat as Categoria };
});

// Orden de llenado de subniveles (regla de las diagonales / Madelung).
const ORDEN = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const CAPACIDAD: Record<string, number> = { s: 2, p: 6, d: 10, f: 14 };
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n: number) => String(n).split('').map((d) => SUP[Number(d)]).join('');

/** Configuración electrónica según la regla de las diagonales. */
export function configuracion(z: number): string {
  let resto = z;
  const partes: string[] = [];
  for (const sub of ORDEN) {
    if (resto <= 0) break;
    const n = Math.min(resto, CAPACIDAD[sub[1]]);
    partes.push(`${sub}${sup(n)}`);
    resto -= n;
  }
  return partes.join(' ');
}
