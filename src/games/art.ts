// Ilustraciones de portada de cada juego (SVG originales).
const gloss = (id: string, c1: string, c2: string) =>
  `<radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`;

export const ART = {
  snake: `<svg viewBox="0 0 160 120"><defs><pattern id="sn-ck" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#8fd679"/><rect width="10" height="10" fill="#84cd6e"/><rect x="10" y="10" width="10" height="10" fill="#84cd6e"/></pattern>${gloss('sn-fr', '#ffb26b', '#f26b2e')}</defs>
    <rect width="160" height="120" fill="url(#sn-ck)"/>
    <text x="80" y="104" font-family="Fredoka" font-weight="700" font-size="118" text-anchor="middle" fill="#fff3d6" stroke="#d9b77e" stroke-width="5" paint-order="stroke">a</text>
    <path d="M44 96 C 30 70, 60 46, 86 58 S 104 92, 92 98" stroke="#1f7a4a" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M44 96 C 30 70, 60 46, 86 58 S 104 92, 92 98" stroke="#34b56d" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M42 90 C 32 70, 58 50, 82 58" stroke="#6fdc98" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
    <circle cx="92" cy="98" r="11" fill="#34b56d" stroke="#1f7a4a" stroke-width="2.5"/><circle cx="88" cy="95" r="3.6" fill="#fff"/><circle cx="96" cy="95" r="3.6" fill="#fff"/><circle cx="89" cy="95.5" r="1.8" fill="#2b2f55"/><circle cx="97" cy="95.5" r="1.8" fill="#2b2f55"/>
    <circle cx="112" cy="86" r="6" fill="url(#sn-fr)"/><circle cx="118" cy="68" r="6" fill="url(#sn-fr)"/><circle cx="114" cy="50" r="6" fill="url(#sn-fr)"/>
    <path d="M114 44 l3 -4" stroke="#3fae4f" stroke-width="3" stroke-linecap="round"/><path d="M118 62 l3 -4" stroke="#3fae4f" stroke-width="3" stroke-linecap="round"/></svg>`,
  ninja: `<svg viewBox="0 0 160 120"><defs><linearGradient id="nj-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2457"/><stop offset="1" stop-color="#8e5fc4"/></linearGradient>${gloss('nj-a', '#ffe7a0', '#e8a400')}${gloss('nj-b', '#d8c9ff', '#7a5ad6')}${gloss('nj-c', '#ffc1a6', '#e9602f')}</defs>
    <rect width="160" height="120" fill="url(#nj-sky)"/><circle cx="130" cy="26" r="13" fill="#fff6d8"/><circle cx="130" cy="26" r="20" fill="#fff6d8" opacity=".15"/>
    <circle cx="20" cy="18" r="1" fill="#fff"/><circle cx="62" cy="10" r="1.2" fill="#fff"/><circle cx="96" cy="30" r="1" fill="#fff"/><circle cx="40" cy="40" r="1" fill="#fff"/>
    <path d="M0 120 L0 90 Q30 70 60 88 T120 82 T160 92 L160 120Z" fill="#2a2360"/>
    <circle cx="44" cy="66" r="21" fill="url(#nj-a)"/><text x="44" y="76" font-family="Fredoka" font-weight="700" font-size="28" text-anchor="middle" fill="#fff" stroke="#3a3f6b" stroke-width="4" paint-order="stroke">M</text>
    <circle cx="112" cy="70" r="18" fill="url(#nj-b)"/><text x="112" y="80" font-family="Fredoka" font-weight="700" font-size="28" text-anchor="middle" fill="#fff" stroke="#3a3f6b" stroke-width="4" paint-order="stroke">a</text>
    <path d="M70 44 a 14 14 0 0 1 14 0 l-7 12z" fill="url(#nj-c)"/><path d="M68 58 a 14 14 0 0 0 18 0 l-9 -6z" fill="url(#nj-c)"/>
    <path d="M18 104 Q70 60 150 30" stroke="#7fdcff" stroke-width="9" fill="none" stroke-linecap="round" opacity=".35"/><path d="M18 104 Q70 60 150 30" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`,
  crash: `<svg viewBox="0 0 160 120"><defs><linearGradient id="cr-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b79cff"/><stop offset="1" stop-color="#ffa8d5"/></linearGradient></defs>
    <rect width="160" height="120" fill="url(#cr-bg)"/><circle cx="20" cy="20" r="26" fill="#fff" opacity=".12"/><circle cx="140" cy="100" r="34" fill="#fff" opacity=".12"/>
    <rect x="26" y="10" width="108" height="104" rx="14" fill="#fff" opacity=".85"/>
    ${[0, 1, 2]
      .map((r) =>
        [0, 1, 2]
          .map((c) => {
            const cols = [['#ff9d6b', '#e9602f'], ['#7fb0ff', '#3f6fd6'], ['#7ee0a6', '#2f9f63'], ['#ffd76b', '#e0a300']];
            const ch = ['S', 'O', 'L', 'A'];
            const i = (r * 2 + c) % 4;
            const x = 34 + c * 32, y = 16 + r * 32;
            return `<rect x="${x}" y="${y + 3}" width="28" height="28" rx="8" fill="${cols[i][1]}"/><rect x="${x}" y="${y}" width="28" height="26" rx="8" fill="${cols[i][0]}"/><rect x="${x + 4}" y="${y + 3}" width="20" height="6" rx="3" fill="#fff" opacity=".5"/><text x="${x + 14}" y="${y + 21}" font-family="Fredoka" font-weight="700" font-size="17" text-anchor="middle" fill="#fff" stroke="#0003" stroke-width="2" paint-order="stroke">${ch[i]}</text>`;
          })
          .join('')
      )
      .join('')}
    <path d="M30 32 l100 0" stroke="#e63946" stroke-width="5" stroke-linecap="round" opacity=".9"/>
    <path d="M128 12 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fff"/></svg>`,
  angry: `<svg viewBox="0 0 160 120"><defs><linearGradient id="an-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb6f5"/><stop offset="1" stop-color="#d9f0ff"/></linearGradient>${gloss('an-c', '#ffb59b', '#e9532a')}</defs>
    <rect width="160" height="120" fill="url(#an-sky)"/><circle cx="24" cy="22" r="11" fill="#ffe066"/>
    <path d="M0 100 Q40 70 80 92 T160 86 L160 120 L0 120Z" fill="#9bd38f"/><rect y="98" width="160" height="22" fill="#8a5b3b"/><rect y="96" width="160" height="6" fill="#5fb84a"/>
    <path d="M30 98 L32 70 M32 76 L22 60 M32 76 L42 60" stroke="#4d2f1a" stroke-width="8" stroke-linecap="round"/><path d="M30 98 L32 70 M32 76 L22 60 M32 76 L42 60" stroke="#9a6a45" stroke-width="5" stroke-linecap="round"/>
    <circle cx="62" cy="40" r="2" fill="#fff"/><circle cx="52" cy="46" r="2" fill="#fff"/><circle cx="72" cy="38" r="2" fill="#fff"/>
    <circle cx="86" cy="40" r="9" fill="url(#an-c)"/><circle cx="83" cy="38" r="2" fill="#fff"/><circle cx="89" cy="38" r="2" fill="#fff"/><circle cx="83.5" cy="38.5" r="1" fill="#3a3f6b"/><circle cx="89.5" cy="38.5" r="1" fill="#3a3f6b"/>
    <rect x="104" y="72" width="8" height="24" rx="2" fill="#f2b134" stroke="#a87412" stroke-width="1.5"/><rect x="134" y="72" width="8" height="24" rx="2" fill="#f2b134" stroke="#a87412" stroke-width="1.5"/>
    <rect x="100" y="64" width="46" height="8" rx="2" fill="#f2b134" stroke="#a87412" stroke-width="1.5"/>
    <path d="M123 42 L136 64 L110 64Z" fill="#3fbf7f" stroke="#26855a" stroke-width="1.5"/><rect x="115" y="82" width="14" height="14" rx="3" fill="#5b8def" stroke="#3a62b3" stroke-width="1.5"/>
    <circle cx="120" cy="87" r="1.6" fill="#fff"/><circle cx="125" cy="87" r="1.6" fill="#fff"/></svg>`,
  craft: `<svg viewBox="0 0 160 120" shape-rendering="crispEdges"><defs><linearGradient id="cf-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4f2"/><stop offset="1" stop-color="#bfe6ff"/></linearGradient></defs>
    <rect width="160" height="120" fill="url(#cf-sky)"/><rect x="20" y="16" width="30" height="7" fill="#fff" opacity=".9"/><rect x="26" y="12" width="16" height="5" fill="#fff" opacity=".9"/><rect x="110" y="24" width="34" height="7" fill="#fff" opacity=".9"/>
    ${(() => {
      // isla isométrica de bloques
      const cube = (x: number, y: number, top: string, left: string, right: string) =>
        `<path d="M${x} ${y} l14 -7 l14 7 l-14 7z" fill="${top}"/><path d="M${x} ${y} l14 7 v16 l-14 -7z" fill="${left}"/><path d="M${x + 14} ${y + 7} l14 -7 v16 l-14 7z" fill="${right}"/>`;
      const g = ['#6fc556', '#8a5b3b', '#6d4429'];
      let out = '';
      const cells: [number, number][] = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]];
      for (const [i, j] of cells) out += cube(52 + (i - j) * 14, 70 + (i + j) * 7, g[0], g[1], g[2]);
      out += cube(52 + 14, 70 + 7 - 16, '#e5484d', '#b8323a', '#962a31');
      out += cube(52 + 14, 70 + 7 - 32, '#f5c936', '#c99d1d', '#a88216');
      out += cube(52 + 0 - 14, 70 + 7 * 1 - 16, '#3f7fe0', '#2f62b0', '#244f8f');
      // árbol
      out += cube(52 + 28, 70 + 14 - 16, '#a37a4c', '#6c4a2d', '#5e3f25');
      out += cube(52 + 28, 70 + 14 - 32, '#a37a4c', '#6c4a2d', '#5e3f25');
      out += cube(52 + 28, 70 + 14 - 48, '#4ea547', '#367f31', '#2f7a2c');
      out += cube(52 + 42, 70 + 7 - 40, '#4ea547', '#367f31', '#2f7a2c');
      out += cube(52 + 14, 70 + 21 - 40, '#4ea547', '#367f31', '#2f7a2c');
      return out;
    })()}
    <path d="M78 58 h6 M81 55 v6" stroke="#fff" stroke-width="2"/></svg>`,
};
