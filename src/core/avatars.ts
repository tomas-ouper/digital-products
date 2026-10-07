// 6 avatares originales en SVG (formas simples, paleta propia).
const face = (eyesY = 52) => `
  <circle cx="40" cy="${eyesY}" r="5" fill="#3a3f6b"/><circle cx="60" cy="${eyesY}" r="5" fill="#3a3f6b"/>
  <circle cx="41.5" cy="${eyesY - 1.5}" r="1.6" fill="#fff"/><circle cx="61.5" cy="${eyesY - 1.5}" r="1.6" fill="#fff"/>`;

export const AVATARS: { name: string; bg: string; svg: string }[] = [
  {
    name: 'Zorrito',
    bg: '#ffe1cc',
    svg: `<path d="M18 22 L38 40 L22 52Z M82 22 L62 40 L78 52Z" fill="#f08a4b"/>
      <ellipse cx="50" cy="56" rx="32" ry="28" fill="#f08a4b"/>
      <path d="M28 62 Q50 92 72 62 Q60 70 50 70 Q40 70 28 62Z" fill="#fff6ee"/>
      ${face(52)}<ellipse cx="50" cy="66" rx="5" ry="3.6" fill="#3a3f6b"/>`,
  },
  {
    name: 'Búho',
    bg: '#e3dcff',
    svg: `<path d="M24 26 L36 36 L28 44Z M76 26 L64 36 L72 44Z" fill="#8a6fd6"/>
      <ellipse cx="50" cy="58" rx="30" ry="32" fill="#9b82e8"/>
      <ellipse cx="50" cy="70" rx="18" ry="16" fill="#e8e0ff"/>
      <circle cx="39" cy="50" r="11" fill="#fff"/><circle cx="61" cy="50" r="11" fill="#fff"/>
      <circle cx="39" cy="50" r="5" fill="#3a3f6b"/><circle cx="61" cy="50" r="5" fill="#3a3f6b"/>
      <path d="M46 60 L54 60 L50 67Z" fill="#ffb84d"/>`,
  },
  {
    name: 'Osito',
    bg: '#f3e2cf',
    svg: `<circle cx="27" cy="30" r="11" fill="#a9744f"/><circle cx="73" cy="30" r="11" fill="#a9744f"/>
      <circle cx="27" cy="30" r="5" fill="#e0b48c"/><circle cx="73" cy="30" r="5" fill="#e0b48c"/>
      <circle cx="50" cy="56" r="31" fill="#a9744f"/>
      <ellipse cx="50" cy="67" rx="13" ry="10" fill="#e0b48c"/>
      ${face(50)}<ellipse cx="50" cy="63" rx="5" ry="3.6" fill="#3a3f6b"/>`,
  },
  {
    name: 'Gatita',
    bg: '#d6f2ff',
    svg: `<path d="M22 20 L40 36 L24 48Z M78 20 L60 36 L76 48Z" fill="#7e9cb8"/>
      <ellipse cx="50" cy="57" rx="31" ry="28" fill="#8fb0cf"/>
      ${face(53)}<path d="M46 62 L54 62 L50 66Z" fill="#ff8fa3"/>
      <path d="M30 64 L16 61 M30 68 L16 70 M70 64 L84 61 M70 68 L84 70" stroke="#3a3f6b" stroke-width="2" stroke-linecap="round"/>`,
  },
  {
    name: 'Ranita',
    bg: '#dcf7e3',
    svg: `<circle cx="33" cy="34" r="13" fill="#4cc38a"/><circle cx="67" cy="34" r="13" fill="#4cc38a"/>
      <ellipse cx="50" cy="60" rx="34" ry="26" fill="#4cc38a"/>
      <circle cx="33" cy="33" r="8" fill="#fff"/><circle cx="67" cy="33" r="8" fill="#fff"/>
      <circle cx="33" cy="34" r="4.5" fill="#3a3f6b"/><circle cx="67" cy="34" r="4.5" fill="#3a3f6b"/>
      <path d="M34 66 Q50 78 66 66" stroke="#2b7a55" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="28" cy="62" r="4" fill="#ff9fb2" opacity=".7"/><circle cx="72" cy="62" r="4" fill="#ff9fb2" opacity=".7"/>`,
  },
  {
    name: 'Conejita',
    bg: '#ffe0ea',
    svg: `<ellipse cx="38" cy="22" rx="8" ry="20" fill="#f1f1f6"/><ellipse cx="62" cy="22" rx="8" ry="20" fill="#f1f1f6"/>
      <ellipse cx="38" cy="22" rx="4" ry="14" fill="#ffb3c6"/><ellipse cx="62" cy="22" rx="4" ry="14" fill="#ffb3c6"/>
      <circle cx="50" cy="60" r="29" fill="#f1f1f6"/>
      ${face(56)}<path d="M46 65 L54 65 L50 69Z" fill="#ff8fa3"/>
      <circle cx="32" cy="66" r="4.5" fill="#ffb3c6" opacity=".8"/><circle cx="68" cy="66" r="4.5" fill="#ffb3c6" opacity=".8"/>`,
  },
];

export function avatarSvg(i: number, size = 96): string {
  const a = AVATARS[i % AVATARS.length];
  return `<svg class="avatar" width="${size}" height="${size}" viewBox="0 0 100 100" aria-label="${a.name}"><circle cx="50" cy="50" r="50" fill="${a.bg}"/>${a.svg}</svg>`;
}
