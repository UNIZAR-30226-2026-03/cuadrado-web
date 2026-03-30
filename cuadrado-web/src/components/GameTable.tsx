// components/GameTable.tsx - Mesa de juego ovalada con animacion idle automatica
//
// Mesa stadium con 4 jugadores (2 en movil), pilas centrales y una animacion
// continua que simula el flujo de una partida:
//   idle -> drawing -> peeking -> swapping/swapCross/discarding -> siguiente turno
//
// En el intercambio se mueven DOS cartas simultáneamente:
//   - La robada se asienta en la posición de la carta expulsada (settling)
//   - La expulsada viaja a peek y luego al descarte (swapFly)

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import '../styles/GameTable.css';

// --- Tipos ---

type IdlePhase = 'idle' | 'drawing' | 'peeking' | 'swapping' | 'swapCross' | 'discarding';
// Etapas del elemento volador que representa la carta expulsada de la mano
type SwapFlyStage = 'hidden' | 'at-hand' | 'at-peek' | 'to-discard';
type PlayerPosition = 'north' | 'south' | 'east' | 'west';
type TableCard = { value: string; suit: string };

// --- Constantes ---

const DESKTOP_TURN_ORDER: PlayerPosition[] = ['north', 'east', 'south', 'west'];
const MOBILE_TURN_ORDER: PlayerPosition[]  = ['north', 'south'];
const LOCAL_PLAYER: PlayerPosition = 'south';

// Duraciones de cada fase de la animacion idle (en ms)
const TIMING = {
  TURN_START:      1400, // pausa mostrando al jugador activo
  DRAW_EMERGE:      900, // carta emerge del mazo
  TRAVEL_PLAYER:    700, // carta viaja a la zona del jugador
  PEEK:            2200, // jugador contempla la carta
  SWAP_RESOLVE:    1600, // intercambio: hand update + inicio settling
  SWAP_FLY_DELAY:    60, // frames antes de que la voladora inicie su viaje
  SWAP_FLY_PEEK:   1000, // voladora en peek antes de ir al descarte
  SWAP_CLEANUP:    1000, // limpieza final tras el descarte de la voladora
  DISCARD_DONE:    1100, // descarte directo resuelto
} as const;

const CARD_VALUES = ['3', '8', 'K', 'A', '5', '2', '10', 'J', 'Q', '9', '4', '6', '7'];
const CARD_SUITS  = ['♠', '♥', '♦', '♣'];
const CARD_DECK: TableCard[] = CARD_SUITS.flatMap(suit =>
  CARD_VALUES.map(value => ({ value, suit })),
);

// --- Componentes auxiliares ---

/** Grid 2x2 de cartas de un jugador */
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

// --- Helpers de inicializacion ---

function buildInitialHands(): Record<PlayerPosition, TableCard[]> {
  let cursor = 0;
  const next = () => {
    const card = CARD_DECK[cursor % CARD_DECK.length];
    cursor++;
    return card;
  };
  return {
    north: [next(), next(), next(), next()],
    east:  [next(), next(), next(), next()],
    south: [next(), next(), next(), next()],
    west:  [next(), next(), next(), next()],
  };
}

// --- Componente principal ---

export default function GameTable() {
  // Estado de la animacion de cartas
  const [phase, setPhase]           = useState<IdlePhase>('idle');
  const [drawnCard, setDrawnCard]   = useState<TableCard | null>(null);
  const [cardAtPlayer, setCardAtPlayer] = useState(false);
  const [swapTarget, setSwapTarget] = useState<number | null>(null);
  const [discardCard, setDiscardCard] = useState<TableCard>({ value: '7', suit: '♠' });
  // Rotacion aleatoria aplicada cuando el jugador "mira" la carta (-8 a +8 grados)
  const [peekRotation, setPeekRotation] = useState(-3);
  // Carta voladora que representa la carta expulsada de la mano durante el intercambio
  const [swapFlyCard, setSwapFlyCard]   = useState<TableCard | null>(null);
  const [swapFlyStage, setSwapFlyStage] = useState<SwapFlyStage>('hidden');
  // Posicion exacta (desde el centro de la superficie) de la carta intercambiada
  const [swapCardPos, setSwapCardPos]   = useState({ x: 0, y: 0 });
  const [turnIndex, setTurnIndex]   = useState(0);

  // Estado de layout (viewport + dimensiones de la mesa)
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 480px)').matches,
  );
  const [isCompactLandscape, setIsCompactLandscape] = useState(
    () => window.matchMedia('(max-width: 1100px) and (max-height: 520px) and (orientation: landscape)').matches,
  );
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 });
  const [tableScale, setTableScale]   = useState(1);
  const [drawOffsets, setDrawOffsets] = useState({
    northX: -92, northY: -108,
    southX: 112, southY: 106,
    eastX: 180,  westX: -180,
  });

  // Referencias que persisten entre renders sin causar re-renders
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableRef       = useRef<HTMLDivElement | null>(null);
  const drawnCardRef   = useRef<TableCard | null>(null);
  const drawCountRef   = useRef(0);
  const deckCursorRef  = useRef(16);
  const playerHandsRef = useRef<Record<PlayerPosition, TableCard[]>>(buildInitialHands());

  const turnOrder    = isMobile ? MOBILE_TURN_ORDER : DESKTOP_TURN_ORDER;
  const activePlayer = turnOrder[turnIndex % turnOrder.length];
  const isLocalTurn  = activePlayer === LOCAL_PLAYER;
  const drawnTargetClass = `game-table__drawn--to-${activePlayer}`;

  function takeNextDeckCard(): TableCard {
    const card = CARD_DECK[deckCursorRef.current % CARD_DECK.length];
    deckCursorRef.current++;
    return card;
  }

  // --- Deteccion de viewport ---
  useEffect(() => {
    const mqMobile  = window.matchMedia('(max-width: 480px)');
    const mqCompact = window.matchMedia(
      '(max-width: 1100px) and (max-height: 520px) and (orientation: landscape)',
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

  // Reajusta el indice de turno si cambia el numero de jugadores visibles
  useEffect(() => {
    setTurnIndex(prev => prev % turnOrder.length);
  }, [turnOrder.length]);

  // --- Calculo dinamico del tamano de la mesa ---
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const aw = el.clientWidth;
      const ah = el.clientHeight;
      if (!aw || !ah) return;

      const margin    = 0.90;
      const mw        = aw * margin;
      const mh        = ah * margin;
      const aratio    = mw / Math.max(mh, 1);
      const dynRatio  = Math.min(2.2, Math.max(5 / 3, aratio * 0.9));
      const surfRatio = isCompactLandscape ? 5 / 3 : (isMobile ? 4 / 5 : dynRatio);

      let w = mw;
      let h = w / surfRatio;
      if (h > mh) { h = mh; w = h * surfRatio; }

      const rw    = Math.floor(w);
      const rh    = Math.floor(h);
      const baseW = isMobile ? 320 : (isCompactLandscape ? 700 : 900);
      const maxS  = isCompactLandscape ? 0.8 : (isMobile ? 1.05 : 1.4);
      const scale = Math.max(0.72, Math.min(rw / baseW, maxS));

      const hFactor   = isMobile ? 0.19 : (isCompactLandscape ? 0.15 : 0.14);
      const vFactor   = isMobile ? 0.30 : (isCompactLandscape ? 0.3  : 0.24);
      const latFactor = isCompactLandscape ? 0.21 : 0.26;

      setSurfaceSize({ width: rw, height: rh });
      setTableScale(scale);
      setDrawOffsets({
        northX: Math.round(-rw * hFactor),
        northY: Math.round(-rh * vFactor),
        southX: Math.round(rw * hFactor),
        southY: Math.round(rh * vFactor),
        eastX:  Math.round(rw * latFactor),
        westX:  Math.round(-rw * latFactor),
      });
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, isCompactLandscape]);

  // --- Flujo de animacion por turno ---
  // idle -> robar (mazo pulsa) -> carta emerge -> viaja al jugador ->
  // peek -> swap (dos cartas vuelan) o discard -> siguiente turno
  useEffect(() => {
    setPhase('idle');
    setSwapTarget(null);
    setDrawnCard(null);
    drawnCardRef.current = null;
    setCardAtPlayer(false);

    // 1) Pausa mostrando indicador del jugador activo antes de robar
    timerRef.current = setTimeout(() => {
      setPhase('drawing');

      // 2) Carta emerge del mazo
      timerRef.current = setTimeout(() => {
        const drawn = takeNextDeckCard();
        drawCountRef.current++;
        setDrawnCard(drawn);
        drawnCardRef.current = drawn;

        // 3) Carta viaja suavemente hasta la zona del jugador activo
        timerRef.current = setTimeout(() => {
          // Rotacion aleatoria [-8, +8] grados para aspecto organico al mirar
          setPeekRotation(Math.round((Math.random() * 16 - 8) * 10) / 10);
          setCardAtPlayer(true);
          setPhase('peeking');

          // 4) Peek: el jugador contempla su carta
          timerRef.current = setTimeout(() => {
            const doSwap = drawCountRef.current % 3 !== 0;

            if (doSwap) {
              // 5a) Intercambio: calcular posicion exacta de la carta a reemplazar
              const target = Math.floor(Math.random() * 4);

              const cW  = 42 * tableScale;
              const cH  = 60 * tableScale;
              const gap = 4 * tableScale;
              const col = target % 2;
              const row = Math.floor(target / 2);
              const dX  = (col === 0 ? -1 : 1) * (cW / 2 + gap / 2);
              const dY  = (row === 0 ? -1 : 1) * (cH / 2 + gap / 2);
              const playerCenterX = activePlayer === 'east'  ? drawOffsets.eastX
                                  : activePlayer === 'west'  ? drawOffsets.westX
                                  : activePlayer === 'south' ? drawOffsets.southX
                                  : drawOffsets.northX;
              const playerCenterY = activePlayer === 'north' ? drawOffsets.northY
                                  : activePlayer === 'south' ? drawOffsets.southY
                                  : 0;
              setSwapCardPos({ x: playerCenterX + dX, y: playerCenterY + dY });
              setSwapTarget(target);
              setPhase('swapping');

              timerRef.current = setTimeout(() => {
                const currentHand  = playerHandsRef.current[activePlayer] ?? [];
                const replacedCard = currentHand[target] ?? drawn;
                const cardToInsert = drawnCardRef.current ?? drawn;
                const updatedHand  = currentHand.map((card, idx) => (idx === target ? cardToInsert : card));
                playerHandsRef.current = { ...playerHandsRef.current, [activePlayer]: updatedHand };

                // Paso 1: la carta voladora aparece en la posicion de la carta expulsada
                // y la carta robada empieza a asentarse (swapCross)
                setSwapFlyCard(replacedCard);
                setSwapFlyStage('at-hand');
                setSwapTarget(null);
                setPhase('swapCross');

                // Paso 2: un frame despues la voladora inicia su viaje al peek
                timerRef.current = setTimeout(() => {
                  setSwapFlyStage('at-peek');

                  // Paso 3: la voladora esta en peek — viaja ahora al descarte
                  timerRef.current = setTimeout(() => {
                    const randomCard = CARD_DECK[Math.floor(Math.random() * CARD_DECK.length)];
                    setDrawnCard(null);
                    drawnCardRef.current = null;
                    setCardAtPlayer(false);
                    setSwapFlyStage('to-discard');

                    // Paso 4: limpieza final tras la animacion de descarte
                    timerRef.current = setTimeout(() => {
                      setDiscardCard(randomCard);
                      setSwapFlyCard(null);
                      setSwapFlyStage('hidden');
                      setPhase('idle');
                      setTurnIndex(prev => (prev + 1) % turnOrder.length);
                    }, TIMING.SWAP_CLEANUP);
                  }, TIMING.SWAP_FLY_PEEK);
                }, TIMING.SWAP_FLY_DELAY);
              }, TIMING.SWAP_RESOLVE);

            } else {
              // 5b) Descarte directo: carta viaja hacia la pila de descartes
              setPhase('discarding');
              setCardAtPlayer(false);

              timerRef.current = setTimeout(() => {
                setDiscardCard(drawn);
                setDrawnCard(null);
                drawnCardRef.current = null;
                setSwapTarget(null);
                setPhase('idle');
                setTurnIndex(prev => (prev + 1) % turnOrder.length);
              }, TIMING.DISCARD_DONE);
            }
          }, TIMING.PEEK);
        }, TIMING.TRAVEL_PLAYER);
      }, TIMING.DRAW_EMERGE);
    }, TIMING.TURN_START);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIndex, turnOrder.length]);

  /** Indice de carta resaltada durante el swap de un jugador */
  function handSwapIndex(position: PlayerPosition) {
    return phase === 'swapping' && position === activePlayer
      ? swapTarget ?? undefined
      : undefined;
  }

  // CSS custom properties para las dimensiones, offsets y rotacion de la mesa
  const surfaceStyle: CSSProperties & Record<string, string> =
    surfaceSize.width && surfaceSize.height
      ? {
        width:  `${surfaceSize.width}px`,
        height: `${surfaceSize.height}px`,
        '--table-scale':            `${tableScale}`,
        '--drawn-offset-north-x':   `${drawOffsets.northX}px`,
        '--drawn-offset-north-y':   `${drawOffsets.northY}px`,
        '--drawn-offset-south-x':   `${drawOffsets.southX}px`,
        '--drawn-offset-south-y':   `${drawOffsets.southY}px`,
        '--drawn-offset-east-x':    `${drawOffsets.eastX}px`,
        '--drawn-offset-west-x':    `${drawOffsets.westX}px`,
        '--peek-rotation':          `${peekRotation}deg`,
        '--swap-card-x':            `${swapCardPos.x}px`,
        '--swap-card-y':            `${swapCardPos.y}px`,
      }
      : {};

  // Clases de la carta robada (controlan posicion y estado visual)
  const drawnClasses = [
    'game-table__drawn',
    drawnTargetClass,
    drawnCard              && 'game-table__drawn--visible',
    cardAtPlayer           && 'game-table__drawn--at-player',
    phase === 'peeking'    && 'game-table__drawn--peek',
    phase === 'peeking'    && !isLocalTurn && 'game-table__drawn--peek-private',
    phase === 'discarding' && 'game-table__drawn--discard',
    // swapCross: la carta robada se desplaza hacia la posicion de la carta intercambiada
    phase === 'swapCross'  && 'game-table__drawn--settling',
  ].filter(Boolean).join(' ');

  // Clases del elemento volador (carta expulsada de la mano)
  const swapFlyStageClass: Record<SwapFlyStage, string> = {
    'hidden':     '',
    'at-hand':    'game-table__swap-fly--at-hand',
    'at-peek':    'game-table__swap-fly--at-peek',
    'to-discard': 'game-table__swap-fly--to-discard',
  };
  const swapFlyClasses = [
    'game-table__swap-fly',
    drawnTargetClass,    // hereda --drawn-offset-x/y del jugador activo
    swapFlyStageClass[swapFlyStage],
  ].filter(Boolean).join(' ');

  // Helpers para clases de color del palo (rojo/negro)
  const colorKey = (s?: string) => (s === '♦' || s === '♥' ? 'red' : 'black');
  const drawnColorKey   = drawnCard ? colorKey(drawnCard.suit) : '';
  const discardColorKey = colorKey(discardCard.suit);

  return (
    <div className="game-table" ref={tableRef}>
      <div className="game-table__surface" style={surfaceStyle}>
        {/* Anillo decorativo interior */}
        <div className="game-table__ring" aria-hidden="true" />

        {/* Arte geometrico holografico sutil en el centro */}
        <div className="game-table__geo" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="game-table__geo-svg">
            <polygon points="100,10 178,55 178,145 100,190 22,145 22,55"   className="game-table__geo-hex" />
            <polygon points="100,40 148,70 148,130 100,160 52,130 52,70"   className="game-table__geo-hex game-table__geo-hex--inner" />
            <line x1="100" y1="10"  x2="100" y2="40"  className="game-table__geo-line" />
            <line x1="178" y1="55"  x2="148" y2="70"  className="game-table__geo-line" />
            <line x1="178" y1="145" x2="148" y2="130" className="game-table__geo-line" />
            <line x1="100" y1="190" x2="100" y2="160" className="game-table__geo-line" />
            <line x1="22"  y1="145" x2="52"  y2="130" className="game-table__geo-line" />
            <line x1="22"  y1="55"  x2="52"  y2="70"  className="game-table__geo-line" />
            <polygon points="100,70 130,100 100,130 70,100" className="game-table__geo-diamond" />
          </svg>
        </div>

        {/* Manos de los cuatro jugadores */}
        <PlayerHand position="north" isActive={activePlayer === 'north'} highlightIndex={handSwapIndex('north')} />
        <PlayerHand position="east"  isActive={activePlayer === 'east'}  highlightIndex={handSwapIndex('east')}  />
        <PlayerHand position="west"  isActive={activePlayer === 'west'}  highlightIndex={handSwapIndex('west')}  />
        <PlayerHand position="south" isActive={activePlayer === 'south'} highlightIndex={handSwapIndex('south')} />

        {/* Carta robada: hijo directo de surface para que left/top 50%
            use el mismo origen que los offsets calculados y las manos */}
        <div className={drawnClasses}>
          <div className="game-table__card game-table__card--drawn">
            <div className="game-table__card-face game-table__card-face--front">
              <span className={`game-table__card-suit game-table__card-suit--${drawnColorKey}`}>{drawnCard?.suit ?? ''}</span>
              <span className={`game-table__card-value game-table__card-value--${drawnColorKey}`}>{drawnCard?.value ?? ''}</span>
            </div>
            <div className="game-table__card-face game-table__card-face--back" />
          </div>
        </div>

        {/* Carta de la mano expulsada durante el intercambio:
            viaja de la mano al peek y luego a la pila de descartes */}
        {swapFlyCard && (
          <div className={swapFlyClasses}>
            <div className="game-table__card game-table__card--drawn">
              <div className="game-table__card-face game-table__card-face--front">
                <span className={`game-table__card-suit game-table__card-suit--${colorKey(swapFlyCard.suit)}`}>{swapFlyCard.suit}</span>
                <span className={`game-table__card-value game-table__card-value--${colorKey(swapFlyCard.suit)}`}>{swapFlyCard.value}</span>
              </div>
              <div className="game-table__card-face game-table__card-face--back" />
            </div>
          </div>
        )}

        {/* Pilas centrales: mazo de robar + descartes */}
        <div className="game-table__center">
          {/* Mazo de robar: 5 capas de profundidad */}
          <div className={`game-table__pile game-table__pile--draw${phase === 'drawing' ? ' game-table__pile--active' : ''}`}>
            <div className="game-table__pile-depth" />
            <div className="game-table__pile-depth" />
            <div className="game-table__pile-depth" />
            <div className="game-table__pile-depth" />
            <div className="game-table__pile-depth" />
            <div className="game-table__card game-table__card--pile" />
          </div>

          {/* Pila de descartes con abanico de cartas */}
          <div className="game-table__pile game-table__pile--discard">
            <div className="game-table__card game-table__card--fan" />
            <div className="game-table__card game-table__card--fan" />
            <div className="game-table__card game-table__card--fan" />
            <div className="game-table__card game-table__card--face-up">
              <span className={`game-table__card-suit game-table__card-suit--${discardColorKey}`}>{discardCard.suit}</span>
              <span className={`game-table__card-value game-table__card-value--${discardColorKey}`}>{discardCard.value}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
