// ─────────────────────────────────────────────────────────
// components/CuboLogo.tsx — Logo SVG del juego
//
// Dibuja en SVG un abanico de 4 cartas de juego junto con
// el texto "Cubo" debajo. El logo es escalable mediante la
// prop `size` y aplica un filtro de sombra SVG nativo.
// ─────────────────────────────────────────────────────────

// Props del componente: solo acepta el tamaño opcional
interface CuboLogoProps {
  size?: number; // Altura base en píxeles (por defecto 110)
}

export default function CuboLogo({ size = 110 }: CuboLogoProps) {
  // El ancho es ligeramente mayor que el alto para dar espacio a las cartas inclinadas
  const h = size;
  const w = size * 1.1;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 120 110"  // Espacio de coordenadas internas del SVG
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo de Cubo"  // Accesibilidad: describe el SVG para lectores de pantalla
    >
      {/* Grupo de cartas abanicadas — todas usan el mismo filtro de sombra */}
      <g filter="url(#card-shadow)">

        {/* Carta 4 (más atrás) — más oscura y más girada a la izquierda */}
        <g transform="rotate(-22, 58, 70)">
          {/* rotate(ángulo, cx, cy): rota -22° alrededor del punto (58, 70) */}
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

        {/* Carta 1 (frontal, más visible) — ligeramente girada a la derecha */}
        <g transform="rotate(2, 58, 70)">
          <rect x="38" y="8" width="40" height="56" rx="5" fill="#163a68" stroke="#6ac0ff" strokeWidth="1.3" />

          {/* Valor de la carta: "10" centrado en la parte superior */}
          <text x="58" y="34" textAnchor="middle" fill="#b8dcff" fontSize="12" fontWeight="700" fontFamily="'Montserrat', sans-serif">
            10
          </text>

          {/* Símbolo decorativo: dos círculos concéntricos (estilo "ojo") */}
          <circle cx="58" cy="44" r="4" stroke="#80c8ff" strokeWidth="0.8" fill="none" />
          <circle cx="58" cy="44" r="1.5" fill="#80c8ff" />
        </g>
      </g>

      {/* Texto "Cubo" centrado bajo las cartas */}
      <text
        x="60"
        y="98"
        textAnchor="middle"   // Centra el texto horizontalmente respecto a x=60
        fill="white"
        fontSize="28"
        fontWeight="700"
        fontStyle="italic"
        fontFamily="'Montserrat', serif"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
      >
        Cubo
      </text>

      {/* Definiciones SVG reutilizables */}
      <defs>
        {/* Filtro de sombra para las cartas: sombra suave hacia abajo */}
        <filter id="card-shadow" x="-10" y="-5" width="150" height="130">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>
    </svg>
  );
}
