// components/icons/DeckIcons.tsx - Iconos SVG de barajas para el modal de crear sala.
//
// DeckIconDefs y CardBackGlyph son helpers privados (no exportados).
// Solo se exportan los tres iconos de uso público.

// ── Tipos internos ────────────────────────────────────────────────────────────

interface DeckIconDefsProps {
  prefix: string;
}

interface CardBackGlyphProps {
  prefix: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderColor: string;
  innerBorderColor: string;
  rotation?: number;
  opacity?: number;
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function DeckIconDefs({ prefix }: DeckIconDefsProps) {
  return (
    <defs>
      <linearGradient id={`${prefix}-card-base`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0c1a38" />
        <stop offset="50%" stopColor="#081230" />
        <stop offset="100%" stopColor="#060e28" />
      </linearGradient>

      <radialGradient id={`${prefix}-card-glow`} cx="50%" cy="50%" r="65%">
        <stop offset="0%" stopColor="rgba(0, 229, 255, 0.14)" />
        <stop offset="100%" stopColor="rgba(0, 229, 255, 0)" />
      </radialGradient>

      <pattern
        id={`${prefix}-pattern-a`}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0, 229, 255, 0.14)" strokeWidth="1" />
      </pattern>

      <pattern
        id={`${prefix}-pattern-b`}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0, 229, 255, 0.12)" strokeWidth="1" />
      </pattern>

      <filter id={`${prefix}-shadow`} x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="4" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.5" />
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00e5ff" floodOpacity="0.25" />
      </filter>
    </defs>
  );
}

function CardBackGlyph({
  prefix,
  x,
  y,
  width,
  height,
  borderColor,
  innerBorderColor,
  rotation = 0,
  opacity = 1,
}: CardBackGlyphProps) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const inset = 3;

  return (
    <g
      opacity={opacity}
      transform={rotation !== 0 ? `rotate(${rotation} ${cx} ${cy})` : undefined}
      filter={`url(#${prefix}-shadow)`}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="7"
        ry="7"
        fill={`url(#${prefix}-card-base)`}
        stroke={borderColor}
        strokeWidth="1.8"
      />

      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="5"
        ry="5"
        fill={`url(#${prefix}-card-glow)`}
      />

      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="5"
        ry="5"
        fill={`url(#${prefix}-pattern-a)`}
      />

      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="5"
        ry="5"
        fill={`url(#${prefix}-pattern-b)`}
      />

      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="5"
        ry="5"
        fill="none"
        stroke={innerBorderColor}
        strokeWidth="1"
      />
    </g>
  );
}

// ── Iconos públicos ───────────────────────────────────────────────────────────

/** Icono de una sola baraja */
export function IconOneDeck() {
  const prefix = 'modal-one-deck';

  return (
    <svg viewBox="0 0 64 80" style={{ width: 58, height: 58 }} aria-hidden="true">
      <DeckIconDefs prefix={prefix} />
      <CardBackGlyph
        prefix={prefix}
        x={12}
        y={8}
        width={40}
        height={64}
        borderColor="rgba(0, 229, 255, 0.62)"
        innerBorderColor="rgba(0, 229, 255, 0.35)"
      />
    </svg>
  );
}

/** Icono de dos barajas */
export function IconTwoDecks() {
  const prefix = 'modal-two-decks';

  return (
    <svg viewBox="0 0 90 80" style={{ width: 68, height: 58 }} aria-hidden="true">
      <DeckIconDefs prefix={prefix} />
      <CardBackGlyph
        prefix={prefix}
        x={10}
        y={12}
        width={34}
        height={52}
        borderColor="rgba(196, 131, 255, 0.6)"
        innerBorderColor="rgba(196, 131, 255, 0.36)"
        rotation={-11}
        opacity={0.92}
      />
      <CardBackGlyph
        prefix={prefix}
        x={34}
        y={12}
        width={34}
        height={52}
        borderColor="rgba(0, 229, 255, 0.68)"
        innerBorderColor="rgba(0, 229, 255, 0.38)"
        rotation={8}
      />
    </svg>
  );
}

/** Icono de reanudar partida (flecha circular con triángulo de play) */
export function IconResume() {
  const cx = 40;
  const cy = 40;
  const r  = 27;

  const arcStartDeg = 60;
  const arcEndDeg   = 300;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pointOnCircle = (deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  const arcStart = pointOnCircle(arcStartDeg);
  const arcEnd   = pointOnCircle(arcEndDeg);

  const arrowPlacementOffsetDeg = 23;
  const arrowAngleDeg  = arcEndDeg + arrowPlacementOffsetDeg;
  const arcEndflecha   = pointOnCircle(arrowAngleDeg);

  const endRad = toRad(arrowAngleDeg);
  const tx = -Math.sin(endRad);
  const ty =  Math.cos(endRad);

  const angleAdjustRad = toRad(5);
  const rtx = tx * Math.cos(angleAdjustRad) - ty * Math.sin(angleAdjustRad);
  const rty = tx * Math.sin(angleAdjustRad) + ty * Math.cos(angleAdjustRad);

  const arrowLength    = 15;
  const arrowHalfWidth = 9;
  const baseCenter = {
    x: arcEndflecha.x - rtx * arrowLength,
    y: arcEndflecha.y - rty * arrowLength,
  };
  const nx = -rty;
  const ny =  rtx;
  const arrowLeft  = { x: baseCenter.x + nx * arrowHalfWidth, y: baseCenter.y + ny * arrowHalfWidth };
  const arrowRight = { x: baseCenter.x - nx * arrowHalfWidth, y: baseCenter.y - ny * arrowHalfWidth };

  return (
    <svg viewBox="0 0 80 80" style={{ width: 58, height: 58 }} aria-hidden="true">
      <defs>
        <linearGradient id="modalResumeStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#0087f5" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="modalResumePlay" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00f6ff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#00a3ff" stopOpacity="0.95" />
        </linearGradient>

        <filter id="modalResumeGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00e5ff" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Arco circular */}
      <path
        d={`M ${arcStart.x.toFixed(2)} ${arcStart.y.toFixed(2)} A ${r} ${r} 0 1 1 ${arcEnd.x.toFixed(2)} ${arcEnd.y.toFixed(2)}`}
        fill="none"
        stroke="url(#modalResumeStroke)"
        strokeWidth={6.2}
        strokeLinecap="round"
        filter="url(#modalResumeGlow)"
      />

      {/* Flecha en el extremo del arco */}
      <polygon
        points={`${arcEndflecha.x.toFixed(2)},${arcEndflecha.y.toFixed(2)} ${arrowLeft.x.toFixed(2)},${arrowLeft.y.toFixed(2)} ${arrowRight.x.toFixed(2)},${arrowRight.y.toFixed(2)}`}
        fill="url(#modalResumeStroke)"
      />

      {/* Triángulo de play centrado */}
      <polygon points="34,31.5 34,48.5 49,40" fill="rgba(0, 20, 36, 0.9)" />
    </svg>
  );
}
