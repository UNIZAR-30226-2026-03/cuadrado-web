// ─────────────────────────────────────────────────────────
// components/GameTable.tsx — Mesa de juego ovalada con animación idle
//
// Mesa ovalada con 4 jugadores en grid 2x2, pilas centrales
// (robar + descartes con fan) y una animación automática infinita
// que simula el flujo real del juego:
//   robar → viajar a zona → mirar → intercambiar/descartar.
//
// La carta robada viaja físicamente desde el mazo hasta la
// zona del jugador activo gracias a la clase --at-player,
// que transiciona suavemente la posición CSS.
//
// El tamaño y offsets se ajustan al viewport dinámicamente.
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

// Fases de la animación idle
type IdlePhase = 'idle' | 'drawing' | 'peeking' | 'swapping' | 'discarding';
type PlayerPosition = 'north' | 'south' | 'east' | 'west';
type TableCard = { value: string; suit: string };

const DESKTOP_TURN_ORDER: PlayerPosition[] = ['north', 'east', 'south', 'west'];
const MOBILE_TURN_ORDER: PlayerPosition[] = ['north', 'south'];
const LOCAL_PLAYER: PlayerPosition = 'south';

// Grid 2×2 de cartas de un jugador
function PlayerHand({
  position,
  isActive,
  highlightIndex,
}: {
  position: PlayerPosition;
  isActive: boolean;
  highlightIndex?: number;
}) {
  return (
    <div className={`game-table__hand game-table__hand--${position}${isActive ? ' game-table__hand--active' : ''}`}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`game-table__card${highlightIndex === i ? ' game-table__card--swapping' : ''}`}
        />
      ))}
    </div>
  );
}

// Valores simulados de cartas para la animación
const CARD_VALUES = ['3', '8', 'K', 'A', '5', '2', '10', 'J', 'Q', '9', '4', '6', '7'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_DECK: TableCard[] = CARD_SUITS.flatMap((suit) =>
  CARD_VALUES.map((value) => ({ value, suit })),
);

function buildInitialHands(): Record<PlayerPosition, TableCard[]> {
  let cursor = 0;
  const nextCard = () => {
    const card = CARD_DECK[cursor % CARD_DECK.length];
    cursor++;
    return card;
  };

  return {
    north: [nextCard(), nextCard(), nextCard(), nextCard()],
    east: [nextCard(), nextCard(), nextCard(), nextCard()],
    south: [nextCard(), nextCard(), nextCard(), nextCard()],
    west: [nextCard(), nextCard(), nextCard(), nextCard()],
  };
}



export default function GameTable() {
  const [phase, setPhase] = useState<IdlePhase>('idle');
  const [drawnCard, setDrawnCard] = useState<TableCard | null>(null);
  const [cardAtPlayer, setCardAtPlayer] = useState(false);
  const [swapTarget, setSwapTarget] = useState<number | null>(null);
  const [discardCard, setDiscardCard] = useState<TableCard>({ value: '7', suit: '♠' });
  const [turnIndex, setTurnIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 480px)').matches,
  );
  const [isCompactLandscape, setIsCompactLandscape] = useState(
    () => window.matchMedia('(max-width: 900px) and (max-height: 520px) and (orientation: landscape)').matches,
  );
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 });
  const [tableScale, setTableScale] = useState(1);
  const [drawOffsets, setDrawOffsets] = useState({
    northX: -92, northY: -108,
    southX: 112, southY: 106,
    eastX: 180, westX: -180,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const drawCountRef = useRef(0);
  const deckCursorRef = useRef(16);
  const playerHandsRef = useRef<Record<PlayerPosition, TableCard[]>>(buildInitialHands());

  const turnOrder = isMobile ? MOBILE_TURN_ORDER : DESKTOP_TURN_ORDER;
  const activePlayer = turnOrder[turnIndex % turnOrder.length];
  const isLocalTurn = activePlayer === LOCAL_PLAYER;
  const drawnTargetClass = `game-table__drawn--to-${activePlayer}`;

  function takeNextDeckCard(): TableCard {
    const card = CARD_DECK[deckCursorRef.current % CARD_DECK.length];
    deckCursorRef.current++;
    return card;
  }

  // ── Detección de viewport ──────────────────────────────
  useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 480px)');
    const mqCompact = window.matchMedia(
      '(max-width: 900px) and (max-height: 520px) and (orientation: landscape)',
    );

    function sync() {
      setIsMobile(mqMobile.matches);
      setIsCompactLandscape(mqCompact.matches);
    }

    sync();
    mqMobile.addEventListener('change', sync);
    mqCompact.addEventListener('change', sync);

    return () => {
      mqMobile.removeEventListener('change', sync);
      mqCompact.removeEventListener('change', sync);
    };
  }, []);

  // Reajusta índice si cambia el número de jugadores visibles
  useEffect(() => {
    setTurnIndex((prev) => prev % turnOrder.length);
  }, [turnOrder.length]);

  // ── Cálculo dinámico de tamaño de mesa ─────────────────
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const aw = el.clientWidth;
      const ah = el.clientHeight;
      if (!aw || !ah) return;

      const margin = 0.90;
      const mw = aw * margin;
      const mh = ah * margin;
      const aratio = mw / Math.max(mh, 1);
      const dynRatio = Math.min(2.2, Math.max(5 / 3, aratio * 0.9));
      const surfRatio = isCompactLandscape ? 1.62 : (isMobile ? 4 / 5 : dynRatio);

      let w = mw;
      let h = w / surfRatio;
      if (h > mh) { h = mh; w = h * surfRatio; }

      const rw = Math.floor(w);
      const rh = Math.floor(h);
      const baseW = isMobile ? 320 : (isCompactLandscape ? 700 : 900);
      const maxS = isCompactLandscape ? 0.9 : (isMobile ? 1.05 : 1.4);
      const scale = Math.max(0.72, Math.min(rw / baseW, maxS));

      const hFactor = isMobile ? 0.19 : (isCompactLandscape ? 0.15 : 0.14);
      const vFactor = isMobile ? 0.30 : (isCompactLandscape ? 0.3 : 0.24);
      const latFactor = isCompactLandscape ? 0.21 : 0.26;

      setSurfaceSize({ width: rw, height: rh });
      setTableScale(scale);
      setDrawOffsets({
        northX: Math.round(-rw * hFactor),
        northY: Math.round(-rh * vFactor),
        southX: Math.round(rw * hFactor),
        southY: Math.round(rh * vFactor),
        eastX: Math.round(rw * latFactor),
        westX: Math.round(-rw * latFactor),
      });
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, isCompactLandscape]);

  // ── Flujo de animación por turno ───────────────────────
  // idle → robar (mazo pulsa) → carta emerge en centro →
  // carta viaja a zona del jugador → peek (flip si local) →
  // swap/discard → siguiente turno
  useEffect(() => {
    setPhase('idle');
    setSwapTarget(null);
    setDrawnCard(null);
    setCardAtPlayer(false);

    // 1) Pausa breve mostrando indicador del jugador activo
    timerRef.current = setTimeout(() => {
      setPhase('drawing');

      // 2) Carta emerge del mazo (aparece en el centro, boca abajo)
      timerRef.current = setTimeout(() => {
        const drawn = takeNextDeckCard();
        drawCountRef.current++;
        setDrawnCard(drawn);

        // 3) Carta viaja hasta la zona del jugador activo
        timerRef.current = setTimeout(() => {
          setCardAtPlayer(true);
          setPhase('peeking');

          // 4) Peek: el jugador mira su carta (flip si es local)
          timerRef.current = setTimeout(() => {
            const doSwap = drawCountRef.current % 3 !== 0;

            if (doSwap) {
              // 5a) Intercambio: una de las 4 cartas se resalta, la robada la sustituye
              const target = Math.floor(Math.random() * 4);
              setSwapTarget(target);
              setPhase('swapping');

              timerRef.current = setTimeout(() => {
                const currentHand = playerHandsRef.current[activePlayer] ?? [];
                const replacedCard = currentHand[target] ?? drawn;
                const updatedHand = currentHand.map((card, idx) => (idx === target ? drawn : card));

                playerHandsRef.current = {
                  ...playerHandsRef.current,
                  [activePlayer]: updatedHand,
                };

                setDiscardCard(replacedCard);
                setDrawnCard(null);
                setCardAtPlayer(false);
                setSwapTarget(null);
                setPhase('idle');
                setTurnIndex((prev) => (prev + 1) % turnOrder.length);
              }, 1000);
            } else {
              // 5b) Descarte directo: carta vuelve al centro hacia la pila de descartes
              setPhase('discarding');
              setCardAtPlayer(false);

              timerRef.current = setTimeout(() => {
                setDiscardCard(drawn);
                setDrawnCard(null);
                setSwapTarget(null);
                setPhase('idle');
                setTurnIndex((prev) => (prev + 1) % turnOrder.length);
              }, 800);
            }
          }, 1400);
        }, 350);
      }, 500);
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [turnIndex, turnOrder.length]);

  // Índice de carta resaltada durante el swap
  function handSwapIndex(position: PlayerPosition) {
    return phase === 'swapping' && position === activePlayer
      ? swapTarget ?? undefined
      : undefined;
  }

  // CSS custom properties dinámicas para la superficie
  const surfaceStyle: CSSProperties & Record<string, string> =
    surfaceSize.width && surfaceSize.height
      ? {
        width: `${surfaceSize.width}px`,
        height: `${surfaceSize.height}px`,
        '--table-scale': `${tableScale}`,
        '--drawn-offset-north-x': `${drawOffsets.northX}px`,
        '--drawn-offset-north-y': `${drawOffsets.northY}px`,
        '--drawn-offset-south-x': `${drawOffsets.southX}px`,
        '--drawn-offset-south-y': `${drawOffsets.southY}px`,
        '--drawn-offset-east-x': `${drawOffsets.eastX}px`,
        '--drawn-offset-west-x': `${drawOffsets.westX}px`,
      }
      : {};

  // Composición de clases de la carta robada (controla posición + estado visual)
  const drawnClasses = [
    'game-table__drawn',
    drawnTargetClass,
    drawnCard && 'game-table__drawn--visible',
    cardAtPlayer && 'game-table__drawn--at-player',
    phase === 'peeking' && 'game-table__drawn--peek',
    phase === 'peeking' && !isLocalTurn && 'game-table__drawn--peek-private',
    phase === 'discarding' && 'game-table__drawn--discard',
  ].filter(Boolean).join(' ');

  

  const colorKey = (s?: string) => (s === '♦' || s === '♥' ? 'red' : 'black');
  const drawnColorKey = drawnCard ? colorKey(drawnCard.suit) : '';
  const discardColorKey = colorKey(discardCard.suit);

  return (
    <div className="game-table" ref={tableRef}>
      <div className="game-table__surface" style={surfaceStyle}>
        {/* Anillo decorativo interior ovalado */}
        <div className="game-table__ring" aria-hidden="true" />

        {/* Arte geométrico holográfico sutil */}
        <div className="game-table__geo" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="game-table__geo-svg">
            <polygon
              points="100,10 178,55 178,145 100,190 22,145 22,55"
              className="game-table__geo-hex"
            />
            <polygon
              points="100,40 148,70 148,130 100,160 52,130 52,70"
              className="game-table__geo-hex game-table__geo-hex--inner"
            />
            <line x1="100" y1="10" x2="100" y2="40" className="game-table__geo-line" />
            <line x1="178" y1="55" x2="148" y2="70" className="game-table__geo-line" />
            <line x1="178" y1="145" x2="148" y2="130" className="game-table__geo-line" />
            <line x1="100" y1="190" x2="100" y2="160" className="game-table__geo-line" />
            <line x1="22" y1="145" x2="52" y2="130" className="game-table__geo-line" />
            <line x1="22" y1="55" x2="52" y2="70" className="game-table__geo-line" />
            <polygon
              points="100,70 130,100 100,130 70,100"
              className="game-table__geo-diamond"
            />
          </svg>
        </div>

        {/* Cuatro jugadores con grid 2×2 de cartas */}
        <PlayerHand position="north" isActive={activePlayer === 'north'} highlightIndex={handSwapIndex('north')} />
        <PlayerHand position="east" isActive={activePlayer === 'east'} highlightIndex={handSwapIndex('east')} />
        <PlayerHand position="west" isActive={activePlayer === 'west'} highlightIndex={handSwapIndex('west')} />
        <PlayerHand position="south" isActive={activePlayer === 'south'} highlightIndex={handSwapIndex('south')} />

        {/* ── Pilas centrales ──────────────────────────────── */}
        <div className="game-table__center">
          {/* Pila de robar (mazo 3D con 5 capas de profundidad) */}
          <div className={`game-table__pile game-table__pile--draw${phase === 'drawing' ? ' game-table__pile--active' : ''}`}>
            <div className="game-table__pile-depth" />
            <div className="game-table__pile-depth" />
            <div className="game-table__pile-depth" />
            <div className="game-table__pile-depth" />
            <div className="game-table__pile-depth" />
            <div className="game-table__card game-table__card--pile" />

            {/* Carta robada flotante — ahora dentro del mazo, emerge desde su centro */}
            <div className={drawnClasses}>
              <div className="game-table__card game-table__card--drawn">
                <div className="game-table__card-face game-table__card-face--front">
                  <span className={`game-table__card-suit game-table__card-suit--${drawnColorKey}`}>
                    {drawnCard?.suit ?? ''}
                  </span>
                  <span className={`game-table__card-value game-table__card-value--${drawnColorKey}`}>
                    {drawnCard?.value ?? ''}
                  </span>
                </div>
                <div className="game-table__card-face game-table__card-face--back" />
              </div>
            </div>
          </div>

          {/* Pila de descartes con efecto fan (cartas abiertas) */}
          <div className="game-table__pile game-table__pile--discard">
            <div className="game-table__card game-table__card--fan" />
            <div className="game-table__card game-table__card--fan" />
            <div className="game-table__card game-table__card--fan" />
            <div className="game-table__card game-table__card--face-up">
              <span className={`game-table__card-suit game-table__card-suit--${discardColorKey}`}>
                {discardCard.suit}
              </span>
              <span className={`game-table__card-value game-table__card-value--${discardColorKey}`}>
                {discardCard.value}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
