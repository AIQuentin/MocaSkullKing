// ===================================================================
// SKULL KING — Bibliothèque SVG (illustrations cartes)
// Importée par le client uniquement (pas de logique de jeu).
// ===================================================================

export const SUIT_LABEL = {
  yellow: 'Coffre',
  green: 'Perroquet',
  purple: 'Trésor',
  black: 'Drapeau',
};

export const SVG = {
  yellow: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff4b3"/><stop offset="50%" stop-color="#f4c542"/><stop offset="100%" stop-color="#a87317"/>
      </linearGradient>
      <radialGradient id="goldGlow" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#fffadc"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    </defs>
    <ellipse cx="50" cy="80" rx="32" ry="6" fill="rgba(0,0,0,0.3)"/>
    <path d="M22 38 Q22 30 30 30 L70 30 Q78 30 78 38 L80 75 Q80 82 72 82 L28 82 Q20 82 20 75 Z" fill="url(#goldG)" stroke="#5c3700" stroke-width="2"/>
    <rect x="22" y="46" width="56" height="6" fill="#a87317" opacity="0.6"/>
    <circle cx="50" cy="49" r="4" fill="#5c3700"/>
    <path d="M30 30 Q30 18 50 18 Q70 18 70 30" fill="none" stroke="#a87317" stroke-width="3"/>
    <ellipse cx="50" cy="40" rx="20" ry="8" fill="url(#goldGlow)" opacity="0.7"/>
    <circle cx="38" cy="68" r="4" fill="#fff4b3"/>
    <circle cx="50" cy="68" r="4" fill="#fff4b3"/>
    <circle cx="62" cy="68" r="4" fill="#fff4b3"/>
  </svg>`,

  green: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="parG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7be098"/><stop offset="100%" stop-color="#1e7a3a"/>
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="86" rx="30" ry="4" fill="rgba(0,0,0,0.3)"/>
    <path d="M40 20 Q25 25 25 50 Q25 75 45 80 L55 80 Q70 75 72 55 Q72 35 60 25 Q52 18 45 18 Z" fill="url(#parG)" stroke="#0c3a18" stroke-width="2"/>
    <circle cx="58" cy="35" r="4" fill="#fff"/>
    <circle cx="58" cy="35" r="2" fill="#000"/>
    <path d="M62 40 Q72 42 70 50 L62 48 Z" fill="#f4a91e" stroke="#7a3700" stroke-width="1.5"/>
    <path d="M62 48 L70 52 L62 54 Z" fill="#c75d12"/>
    <path d="M40 28 Q35 22 42 18 Q48 22 45 28 Z" fill="#e74c3c" stroke="#7a1a10" stroke-width="1"/>
    <path d="M48 25 Q44 18 52 15 Q58 19 54 26 Z" fill="#f4c542" stroke="#7a5a10" stroke-width="1"/>
    <path d="M30 60 Q22 65 30 75 L40 70 Z" fill="#1e7a3a" stroke="#0c3a18" stroke-width="1"/>
    <path d="M55 80 L52 92 M62 80 L66 92" stroke="#a87317" stroke-width="2"/>
  </svg>`,

  purple: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mapG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f0e0c4"/><stop offset="100%" stop-color="#c19c64"/>
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="86" rx="30" ry="4" fill="rgba(0,0,0,0.25)"/>
    <path d="M18 25 Q22 22 26 25 L40 22 L55 26 L70 22 L82 25 Q84 28 82 30 L84 70 Q82 75 78 73 L65 76 L50 72 L35 76 L22 73 Q18 75 16 70 Z" fill="url(#mapG)" stroke="#5a2a82" stroke-width="2"/>
    <path d="M30 35 Q40 32 50 38 Q60 42 72 38 M28 50 Q38 48 48 52 Q60 50 72 52 M30 65 Q42 62 52 65 Q62 68 72 64" fill="none" stroke="#5a2a82" stroke-width="1" opacity="0.5"/>
    <path d="M58 45 L66 53 M66 45 L58 53" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>
    <circle cx="62" cy="49" r="2" fill="#c0392b"/>
    <path d="M30 60 Q34 56 38 60 Q34 64 30 60 Z" fill="#5a2a82" opacity="0.4"/>
    <path d="M40 70 L42 65 L46 67 L44 72 Z" fill="#7a4a92" opacity="0.5"/>
    <path d="M22 28 L25 26 M75 26 L78 28 M22 72 L25 70 M75 72 L78 70" stroke="#5a2a82" stroke-width="1"/>
  </svg>`,

  black: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flagG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a3540"/><stop offset="100%" stop-color="#0c1218"/>
      </linearGradient>
    </defs>
    <line x1="22" y1="12" x2="22" y2="92" stroke="#5a3a1a" stroke-width="3"/>
    <circle cx="22" cy="12" r="3" fill="#a87317"/>
    <path d="M22 18 L78 22 Q82 25 82 35 L78 60 L22 65 Z" fill="url(#flagG)" stroke="#000" stroke-width="1.5"/>
    <path d="M78 22 Q82 30 82 35 L78 60 L78 22 Z" fill="rgba(255,255,255,0.05)"/>
    <g transform="translate(50,42)">
      <circle r="13" fill="#f3f6f9" stroke="#000" stroke-width="1"/>
      <ellipse cx="-4" cy="-2" rx="3" ry="4" fill="#000"/>
      <ellipse cx="4" cy="-2" rx="3" ry="4" fill="#000"/>
      <path d="M-3 4 L-1 8 L1 4 L3 8 L5 4" fill="none" stroke="#000" stroke-width="1.2"/>
      <rect x="-7" y="6" width="14" height="3" fill="#f3f6f9" stroke="#000" stroke-width="0.8"/>
    </g>
    <g transform="translate(50,42)">
      <line x1="-22" y1="13" x2="22" y2="-13" stroke="#f3f6f9" stroke-width="3"/>
      <line x1="-22" y1="-13" x2="22" y2="13" stroke="#f3f6f9" stroke-width="3"/>
      <circle cx="-22" cy="13" r="2" fill="#f3f6f9"/>
      <circle cx="22" cy="-13" r="2" fill="#f3f6f9"/>
      <circle cx="-22" cy="-13" r="2" fill="#f3f6f9"/>
      <circle cx="22" cy="13" r="2" fill="#f3f6f9"/>
    </g>
  </svg>`,

  skullking: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="skBg" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#3a2a00"/><stop offset="100%" stop-color="#0a0500"/>
      </radialGradient>
      <linearGradient id="crownG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff4b3"/><stop offset="100%" stop-color="#a87317"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#skBg)" opacity="0.3"/>
    <path d="M25 18 L30 32 L40 22 L50 35 L60 22 L70 32 L75 18 L78 38 L22 38 Z" fill="url(#crownG)" stroke="#5c3700" stroke-width="1.5"/>
    <circle cx="40" cy="22" r="3" fill="#c0392b"/>
    <circle cx="60" cy="22" r="3" fill="#27ae60"/>
    <circle cx="50" cy="35" r="3" fill="#3498db"/>
    <ellipse cx="50" cy="60" rx="25" ry="28" fill="#f3f6f9" stroke="#000" stroke-width="2"/>
    <path d="M30 75 Q50 90 70 75 L70 82 Q50 92 30 82 Z" fill="#e0e6ec" stroke="#000" stroke-width="1"/>
    <ellipse cx="40" cy="58" rx="6" ry="7" fill="#000"/>
    <ellipse cx="60" cy="58" rx="6" ry="7" fill="#000"/>
    <circle cx="42" cy="56" r="1.5" fill="#c0392b"/>
    <circle cx="62" cy="56" r="1.5" fill="#c0392b"/>
    <path d="M46 70 L48 76 L50 70 L52 76 L54 70" fill="none" stroke="#000" stroke-width="1.5"/>
    <rect x="38" y="78" width="24" height="3" fill="#f3f6f9" stroke="#000" stroke-width="0.8"/>
  </svg>`,

  pirate: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pirSkin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e8b88a"/><stop offset="100%" stop-color="#a87045"/>
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="86" rx="28" ry="4" fill="rgba(0,0,0,0.3)"/>
    <path d="M22 50 Q22 28 50 28 Q78 28 78 50 L78 32 Q70 18 50 18 Q30 18 22 32 Z" fill="#c0392b" stroke="#5a1010" stroke-width="2"/>
    <path d="M75 30 L88 35 L82 45 L72 38 Z" fill="#c0392b" stroke="#5a1010" stroke-width="1.5"/>
    <circle cx="80" cy="38" r="2" fill="#fff"/>
    <ellipse cx="50" cy="58" rx="22" ry="24" fill="url(#pirSkin)" stroke="#5a3000" stroke-width="2"/>
    <ellipse cx="42" cy="55" rx="3" ry="4" fill="#000"/>
    <ellipse cx="58" cy="55" rx="3" ry="4" fill="#000"/>
    <path d="M35 50 L45 50" stroke="#000" stroke-width="2"/>
    <line x1="58" y1="45" x2="60" y2="65" stroke="#3a2010" stroke-width="2"/>
    <path d="M40 70 Q50 76 60 70" fill="none" stroke="#3a1010" stroke-width="2"/>
    <path d="M30 75 Q35 88 45 88 L55 88 Q65 88 70 75" fill="#2a1810" stroke="#000" stroke-width="1.5"/>
    <circle cx="42" cy="78" r="2" fill="#a87317"/>
  </svg>`,

  mermaid: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="merTail" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7be0d0"/><stop offset="100%" stop-color="#1e7a82"/>
      </linearGradient>
      <linearGradient id="merSkin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fde0c0"/><stop offset="100%" stop-color="#d49870"/>
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="32" rx="14" ry="16" fill="url(#merSkin)" stroke="#7a3a10" stroke-width="1.5"/>
    <path d="M36 22 Q40 8 50 12 Q60 8 64 22 Q60 18 50 18 Q40 18 36 22 Z" fill="#c0392b" stroke="#5a1010" stroke-width="1"/>
    <ellipse cx="44" cy="32" rx="2" ry="3" fill="#000"/>
    <ellipse cx="56" cy="32" rx="2" ry="3" fill="#000"/>
    <path d="M40 48 Q50 46 60 48 L62 60 Q56 64 50 64 Q44 64 38 60 Z" fill="#7be0d0" stroke="#1e7a82" stroke-width="1.5"/>
    <path d="M42 60 L36 72 Q40 78 50 76 Q60 78 64 72 L58 60 Q54 64 50 64 Q46 64 42 60 Z" fill="url(#merTail)" stroke="#0c3a42" stroke-width="1.5"/>
    <path d="M30 82 Q38 76 50 80 Q62 76 70 82 Q62 88 50 86 Q38 88 30 82 Z" fill="url(#merTail)" stroke="#0c3a42" stroke-width="1.5"/>
  </svg>`,

  escape: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <line x1="22" y1="10" x2="22" y2="92" stroke="#7a5a3a" stroke-width="3"/>
    <circle cx="22" cy="10" r="3" fill="#a87317"/>
    <path d="M22 18 Q40 14 60 22 Q78 28 82 34 Q70 40 50 38 Q35 38 22 42 Z" fill="#f8f8f0" stroke="#999" stroke-width="1.5"/>
    <path d="M28 24 Q40 22 55 28 M28 32 Q42 30 58 35" fill="none" stroke="#ccc" stroke-width="1"/>
    <text x="42" y="55" font-family="Georgia" font-size="14" font-style="italic" fill="#888">fuir</text>
  </svg>`,

  tigress: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="tigF" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#ffd089"/><stop offset="100%" stop-color="#c75d12"/>
      </radialGradient>
    </defs>
    <ellipse cx="50" cy="55" rx="32" ry="30" fill="url(#tigF)" stroke="#5a2200" stroke-width="2"/>
    <path d="M22 35 L18 18 L32 28 Z" fill="url(#tigF)" stroke="#5a2200" stroke-width="1.5"/>
    <path d="M78 35 L82 18 L68 28 Z" fill="url(#tigF)" stroke="#5a2200" stroke-width="1.5"/>
    <path d="M28 40 Q26 50 30 60 M72 40 Q74 50 70 60 M40 30 Q40 38 38 44 M60 30 Q60 38 62 44" stroke="#3a1500" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="38" cy="50" rx="4" ry="5" fill="#fff"/>
    <ellipse cx="62" cy="50" rx="4" ry="5" fill="#fff"/>
    <ellipse cx="38" cy="51" rx="2" ry="3" fill="#0a3a00"/>
    <ellipse cx="62" cy="51" rx="2" ry="3" fill="#0a3a00"/>
    <path d="M44 65 Q50 67 56 65 L52 70 L50 72 L48 70 Z" fill="#3a1500"/>
  </svg>`,

  kraken: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="krBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a040d0"/><stop offset="100%" stop-color="#3a0050"/>
      </linearGradient>
    </defs>
    <path d="M15 70 Q10 50 18 40 Q12 30 22 28 Q28 18 40 22 Q48 14 58 22 Q70 18 76 28 Q86 30 80 40 Q90 50 85 70 Z" fill="url(#krBody)" stroke="#1a0029" stroke-width="2"/>
    <ellipse cx="40" cy="42" rx="5" ry="6" fill="#ffd700"/>
    <ellipse cx="60" cy="42" rx="5" ry="6" fill="#ffd700"/>
    <circle cx="40" cy="43" r="2" fill="#000"/>
    <circle cx="60" cy="43" r="2" fill="#000"/>
    <path d="M20 70 Q15 80 10 88 Q14 90 18 84 Q22 90 26 84 Q30 90 34 82 Z" fill="url(#krBody)" stroke="#1a0029" stroke-width="1.5"/>
    <path d="M50 78 Q48 88 46 95 Q50 96 50 90 Q54 96 54 90 Z" fill="url(#krBody)" stroke="#1a0029" stroke-width="1.5"/>
    <path d="M80 70 Q85 80 90 88 Q86 90 82 84 Q78 90 74 84 Q70 90 66 82 Z" fill="url(#krBody)" stroke="#1a0029" stroke-width="1.5"/>
  </svg>`,

  whitewhale: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="whG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#9cb6d5"/>
      </linearGradient>
    </defs>
    <path d="M88 50 Q92 55 88 60 L82 56 Z" fill="url(#whG)" stroke="#1a4a80" stroke-width="1.5"/>
    <path d="M12 60 Q5 50 12 42 Q25 32 50 35 Q75 32 85 45 Q90 55 82 62 Q70 70 50 68 Q30 70 18 65 Q12 64 12 60 Z" fill="url(#whG)" stroke="#1a4a80" stroke-width="2"/>
    <ellipse cx="22" cy="50" rx="2" ry="3" fill="#000"/>
    <path d="M18 38 Q22 30 26 38 Q22 42 18 38 Z" fill="#cce6ff" stroke="#1a4a80" stroke-width="1"/>
  </svg>`,
};

export const SUIT_PIP = {
  yellow: `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#f4c542" stroke="#5c3700" stroke-width="1"/></svg>`,
  green:  `<svg viewBox="0 0 16 16"><path d="M8 2 Q3 6 4 11 Q6 14 8 14 Q10 14 12 11 Q13 6 8 2 Z" fill="#27ae60" stroke="#0c3a18" stroke-width="0.8"/></svg>`,
  purple: `<svg viewBox="0 0 16 16"><path d="M3 4 L13 4 L13 12 L3 12 Z" fill="#a070c2" stroke="#5a2a82" stroke-width="0.8"/><path d="M5 6 L11 10 M11 6 L5 10" stroke="#5a2a82" stroke-width="1.2"/></svg>`,
  black:  `<svg viewBox="0 0 16 16"><circle cx="8" cy="7" r="5" fill="#f3f6f9" stroke="#000" stroke-width="0.8"/><circle cx="6" cy="6" r="1" fill="#000"/><circle cx="10" cy="6" r="1" fill="#000"/></svg>`,
};
