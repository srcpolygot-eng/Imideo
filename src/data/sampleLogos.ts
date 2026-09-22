import { SampleLogo } from '../types';

export const SAMPLE_LOGOS: SampleLogo[] = [
  {
    id: 'nordic-coffee',
    name: 'Nordic Roasters',
    category: 'Coffee & Cafe',
    accent: '#E07A5F',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <circle cx="150" cy="150" r="140" fill="none" stroke="#2B2D42" stroke-width="6" stroke-dasharray="12 8" />
        <circle cx="150" cy="150" r="126" fill="none" stroke="#2B2D42" stroke-width="2" />
        <!-- Sun & Mountains -->
        <circle cx="150" cy="120" r="32" fill="#E07A5F" />
        <path d="M70,185 L130,110 L180,185 Z" fill="#2B2D42" />
        <path d="M140,185 L180,130 L230,185 Z" fill="#4A4E69" />
        <!-- Steam & Waves -->
        <path d="M120,80 Q130,65 120,50" fill="none" stroke="#E07A5F" stroke-width="4" stroke-linecap="round"/>
        <path d="M150,75 Q160,60 150,45" fill="none" stroke="#E07A5F" stroke-width="4" stroke-linecap="round"/>
        <path d="M180,80 Q190,65 180,50" fill="none" stroke="#E07A5F" stroke-width="4" stroke-linecap="round"/>
        <!-- Text -->
        <text x="150" y="222" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="#2B2D42" letter-spacing="4">NORDIC</text>
        <text x="150" y="246" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="#8D99AE" letter-spacing="6">ROASTERS CO.</text>
        <line x1="90" y1="258" x2="210" y2="258" stroke="#2B2D42" stroke-width="2" />
      </svg>
    `)}`,
  },
  {
    id: 'summit-outfitters',
    name: 'Apex Mountain Co.',
    category: 'Outdoor & Gear',
    accent: '#3D5A80',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <!-- Shield crest -->
        <polygon points="150,20 260,60 250,210 150,280 50,210 40,60" fill="none" stroke="#1D2D44" stroke-width="7" stroke-linejoin="round"/>
        <!-- Summit peak -->
        <path d="M150,60 L220,180 L80,180 Z" fill="#3D5A80" />
        <path d="M150,60 L220,180 L150,180 Z" fill="#293241" />
        <polygon points="150,60 170,95 158,95 150,110 142,95 130,95" fill="#E0FBFC" />
        <!-- Pine trees -->
        <polygon points="110,180 120,150 130,180" fill="#1D2D44" />
        <polygon points="170,180 180,150 190,180" fill="#1D2D44" />
        <!-- Banner text -->
        <text x="150" y="222" font-family="system-ui, sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="#1D2D44" letter-spacing="3">APEX GEAR</text>
        <text x="150" y="244" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle" fill="#EE6C4D" letter-spacing="4">EST. 1984</text>
      </svg>
    `)}`,
  },
  {
    id: 'botanica-tea',
    name: 'Botanica Herbal',
    category: 'Organic & Wellness',
    accent: '#588157',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <!-- Minimal arch -->
        <path d="M70,250 L70,140 A80,80 0 0,1 230,140 L230,250 Z" fill="none" stroke="#3A5A40" stroke-width="4"/>
        <!-- Botanical leaf sprig -->
        <path d="M150,220 C150,140 150,110 150,90" stroke="#3A5A40" stroke-width="4" stroke-linecap="round"/>
        <path d="M150,110 Q120,105 130,85 Q150,95 150,110" fill="#588157"/>
        <path d="M150,130 Q180,125 170,105 Q150,115 150,130" fill="#588157"/>
        <path d="M150,155 Q115,150 125,130 Q150,140 150,155" fill="#588157"/>
        <path d="M150,175 Q185,170 175,150 Q150,160 150,175" fill="#588157"/>
        <circle cx="150" cy="80" r="5" fill="#A3B18C" />
        <!-- Typography -->
        <text x="150" y="215" font-family="serif" font-size="22" font-weight="700" text-anchor="middle" fill="#344E41" letter-spacing="4">BOTANICA</text>
        <text x="150" y="235" font-family="system-ui, sans-serif" font-size="10" font-weight="600" text-anchor="middle" fill="#588157" letter-spacing="5">APOTHECARY</text>
      </svg>
    `)}`,
  },
  {
    id: 'cyber-records',
    name: 'Neon Velocity Club',
    category: 'Streetwear & Music',
    accent: '#06D6A0',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <!-- Isometric cube hexagon -->
        <polygon points="150,30 240,80 240,190 150,240 60,190 60,80" fill="none" stroke="#118AB2" stroke-width="6"/>
        <line x1="150" y1="30" x2="150" y2="140" stroke="#06D6A0" stroke-width="5" />
        <line x1="60" y1="80" x2="150" y2="140" stroke="#06D6A0" stroke-width="5" />
        <line x1="240" y1="80" x2="150" y2="140" stroke="#06D6A0" stroke-width="5" />
        <!-- Lightning bolt accent -->
        <polygon points="155,70 135,115 155,115 140,165 175,105 155,105" fill="#FFD166"/>
        <text x="150" y="210" font-family="monospace" font-size="20" font-weight="900" text-anchor="middle" fill="#073B4C" letter-spacing="5">VELOCITY</text>
        <text x="150" y="230" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle" fill="#118AB2" letter-spacing="4">STUDIO // 01</text>
      </svg>
    `)}`,
  },
  {
    id: 'golden-harvest',
    name: 'Artisan Bakery',
    category: 'Bakery & Food',
    accent: '#D4A373',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <!-- Circular badge -->
        <circle cx="150" cy="150" r="135" fill="none" stroke="#6B705C" stroke-width="5" />
        <circle cx="150" cy="150" r="125" fill="none" stroke="#CB997E" stroke-width="1.5" />
        <!-- Wheat sheaves -->
        <path d="M120,160 Q135,110 150,90 Q165,110 180,160" fill="none" stroke="#D4A373" stroke-width="3"/>
        <ellipse cx="140" cy="115" rx="6" ry="12" transform="rotate(-30 140 115)" fill="#D4A373"/>
        <ellipse cx="160" cy="115" rx="6" ry="12" transform="rotate(30 160 115)" fill="#D4A373"/>
        <ellipse cx="135" cy="135" rx="6" ry="12" transform="rotate(-35 135 135)" fill="#D4A373"/>
        <ellipse cx="165" cy="135" rx="6" ry="12" transform="rotate(35 165 135)" fill="#D4A373"/>
        <ellipse cx="150" cy="95" rx="5" ry="10" fill="#D4A373"/>
        <!-- Star accents -->
        <text x="75" y="155" font-size="16" fill="#CB997E">★</text>
        <text x="215" y="155" font-size="16" fill="#CB997E">★</text>
        <!-- Text -->
        <text x="150" y="195" font-family="serif" font-size="22" font-weight="800" text-anchor="middle" fill="#6B705C" letter-spacing="3">GOLDEN CRUST</text>
        <text x="150" y="218" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="#CB997E" letter-spacing="5">SLOW CRAFT BREAD</text>
      </svg>
    `)}`,
  },
];
