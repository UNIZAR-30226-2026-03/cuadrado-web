// pages/GamePage.tsx - Partida en curso.
//
// Backend-driven: todo el estado proviene de eventos WebSocket gestionados
// por useGame(). GSAP para animaciones de cartas, turnos y temporizador.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import PlayerSlot, { type GamePlayer } from '../components/room/PlayerSlot';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../context/AuthContext';
import {
  disconnectRoomsSocket,
  leaveRoom,
  getLastRoomState,
} from '../services/room.service';
import {
  animateCardFly,
  animateSlotActivate,
  animateSlotDeactivate,
  animateTurnTimer,
  killTurnTimer,
  animateDeckReshuffle,
  animateCuboActivated,
  animateRevealedCards,
} from '../utils/game-animations';
import type {
  GamePlayerState,
  PendingSkill,
  EvPartidaFinalizada,
  EvCartaRevelada,
  CartaRevelada,
  Card,
  PaloCarta,
} from '../types/game.types';
import '../styles/AppModal.css';
import '../styles/GamePage.css';

// ── Helpers de cartas ─────────────────────────────────────────────────────────

function formatCartaValue(carta: number): string {
  if (carta === 1) return 'A';
  if (carta === 11) return 'J';
  if (carta === 12) return 'Q';
  if (carta === 13) return 'K';
  return String(carta);
}

function formatPaloSimbolo(palo: PaloCarta): string {
  const map: Record<PaloCarta, string> = {
    corazones: '♥', picas: '♠', rombos: '♦', treboles: '♣', joker: '★',
  };
  return map[palo] ?? palo;
}

function isRedSuit(palo: PaloCarta): boolean {
  return palo === 'corazones' || palo === 'rombos';
}

// ── Posicionamiento polar ─────────────────────────────────────────────────────
// 0°=derecha, 90°=abajo (convenio CSS-canvas, eje Y positivo hacia abajo)

const SLOT_ANGLES_DEG = [270, 315, 0, 45, 90, 135, 180, 225] as const;

function getActivePositionIndices(n: number): number[] {
  const step = Math.floor(8 / n);
  return Array.from({ length: n }, (_, i) => (4 + i * step) % 8);
}

function orderPlayers(players: GamePlayer[], posIndices: number[]): GamePlayer[] {
  const ordered: GamePlayer[] = new Array(players.length);
  const me   = players.filter(p => p.isMe);
  const rest = players.filter(p => !p.isMe);
  const mePosIdx = posIndices.findIndex(idx => idx === 4);

  if (mePosIdx === -1 || me.length === 0) {
    players.forEach((p, i) => { ordered[i] = p; });
    return ordered;
  }

  ordered[mePosIdx] = me[0];
  let ri = 0;
  for (let si = 0; si < players.length; si++) {
    if (si === mePosIdx) continue;
    ordered[si] = rest[ri++];
  }
  return ordered;
}

function toSlotPlayer(p: GamePlayerState): GamePlayer {
  return {
    id: p.userId,
    name: p.name,
    elo: 1200,
    cardCount: p.cardCount,
    avatarUrl: p.avatarUrl,
    cardSkinUrl: p.cardSkinUrl,
    isMe: p.isMe,
    isBot: p.isBot,
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function GamePage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const currentUserId = user?.username ?? '';

  const {
    gameState,
    tapeteUrl,
    canDrawCard,
    activePlayer,
    actions,
    setPendingSkill,
  } = useGame(currentUserId);

  // ── Refs DOM ────────────────────────────────────────────────────────────
  const boardRef     = useRef<HTMLDivElement>(null);
  const deckRef      = useRef<HTMLDivElement>(null);
  const discardRef   = useRef<HTMLDivElement>(null);
  const timerFillRef = useRef<HTMLDivElement>(null);
  const cuboRef      = useRef<HTMLButtonElement>(null);
  const slotRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const prevTurnRef    = useRef<number>(-1);
  const revealedEls    = useRef<HTMLDivElement | null>(null);
  const entryDoneRef   = useRef(false);

  // ── UI state ────────────────────────────────────────────────────────────
  const [showLeaveModal,   setShowLeaveModal]   = useState(false);
  const [isLeaving,        setIsLeaving]        = useState(false);
  const [leaveError,       setLeaveError]       = useState<string | null>(null);
  const [cuboToast,        setCuboToast]        = useState<string | null>(null);
  const [selectedCardIdx,  setSelectedCardIdx]  = useState<number | null>(null);

  const roomState = getLastRoomState();
  const isHost = Boolean(roomState && currentUserId && roomState.hostId === currentUserId);

  // ── Posicionamiento ─────────────────────────────────────────────────────
  // Si tengo carta pendiente, no la muestro en mi mano (va a la zona separada)
  const slotPlayers = gameState.players.map(p => {
    const adjusted = (p.isMe && gameState.pendingCard)
      ? { ...p, cardCount: Math.max(0, p.cardCount - 1) }
      : p;
    return toSlotPlayer(adjusted);
  });
  const n = Math.max(2, slotPlayers.length);
  const posIndices = useMemo(() => getActivePositionIndices(n), [n]);
  const rx = 280, ry = 160;

  const orderedPlayers = useMemo(
    () => orderPlayers(slotPlayers, posIndices),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(slotPlayers), JSON.stringify(posIndices)],
  );

  // ── Entrada del tablero (cuando los jugadores llegan por primera vez) ──────
  // useEffect (no useLayoutEffect) porque los slots se pueblan DESPUÉS del
  // primer render con estado vacío → hay que esperar a que el DOM esté listo.
  useEffect(() => {
    if (entryDoneRef.current || gameState.players.length === 0 || !boardRef.current) return;
    entryDoneRef.current = true;

    const populated = slotRefs.current.filter(Boolean);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(boardRef.current, { scale: 0.85, autoAlpha: 0, duration: 0.5 });
    if (populated.length > 0) {
      tl.from(populated, { scale: 0, autoAlpha: 0, duration: 0.4, stagger: 0.07, ease: 'back.out(1.7)' }, '-=0.2');
    }
  }, [gameState.players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Activar/desactivar slot del jugador activo ──────────────────────────
  useEffect(() => {
    const prev = prevTurnRef.current;
    if (prev >= 0 && slotRefs.current[prev]) {
      animateSlotDeactivate(slotRefs.current[prev]!);
    }
    const activeIdx = orderedPlayers.findIndex(p => p?.id === activePlayer?.userId);
    if (activeIdx >= 0 && slotRefs.current[activeIdx]) {
      animateSlotActivate(slotRefs.current[activeIdx]!);
    }
    prevTurnRef.current = activeIdx;
  }, [activePlayer?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Temporizador de turno ───────────────────────────────────────────────
  useEffect(() => {
    if (!gameState.turnDeadlineAt || !timerFillRef.current) return;
    const remaining = gameState.turnDeadlineAt - Date.now();
    if (remaining <= 0) return;
    animateTurnTimer(timerFillRef.current, remaining);
    return () => killTurnTimer();
  }, [gameState.turnDeadlineAt, gameState.turnIndex]);

  // ── Rebarajado del mazo ─────────────────────────────────────────────────
  const prevDeckCountRef = useRef(gameState.deckCount);
  useEffect(() => {
    const prev = prevDeckCountRef.current;
    const curr = gameState.deckCount;
    prevDeckCountRef.current = curr;
    // Solo anima si el mazo aumentó (fue rebarajado, no que sacaron una carta)
    if (curr > prev && deckRef.current) {
      animateDeckReshuffle(deckRef.current);
    }
  }, [gameState.deckCount]);

  // ── CUBO activado ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameState.cuboActive || !cuboRef.current) return;
    setCuboToast(`¡CUBO! Quedan ${gameState.cuboTurnosRestantes} turnos`);
    animateCuboActivated(cuboRef.current);
    const t = setTimeout(() => setCuboToast(null), 3000);
    return () => clearTimeout(t);
  }, [gameState.cuboActive, gameState.cuboTurnosRestantes]);

  // ── Animar cartas reveladas ─────────────────────────────────────────────
  useEffect(() => {
    if (gameState.revealedCards.length > 0 && revealedEls.current) {
      const items = Array.from(revealedEls.current.querySelectorAll('.revealed-card-item'));
      animateRevealedCards(items);
    }
  }, [gameState.revealedCards]);

  // ── Acciones ────────────────────────────────────────────────────────────

  const mySlotIdx = useCallback(
    () => orderedPlayers.findIndex(p => p?.isMe),
    [orderedPlayers],
  );

  const handleDrawCard = useCallback(() => {
    if (!canDrawCard || !gameState.gameId) return;
    actions.robarCarta(gameState.gameId);
    const myIdx = mySlotIdx();
    if (deckRef.current && myIdx >= 0 && slotRefs.current[myIdx]) {
      animateCardFly(deckRef.current, slotRefs.current[myIdx]!);
    }
  }, [canDrawCard, gameState.gameId, actions, mySlotIdx]);

  const handleDiscardPending = useCallback(() => {
    if (!gameState.pendingCard || !gameState.gameId) return;
    actions.descartarPendiente(gameState.gameId);
    const myIdx = mySlotIdx();
    if (discardRef.current && myIdx >= 0 && slotRefs.current[myIdx]) {
      animateCardFly(slotRefs.current[myIdx]!, discardRef.current);
    }
  }, [gameState.pendingCard, gameState.gameId, actions, mySlotIdx]);

  const handlePlayCardFromHand = useCallback((cardIndex: number) => {
    if (!gameState.gameId) return;
    actions.cartaPorPendiente(gameState.gameId, cardIndex);
    setSelectedCardIdx(null);
    const myIdx = mySlotIdx();
    if (discardRef.current && myIdx >= 0 && slotRefs.current[myIdx]) {
      animateCardFly(slotRefs.current[myIdx]!, discardRef.current);
    }
  }, [gameState.gameId, actions, mySlotIdx]);

  const handleCubo = useCallback(() => {
    if (!gameState.gameId) return;
    actions.solicitarCubo(gameState.gameId);
  }, [gameState.gameId, actions]);

  const handleLeave = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    setLeaveError(null);
    try {
      await leaveRoom();
      disconnectRoomsSocket();
      navigate('/home');
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : 'No se pudo salir');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleSkillAction = useCallback(
    (skill: PendingSkill, params: Record<string, unknown>) => {
      const { gameId } = skill;
      switch (skill.tipo) {
        case 'intercambiar-todas':
          actions.intercambiarTodasCartas(gameId, params.destinatarioId as string);
          break;
        case 'hacer-robar-carta':
          actions.hacerRobarCarta(gameId, params.adversarioId as string);
          break;
        case 'proteger-carta':
          actions.protegerCarta(gameId, params.numCarta as number);
          break;
        case 'saltar-turno':
          actions.saltarTurnoJugador(gameId, params.adversarioId as string);
          break;
        case 'ver-carta-todos':
          actions.verCartaTodos(gameId);
          break;
        case 'intercambiar-carta-preparar':
          actions.prepararIntercambioCarta(gameId, params.numCartaJugador as number, params.rivalId as string);
          break;
        case 'intercambiar-carta-rival':
          actions.intercambiarCartaInteractivo(gameId, params.numCartaJugador as number, skill.rivalId!);
          break;
        case 'ver-carta-propia':
          actions.verCarta(gameId, params.indexCarta as number);
          break;
        case 'ver-carta-propia-y-rival':
          actions.verCarta(
            gameId,
            params.indexCarta as number,
            params.playerId as string,
            params.indexCartaPlayer as number,
          );
          break;
      }
      setPendingSkill(null);
    },
    [actions, setPendingSkill],
  );

  // ── Modal de resultado ──────────────────────────────────────────────────
  if (gameState.result) {
    return (
      <GameResultModal
        result={gameState.result}
        players={gameState.players}
        onClose={() => navigate('/home')}
      />
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="game-page">
      {/* Timer */}
      <div className="turn-timer-bar">
        <div className="turn-timer-bar__fill" ref={timerFillRef} />
      </div>

      {/* HUD de turno */}
      {activePlayer && (
        <div className="game-turn-hud">
          {activePlayer.isMe ? 'Tu turno' : `Turno de ${activePlayer.name}`}
        </div>
      )}

      {/* Botón de configuración */}
      <button
        className="leave-game-btn"
        onClick={() => { setLeaveError(null); setShowLeaveModal(true); }}
        aria-label="Configuración de partida"
        title="Configuración de partida"
      >⚙</button>

      {/* Tablero */}
      <div className="game-board" ref={boardRef}>
        <div className={`game-tapete${tapeteUrl ? ' game-tapete--skin' : ''}`}>
          {tapeteUrl && (
            <img
              className="game-tapete__skin"
              src={tapeteUrl}
              alt="Tapete equipado"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          {/* Pilas centrales */}
          <div className="center-piles">
            {/* Mazo — clickeable cuando es mi turno y fase WAIT_DRAW */}
            <div
              className={`game-pile game-pile--draw${canDrawCard ? ' game-pile--draw-active' : ''}`}
              ref={deckRef}
              onClick={canDrawCard ? handleDrawCard : undefined}
              role={canDrawCard ? 'button' : undefined}
              tabIndex={canDrawCard ? 0 : undefined}
              aria-label={canDrawCard ? 'Robar carta' : undefined}
              title={canDrawCard ? 'Robar carta' : undefined}
              onKeyDown={canDrawCard ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleDrawCard(); } : undefined}
            >
              <div className="game-pile-depth" />
              <div className="game-pile-depth" />
              <div className="game-pile-depth" />
              <div className="game-pile-depth" />
              <div className="game-pile-depth" />
              <div className="game-pile-card" />
              {gameState.deckCount > 0 && (
                <span className="game-pile__count">{gameState.deckCount}</span>
              )}
            </div>
            <div className="game-pile game-pile--discard" ref={discardRef}>
              <div className="game-pile-card game-pile-card--fan" />
              <div className="game-pile-card game-pile-card--fan" />
              <div className="game-pile-card game-pile-card--fan" />
              <div className="game-pile-card game-pile-card--face-up">
                <span className="game-pile-card__label">
                  {gameState.lastDiscardedCard?.carta ?? '?'}
                </span>
              </div>
            </div>
          </div>

          {/* Slots de jugadores */}
          {orderedPlayers.map((player, slotIdx) => {
            if (!player) return null;
            const posIdx   = posIndices[slotIdx];
            const angleDeg = SLOT_ANGLES_DEG[posIdx];
            const angleRad = (angleDeg * Math.PI) / 180;
            return (
              <PlayerSlot
                key={player.id}
                player={player}
                angleRad={angleRad}
                rx={rx}
                ry={ry}
                slotRef={el => { slotRefs.current[slotIdx] = el; }}
              />
            );
          })}
        </div>
      </div>

      {/* Botón CUBO */}
      <button
        ref={cuboRef}
        className={`cubo-btn${gameState.cuboActive ? ' cubo-btn--active' : ''}`}
        onClick={handleCubo}
        disabled={!gameState.gameId || !!gameState.result}
        aria-label="Declarar cubo"
      >
        CUBO
      </button>

      {/* Toast CUBO */}
      {cuboToast && <div className="cubo-toast">{cuboToast}</div>}

      {/* Cartas reveladas a todos (poder del 5) */}
      {gameState.revealedCards.length > 0 && (
        <div className="revealed-cards-panel" ref={revealedEls}>
          <h3 className="revealed-cards-panel__title">Cartas reveladas</h3>
          <div className="revealed-cards-list">
            {gameState.revealedCards.map((rc, i) => (
              <RevealedCardItem
                key={i}
                rc={rc}
                ownerName={gameState.players.find(p => p.userId === rc.jugadorId)?.name ?? rc.jugadorId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Carta vista solo por el jugador local (poderes 10 y 11) */}
      {gameState.peekedCard && (
        <PeekedCardPanel peeked={gameState.peekedCard} />
      )}

      {/* Panel carta pendiente */}
      {gameState.pendingCard && !gameState.pendingSkill && (
        <PendingCardPanel
          card={gameState.pendingCard}
          myCardCount={gameState.players.find(p => p.isMe)?.cardCount ?? 4}
          onDiscard={handleDiscardPending}
          onSelectFromHand={handlePlayCardFromHand}
          selectedIndex={selectedCardIdx}
          onSelectIndex={setSelectedCardIdx}
        />
      )}

      {/* Panel de skill */}
      {gameState.pendingSkill && !gameState.pendingCard && (
        <SkillPanel
          skill={gameState.pendingSkill}
          opponents={gameState.players.filter(p => !p.isMe)}
          myCardCount={gameState.players.find(p => p.isMe)?.cardCount ?? 4}
          onAction={handleSkillAction}
          onSkip={() => setPendingSkill(null)}
        />
      )}

      {/* Modal de salida */}
      {showLeaveModal && (
        <div
          className="app-modal-overlay"
          onClick={() => { if (!isLeaving) { setShowLeaveModal(false); setLeaveError(null); } }}
          role="presentation"
        >
          <section
            className="app-modal leave-game-modal"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <header className="app-modal__header">
              <button
                className="app-modal__back"
                onClick={() => { if (!isLeaving) { setShowLeaveModal(false); setLeaveError(null); } }}
              >← Volver</button>
              <h2 className="app-modal__title">Salir de la partida</h2>
              <div className="app-modal__spacer" />
            </header>
            <div className="app-modal__content app-modal__content--tight">
              <div className="leave-game-modal__content">
                <p className="leave-game-modal__headline">
                  {isHost ? 'Cerrar partida' : 'Salir de la partida'}
                </p>
                <p className="leave-game-modal__text">
                  {isHost
                    ? 'Eres anfitrión. Un bot te sustituirá si sales.'
                    : 'Un bot te sustituirá en la partida.'}
                </p>
                {leaveError && (
                  <div className="leave-game-modal__error" role="alert">{leaveError}</div>
                )}
                <div className="leave-game-modal__actions">
                  <button
                    className="leave-game-modal__btn leave-game-modal__btn--ghost"
                    onClick={() => { if (!isLeaving) { setShowLeaveModal(false); setLeaveError(null); } }}
                    disabled={isLeaving}
                  >Cancelar</button>
                  <button
                    className="leave-game-modal__btn leave-game-modal__btn--danger"
                    onClick={handleLeave}
                    disabled={isLeaving}
                  >{isLeaving ? 'Procesando…' : 'Salir'}</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/** Muestra al jugador local la(s) carta(s) que acaba de espiar (poderes 10 y 11) */
function PeekedCardPanel({ peeked }: { peeked: EvCartaRevelada }) {
  return (
    <div className="peeked-card-panel">
      <h3 className="peeked-card-panel__title">Has visto</h3>
      <div className="peeked-card-panel__cards">
        <DrawnCardFace card={peeked.carta} label="Tu carta" />
        {peeked.cartaJugadorContrario && (
          <DrawnCardFace card={peeked.cartaJugadorContrario} label="Carta rival" variant="rival" />
        )}
      </div>
    </div>
  );
}

function RevealedCardItem({ rc, ownerName }: { rc: CartaRevelada; ownerName: string }) {
  return (
    <div className="revealed-card-item">
      <span className="revealed-card-item__player">{ownerName}</span>
      <span className="revealed-card-item__card">
        {formatCartaValue(rc.carta.carta)}{formatPaloSimbolo(rc.carta.palo)}
        {' '}{rc.carta.puntos} pts
        {rc.carta.protegida ? ' · protegida' : ''}
      </span>
    </div>
  );
}

/** Cara de carta con estilo home-animation: valor, palo, puntos, variante roja */
function DrawnCardFace({
  card, label, variant,
}: { card: Card; label?: string; variant?: 'rival' }) {
  const isRed = isRedSuit(card.palo);
  return (
    <div className={`drawn-card-face${isRed ? ' drawn-card-face--red' : ''}${variant === 'rival' ? ' drawn-card-face--rival' : ''}`}>
      {label && <span className="drawn-card-face__label">{label}</span>}
      <span className="drawn-card-face__value">{formatCartaValue(card.carta)}</span>
      <span className="drawn-card-face__suit">{formatPaloSimbolo(card.palo)}</span>
      <span className="drawn-card-face__pts">{card.puntos} pts</span>
    </div>
  );
}

interface PendingCardPanelProps {
  card: Card;
  myCardCount: number;
  onDiscard: () => void;
  onSelectFromHand: (index: number) => void;
  selectedIndex: number | null;
  onSelectIndex: (i: number | null) => void;
}

function PendingCardPanel({
  card, myCardCount, onDiscard, onSelectFromHand, selectedIndex, onSelectIndex,
}: PendingCardPanelProps) {
  // myCardCount ya incluye la carta robada; la mano existente = myCardCount - 1
  const handCount = Math.max(0, myCardCount - 1);
  const cols = handCount > 4 ? 3 : 2;

  return (
    <div className="pending-card-panel">
      {/* Carta robada */}
      <div className="pending-card-panel__drawn-side">
        <p className="pending-card-panel__meta">Has robado</p>
        <DrawnCardFace card={card} />
      </div>

      {/* Separador vertical */}
      <div className="pending-card-panel__divider" />

      {/* Acciones */}
      <div className="pending-card-panel__actions">
        <button className="pending-card-btn pending-card-btn--discard" onClick={onDiscard}>
          Descartar
        </button>

        {handCount > 0 && (
          <>
            <span className="pending-card-panel__or">o intercambia tu carta nº:</span>
            <div
              className="pending-card-hand-grid"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {Array.from({ length: handCount }, (_, i) => (
                <button
                  key={i}
                  className={`hand-card-btn${selectedIndex === i ? ' hand-card-btn--selected' : ''}`}
                  onClick={() => selectedIndex === i ? onSelectFromHand(i) : onSelectIndex(i)}
                  title={selectedIndex === i ? 'Confirmar intercambio' : `Intercambiar carta ${i + 1}`}
                >
                  <span className="hand-card-btn__num">{i + 1}</span>
                  {selectedIndex === i && <span className="hand-card-btn__confirm">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Mini-cuadrícula visual de reversos de carta para seleccionar */
function HandCardGrid({ count, selected, onSelect }: {
  count: number;
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  const cols = count > 4 ? 3 : 2;
  return (
    <div
      className="skill-hand-grid"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          className={`hand-card-btn${selected === i ? ' hand-card-btn--selected' : ''}`}
          onClick={() => onSelect(i)}
          title={`Carta ${i + 1}`}
        >
          <span className="hand-card-btn__num">{i + 1}</span>
          {selected === i && <span className="hand-card-btn__confirm">✓</span>}
        </button>
      ))}
    </div>
  );
}

interface SkillPanelProps {
  skill: PendingSkill;
  opponents: GamePlayerState[];
  myCardCount: number;
  onAction: (skill: PendingSkill, params: Record<string, unknown>) => void;
  onSkip: () => void;
}

function SkillPanel({ skill, opponents, myCardCount, onAction, onSkip }: SkillPanelProps) {
  const [target,      setTarget]      = useState('');
  const [myCard,      setMyCard]      = useState('');
  const [rivalCard,   setRivalCard]   = useState('');

  const myHandIndices = Array.from({ length: myCardCount }, (_, i) => i);

  const content = (() => {
    switch (skill.tipo) {
      case 'ver-carta-todos':
        return (
          <div className="skill-panel__auto">
            <p>El poder del 5 revela automáticamente una carta de cada rival.</p>
            <button
              className="skill-panel__btn skill-panel__btn--primary"
              onClick={() => onAction(skill, {})}
            >Ver cartas de todos</button>
          </div>
        );

      case 'hacer-robar-carta':
      case 'intercambiar-todas':
      case 'saltar-turno': {
        const labels: Record<string, string> = {
          'hacer-robar-carta': 'Elegir rival para hacer robar carta:',
          'intercambiar-todas': 'Intercambiar todas las cartas con:',
          'saltar-turno': 'Saltar el turno de:',
        };
        const pk = skill.tipo === 'intercambiar-todas' ? 'destinatarioId' : 'adversarioId';
        return (
          <>
            <p>{labels[skill.tipo]}</p>
            <div className="skill-panel__targets">
              {opponents.map(op => (
                <button key={op.userId}
                  className={`skill-panel__target-btn${target === op.userId ? ' skill-panel__target-btn--selected' : ''}`}
                  onClick={() => setTarget(op.userId)}
                >{op.name}</button>
              ))}
            </div>
            <button
              className="skill-panel__btn skill-panel__btn--primary"
              disabled={!target}
              onClick={() => onAction(skill, { [pk]: target })}
            >Confirmar</button>
          </>
        );
      }

      case 'proteger-carta':
        return (
          <>
            <p>Elige una carta tuya para proteger:</p>
            <HandCardGrid
              count={myHandIndices.length}
              selected={myCard !== '' ? Number(myCard) : null}
              onSelect={i => setMyCard(String(i))}
            />
            <button
              className="skill-panel__btn skill-panel__btn--primary"
              disabled={myCard === ''}
              onClick={() => onAction(skill, { numCarta: Number(myCard) })}
            >Proteger</button>
          </>
        );

      case 'ver-carta-propia':
        return (
          <>
            <p>Mira una de tus cartas:</p>
            <HandCardGrid
              count={myHandIndices.length}
              selected={myCard !== '' ? Number(myCard) : null}
              onSelect={i => setMyCard(String(i))}
            />
            <button
              className="skill-panel__btn skill-panel__btn--primary"
              disabled={myCard === ''}
              onClick={() => onAction(skill, { indexCarta: Number(myCard) })}
            >Ver</button>
          </>
        );

      case 'ver-carta-propia-y-rival':
        return (
          <>
            <p>Mira una tuya y una de un rival:</p>
            <div className="skill-panel__section">
              <span className="skill-panel__label">Tu carta:</span>
              <HandCardGrid
                count={myHandIndices.length}
                selected={myCard !== '' ? Number(myCard) : null}
                onSelect={i => setMyCard(String(i))}
              />
            </div>
            <div className="skill-panel__section">
              <span className="skill-panel__label">Carta del rival:</span>
              <div className="skill-panel__targets">
                {opponents.flatMap(op =>
                  Array.from({ length: op.cardCount }, (_, i) => (
                    <button key={`${op.userId}:${i}`}
                      className={`skill-panel__target-btn${rivalCard === `${op.userId}:${i}` ? ' skill-panel__target-btn--selected' : ''}`}
                      onClick={() => setRivalCard(`${op.userId}:${i}`)}
                    >{op.name} #{i + 1}</button>
                  ))
                )}
              </div>
            </div>
            <button
              className="skill-panel__btn skill-panel__btn--primary"
              disabled={myCard === '' || rivalCard === ''}
              onClick={() => {
                const [playerId, idxStr] = rivalCard.split(':');
                onAction(skill, { indexCarta: Number(myCard), playerId, indexCartaPlayer: Number(idxStr) });
              }}
            >Ver cartas</button>
          </>
        );

      case 'intercambiar-carta-preparar':
        return (
          <>
            <p>Intercambia una carta con un rival:</p>
            <div className="skill-panel__section">
              <span className="skill-panel__label">Tu carta:</span>
              <HandCardGrid
                count={myHandIndices.length}
                selected={myCard !== '' ? Number(myCard) : null}
                onSelect={i => setMyCard(String(i))}
              />
            </div>
            <div className="skill-panel__section">
              <span className="skill-panel__label">Rival:</span>
              <div className="skill-panel__targets">
                {opponents.map(op => (
                  <button key={op.userId}
                    className={`skill-panel__target-btn${target === op.userId ? ' skill-panel__target-btn--selected' : ''}`}
                    onClick={() => setTarget(op.userId)}
                  >{op.name}</button>
                ))}
              </div>
            </div>
            <button
              className="skill-panel__btn skill-panel__btn--primary"
              disabled={myCard === '' || !target}
              onClick={() => onAction(skill, { numCartaJugador: Number(myCard), rivalId: target })}
            >Iniciar intercambio</button>
          </>
        );

      case 'intercambiar-carta-rival':
        return (
          <>
            <p>Un rival quiere intercambiar contigo. Elige tu carta:</p>
            <HandCardGrid
              count={myHandIndices.length}
              selected={myCard !== '' ? Number(myCard) : null}
              onSelect={i => setMyCard(String(i))}
            />
            <button
              className="skill-panel__btn skill-panel__btn--primary"
              disabled={myCard === ''}
              onClick={() => onAction(skill, { numCartaJugador: Number(myCard) })}
            >Confirmar intercambio</button>
          </>
        );

      default:
        return <p>Habilidad: {skill.tipo}</p>;
    }
  })();

  return (
    <div className="skill-panel">
      <div className="skill-panel__header">
        <h3 className="skill-panel__title">Habilidad de carta</h3>
        <button className="skill-panel__skip" onClick={onSkip} title="Saltar">×</button>
      </div>
      <div className="skill-panel__content">{content}</div>
    </div>
  );
}

interface GameResultModalProps {
  result: EvPartidaFinalizada;
  players: GamePlayerState[];
  onClose: () => void;
}

function GameResultModal({ result, players, onClose }: GameResultModalProps) {
  const winner = players.find(p => p.userId === result.ganadorId);

  return (
    <div className="app-modal-overlay">
      <section className="app-modal game-result-modal" role="dialog" aria-modal="true">
        <header className="app-modal__header">
          <h2 className="app-modal__title">Partida finalizada</h2>
        </header>
        <div className="app-modal__content">
          <p className="game-result-modal__winner">
            {winner ? `Ganador: ${winner.name}` : 'Partida terminada'}
          </p>
          <p className="game-result-modal__reason">
            Motivo: {result.motivo}
          </p>
          <ol className="game-result-modal__ranking">
            {result.ranking.map((entry, i) => {
              const pl = players.find(p => p.userId === entry.userId);
              return (
                <li key={entry.userId} className="game-result-modal__rank-item">
                  <span className="rank-position">{i + 1}.</span>
                  <span className="rank-name">{pl?.name ?? entry.userId}</span>
                  <span className="rank-score">{entry.puntaje} pts</span>
                </li>
              );
            })}
          </ol>
          <button
            className="leave-game-modal__btn leave-game-modal__btn--danger"
            onClick={onClose}
          >Volver al lobby</button>
        </div>
      </section>
    </div>
  );
}
