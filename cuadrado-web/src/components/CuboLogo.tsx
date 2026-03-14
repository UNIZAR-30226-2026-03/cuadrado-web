interface CuboLogoProps {
  size?: number;
}

export default function CuboLogo({ size = 110 }: CuboLogoProps) {
  const h = size;
  const w = size * 1.1;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 120 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo de Cubo"
    >
      {/* Cartas abanicadas */}
      <g filter="url(#card-shadow)">
        {/* Carta 4 (más atrás) */}
        <g transform="rotate(-22, 58, 70)">
          <rect x="38" y="8" width="40" height="56" rx="5" fill="#0d2a52" stroke="#5ab0f0" strokeWidth="1.2" />
        </g>
        {/* Carta 3 */}
        <g transform="rotate(-14, 58, 70)">
          <rect x="38" y="8" width="40" height="56" rx="5" fill="#102e58" stroke="#5ab0f0" strokeWidth="1.2" />
        </g>
        {/* Carta 2 */}
        <g transform="rotate(-6, 58, 70)">
          <rect x="38" y="8" width="40" height="56" rx="5" fill="#133460" stroke="#5ab0f0" strokeWidth="1.2" />
        </g>
        {/* Carta 1 (frontal) */}
        <g transform="rotate(2, 58, 70)">
          <rect x="38" y="8" width="40" height="56" rx="5" fill="#163a68" stroke="#6ac0ff" strokeWidth="1.3" />
          <text x="58" y="34" textAnchor="middle" fill="#b8dcff" fontSize="12" fontWeight="700" fontFamily="'Montserrat', sans-serif">
            10
          </text>
          {/* Ojo / símbolo */}
          <circle cx="58" cy="44" r="4" stroke="#80c8ff" strokeWidth="0.8" fill="none" />
          <circle cx="58" cy="44" r="1.5" fill="#80c8ff" />
        </g>
      </g>

      {/* Texto "Cubo" */}
      <text
        x="60"
        y="98"
        textAnchor="middle"
        fill="white"
        fontSize="28"
        fontWeight="700"
        fontStyle="italic"
        fontFamily="'Montserrat', serif"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
      >
        Cubo
      </text>

      <defs>
        <filter id="card-shadow" x="-10" y="-5" width="150" height="130">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>
    </svg>
  );
}
