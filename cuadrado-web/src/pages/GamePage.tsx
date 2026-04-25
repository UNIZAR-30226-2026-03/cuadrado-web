// pages/GamePage.tsx - Estadio 4: habilidades interactivas simples (cartas 2, 3, 4, 10).

import { gsap } from 'gsap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerSlot, { type GamePlayer } from '../components/room/PlayerSlot';
import { useAuth } from '../context/AuthContext';
import type {
  InteractiveSkillType,
  PendingInteractiveSkill,
  Stage0DebugEvent,
  Stage0PlayerState,
  Stage0RematchState,
  Stage0SkillUse,
} from '../hooks/useGame';
import { useGame } from '../hooks/useGame';
import { disconnectRoomsSocket, leaveRoom } from '../services/room.service';
import type { Card, EvPartidaFinalizada } from '../types/game.types';
import '../styles/GamePage.css';

const SUIT_SYMBOL: Record<string, string> = {
  corazones: '♥',
  rombos: '♦',
  picas: '♠',
  treboles: '♣',
  joker: '★',
};

const SKILL_LABELS: Record<InteractiveSkillType, string> = {
  'ver-carta-propia': 'Ver una de tus cartas',
  'hacer-robar-carta': 'Elegir rival para robar carta',
  'proteger-carta': 'Proteger una de tus cartas',
  'saltar-turno': 'Saltar turno de un rival',
  'intercambiar-todas': 'Intercambiar todas tus cartas con un rival',
  'ver-carta-todos': 'Revelar una carta de cada rival',
  'ver-carta-propia-y-rival': 'Ver carta propia + carta de rival',
  'intercambiar-carta-preparar': 'Intercambio ciego: proponer rival y carta',
  'intercambiar-carta-rival': 'Intercambio ciego: elige tu carta',
};

const DENIED_SKILL_LABELS: Record<string, string> = {
  'jugador-menos-puntuacion': 'Poder 7: ver jugador con menos puntos',
  'desactivar-proxima-habilidad': 'Poder 8: anular siguiente habilidad',
  'ver-carta': 'Ver carta',
  'ver-carta-todos': 'Revelar carta de todos',
  'intercambiar-todas': 'Intercambiar todas las cartas',
  'hacer-robar-carta': 'Hacer robar carta',
  'proteger-carta': 'Proteger carta',
  'saltar-turno-jugador': 'Saltar turno',
  'intercambiar-carta': 'Intercambio ciego',
};

function normalizePokerValue(card: Card): number | 'JOKER' {
  if (card.palo === 'joker' || card.carta >= 53) {
    return 'JOKER';
  }

  if (card.carta >= 1 && card.carta <= 13) {
    return card.carta;
  }

  return ((card.carta - 1) % 13) + 1;
}

function formatCardValue(card: Card): string {
  const normalized = normalizePokerValue(card);

  if (normalized === 'JOKER') return 'JOKER';
  if (normalized === 1) return 'A';
  if (normalized === 11) return 'J';
  if (normalized === 12) return 'Q';
  if (normalized === 13) return 'K';

  return String(normalized);
}

function formatCardShort(card: Card): string {
  const value = formatCardValue(card);
  if (value === 'JOKER') return 'JOKER';
  return `${value}${SUIT_SYMBOL[card.palo] ?? ''}`;
}

function formatCardLong(card: Card): string {
  return `${formatCardShort(card)} (${card.puntos} pts)`;
}

function isRedSuit(card: Card): boolean {
  return card.palo === 'corazones' || card.palo === 'rombos';
}

function getAnglesForCount(count: number): number[] {
  if (count <= 1) {
    return [Math.PI / 2];
  }

  if (count === 2) {
    return [Math.PI / 2, -Math.PI / 2];
  }

  const step = (2 * Math.PI) / count;
  return Array.from({ length: count }, (_, index) => (Math.PI / 2) + step * index);
}

function rotatePlayersFromMe(players: Stage0PlayerState[], myUserId: string): Stage0PlayerState[] {
  const myIndex = players.findIndex((player) => player.userId === myUserId);
  if (myIndex <= 0) {
    return players;
  }

  return [...players.slice(myIndex), ...players.slice(0, myIndex)];
}

type RevealedCardInfo = {
  short: string;
  isRed: boolean;
};

function decodeCardId(cardId: number): RevealedCardInfo {
  if (cardId >= 53) {
    return { short: 'JOKER', isRed: false };
  }

  const normalized = ((cardId - 1) % 13) + 1;
  const suitIndex = Math.floor((cardId - 1) / 13);
  const suitMap = ['♣', '♦', '♥', '♠'];
  const suit = suitMap[suitIndex] ?? '?';

  const value =
    normalized === 1 ? 'A' :
      normalized === 11 ? 'J' :
        normalized === 12 ? 'Q' :
          normalized === 13 ? 'K' :
            String(normalized);

  const isRed = suit === '♦' || suit === '♥';

  return {
    short: `${value}${suit}`,
    isRed,
  };
}

function toBoardPlayer(player: Stage0PlayerState, cardCount: number): GamePlayer {
  return {
    id: player.userId,
    name: player.name,
    elo: 1200,
    cardCount,
    avatarUrl: null,
    cardSkinUrl: null,
    isMe: player.isMe,
    isBot: player.isBot,
  };
}

function PendingCardPanel({
  pendingCard,
  selectableHandCount,
  canResolve,
  selectedSwapIndex,
  onSelectSwap,
  onDiscard,
  onConfirmSwap,
}: {
  pendingCard: Card;
  selectableHandCount: number;
  canResolve: boolean;
  selectedSwapIndex: number | null;
  onSelectSwap: (index: number) => void;
  onDiscard: () => void;
  onConfirmSwap: () => void;
}) {
  return (
    <section className="stage2-pending">
      <h3>Carta pendiente</h3>

      <div className="stage2-pending__body">
        <div className={`stage2-card-face${isRedSuit(pendingCard) ? ' stage2-card-face--red' : ''}`}>
          <span className="stage2-card-face__value">{formatCardShort(pendingCard)}</span>
          <span className="stage2-card-face__points">{pendingCard.puntos} pts</span>
        </div>

        <div className="stage2-pending__actions">
          <button
            type="button"
            className="stage2-btn stage2-btn--danger"
            onClick={onDiscard}
            disabled={!canResolve}
          >
            Descartar
          </button>

          <div className="stage2-swap">
            <span>Intercambiar con carta:</span>
            <div className="stage2-swap__grid">
              {Array.from({ length: selectableHandCount }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`stage2-swap__card${selectedSwapIndex === index ? ' stage2-swap__card--selected' : ''}`}
                  onClick={() => onSelectSwap(index)}
                  disabled={!canResolve}
                >
                  #{index + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="stage2-btn stage2-btn--primary"
              onClick={onConfirmSwap}
              disabled={!canResolve || selectedSwapIndex === null || selectableHandCount === 0}
            >
              Confirmar intercambio
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Panel de habilidad interactiva (Estadios 4 y 5).
 * Soporta selección de rival, carta propia, carta rival y respuesta bilateral.
 */
function SkillPanel({
  pendingSkill,
  rivals,
  rivalCardCountById,
  myCardCount,
  myProtectedIndices,
  canAct,
  onVerCarta,
  onVerCartaPropiaYRival,
  onVerCartaTodos,
  onIntercambiarTodas,
  onPrepararIntercambioCiego,
  onResponderIntercambioCiego,
  onHacerRobarCarta,
  onSaltarTurno,
  onProtegerCarta,
}: {
  pendingSkill: PendingInteractiveSkill;
  rivals: Stage0PlayerState[];
  rivalCardCountById: ReadonlyMap<string, number>;
  myCardCount: number;
  myProtectedIndices: ReadonlySet<number>;
  canAct: boolean;
  onVerCarta: (index: number) => void;
  onVerCartaPropiaYRival: (indexPropia: number, rivalId: string, indexRival: number) => void;
  onVerCartaTodos: () => void;
  onIntercambiarTodas: (rivalId: string) => void;
  onPrepararIntercambioCiego: (indexPropia: number, rivalId: string) => void;
  onResponderIntercambioCiego: (indexPropia: number) => void;
  onHacerRobarCarta: (rivalId: string) => void;
  onSaltarTurno: (rivalId: string) => void;
  onProtegerCarta: (index: number) => void;
}) {
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedRivalCardIndex, setSelectedRivalCardIndex] = useState<number | null>(null);

  const fixedRivalId = pendingSkill.tipo === 'intercambiar-carta-rival'
    ? (pendingSkill.rivalId ?? null)
    : null;
  const activeRivalId = fixedRivalId ?? selectedRivalId;

  const isSimpleRivalSkill =
    pendingSkill.tipo === 'hacer-robar-carta' ||
    pendingSkill.tipo === 'saltar-turno' ||
    pendingSkill.tipo === 'intercambiar-todas';

  const isSimpleCardSkill =
    pendingSkill.tipo === 'ver-carta-propia' ||
    pendingSkill.tipo === 'proteger-carta';

  const isBlindPrepareSkill = pendingSkill.tipo === 'intercambiar-carta-preparar';
  const isBlindReplySkill = pendingSkill.tipo === 'intercambiar-carta-rival';
  const isRevealAllSkill = pendingSkill.tipo === 'ver-carta-todos';
  const isRevealOwnAndRivalSkill = pendingSkill.tipo === 'ver-carta-propia-y-rival';

  const activeRivalCardCount = activeRivalId
    ? Math.max(0, rivalCardCountById.get(activeRivalId) ?? 0)
    : 0;

  const canConfirm =
    canAct && (
      (isRevealAllSkill) ||
      (isSimpleRivalSkill && selectedRivalId !== null) ||
      (isSimpleCardSkill && selectedCardIndex !== null) ||
      (isBlindPrepareSkill && selectedRivalId !== null && selectedCardIndex !== null) ||
      (isBlindReplySkill && selectedCardIndex !== null) ||
      (
        isRevealOwnAndRivalSkill &&
        selectedCardIndex !== null &&
        selectedRivalId !== null &&
        selectedRivalCardIndex !== null
      )
    );

  function handleConfirm() {
    if (!canConfirm) return;

    switch (pendingSkill.tipo) {
      case 'ver-carta-propia':
        if (selectedCardIndex !== null) onVerCarta(selectedCardIndex);
        return;
      case 'proteger-carta':
        if (selectedCardIndex !== null) onProtegerCarta(selectedCardIndex);
        return;
      case 'hacer-robar-carta':
        if (selectedRivalId !== null) onHacerRobarCarta(selectedRivalId);
        return;
      case 'saltar-turno':
        if (selectedRivalId !== null) onSaltarTurno(selectedRivalId);
        return;
      case 'intercambiar-todas':
        if (selectedRivalId !== null) onIntercambiarTodas(selectedRivalId);
        return;
      case 'ver-carta-todos':
        onVerCartaTodos();
        return;
      case 'ver-carta-propia-y-rival':
        if (
          selectedCardIndex !== null &&
          selectedRivalId !== null &&
          selectedRivalCardIndex !== null
        ) {
          onVerCartaPropiaYRival(selectedCardIndex, selectedRivalId, selectedRivalCardIndex);
        }
        return;
      case 'intercambiar-carta-preparar':
        if (selectedCardIndex !== null && selectedRivalId !== null) {
          onPrepararIntercambioCiego(selectedCardIndex, selectedRivalId);
        }
        return;
      case 'intercambiar-carta-rival':
        if (selectedCardIndex !== null) {
          onResponderIntercambioCiego(selectedCardIndex);
        }
        return;
      default:
        return;
    }
  }

  const confirmLabel =
    pendingSkill.tipo === 'ver-carta-todos'
      ? 'Revelar cartas'
      : pendingSkill.tipo === 'intercambiar-carta-preparar'
        ? 'Enviar propuesta'
        : pendingSkill.tipo === 'intercambiar-carta-rival'
          ? 'Confirmar intercambio'
          : 'Confirmar';

  return (
    <section className="stage2-skill-panel">
      <h3 className="stage2-skill-panel__title">{SKILL_LABELS[pendingSkill.tipo]}</h3>

      {isRevealAllSkill && (
        <p className="stage2-skill-panel__hint">
          Se revelará una carta aleatoria no protegida de cada rival.
        </p>
      )}

      {isBlindReplySkill && (
        <p className="stage2-skill-panel__hint">
          Te han propuesto un intercambio ciego. Elige la carta que vas a entregar.
        </p>
      )}

      {(isSimpleRivalSkill || isBlindPrepareSkill || isRevealOwnAndRivalSkill) && (
        <ul className="stage2-rival-list">
          {rivals.map((rival) => (
            <li key={rival.userId}>
              <button
                type="button"
                className={`stage2-rival-item${selectedRivalId === rival.userId ? ' stage2-rival-item--selected' : ''}`}
                onClick={() => {
                  setSelectedRivalId(rival.userId);
                  setSelectedRivalCardIndex(null);
                }}
                disabled={!canAct}
              >
                {rival.name}
                {rival.isBot && <span className="stage2-rival-badge">BOT</span>}
              </button>
            </li>
          ))}
          {rivals.length === 0 && (
            <li className="stage2-rival-empty">No hay rivales disponibles.</li>
          )}
        </ul>
      )}

      {(isSimpleCardSkill || isBlindPrepareSkill || isBlindReplySkill || isRevealOwnAndRivalSkill) && (
        <div className="stage2-skill-section">
          <p className="stage2-skill-panel__hint">
            {isBlindReplySkill ? 'Tu carta para entregar:' : 'Selecciona una carta de tu mano:'}
          </p>
          <div className="stage2-swap__grid">
            {Array.from({ length: myCardCount }).map((_, index) => {
              const isProtected = myProtectedIndices.has(index);
              return (
                <button
                  key={index}
                  type="button"
                  className={`stage2-swap__card${selectedCardIndex === index ? ' stage2-swap__card--selected' : ''}${isProtected ? ' stage2-swap__card--protected' : ''}`}
                  onClick={() => setSelectedCardIndex(index)}
                  disabled={!canAct}
                  title={isProtected ? 'Carta protegida' : undefined}
                >
                  #{index + 1}{isProtected ? ' 🔒' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isRevealOwnAndRivalSkill && activeRivalId && (
        <div className="stage2-skill-section">
          <p className="stage2-skill-panel__hint">Selecciona una carta del rival:</p>
          <div className="stage2-swap__grid">
            {Array.from({ length: activeRivalCardCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`stage2-swap__card${selectedRivalCardIndex === index ? ' stage2-swap__card--selected' : ''}`}
                onClick={() => setSelectedRivalCardIndex(index)}
                disabled={!canAct}
              >
                Rival #{index + 1}
              </button>
            ))}
            {activeRivalCardCount === 0 && (
              <p className="stage2-rival-empty">El rival no tiene cartas disponibles.</p>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="stage2-btn stage2-btn--primary"
        onClick={handleConfirm}
        disabled={!canConfirm}
      >
        {confirmLabel}
      </button>
    </section>
  );
}

/**
 * Modal de revelación temporal de carta propia (poder carta 10) o propia+rival (J).
 * Cuando hay cartaJugadorContrario, muestra botones para decidir si intercambiar (J).
 */
function PeekedCardReveal({
  reveal,
  onDismiss,
  onSwap,
}: {
  reveal: { carta: Card; cartaJugadorContrario?: Card };
  onDismiss: () => void;
  onSwap?: () => void;
}) {
  const hasRivalCard = Boolean(reveal.cartaJugadorContrario);
  const isJDecide = hasRivalCard && Boolean(onSwap);

  useEffect(() => {
    // El temporizador solo aplica al poder 10 (sin decisión pendiente).
    if (isJDecide) return;
    const id = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(id);
  }, [onDismiss, isJDecide]);

  return (
    <div className="stage2-peek-overlay" role="dialog" aria-modal="true">
      <div className="stage2-peek-modal">
        <p className="stage2-peek-modal__label">
          {isJDecide ? '¿Intercambiar estas cartas?' : hasRivalCard ? 'Cartas reveladas:' : 'Tu carta revelada:'}
        </p>

        <div className={`stage2-peek-grid${hasRivalCard ? ' stage2-peek-grid--double' : ''}`}>
          <div className="stage2-peek-entry">
            <span className="stage2-peek-entry__title">Tu carta</span>
            <div className={`stage2-card-face${isRedSuit(reveal.carta) ? ' stage2-card-face--red' : ''}`}>
              <span className="stage2-card-face__value">{formatCardShort(reveal.carta)}</span>
              <span className="stage2-card-face__points">{reveal.carta.puntos} pts</span>
            </div>
          </div>

          {reveal.cartaJugadorContrario && (
            <div className="stage2-peek-entry">
              <span className="stage2-peek-entry__title">Carta rival</span>
              <div className={`stage2-card-face${isRedSuit(reveal.cartaJugadorContrario) ? ' stage2-card-face--red' : ''}`}>
                <span className="stage2-card-face__value">{formatCardShort(reveal.cartaJugadorContrario)}</span>
                <span className="stage2-card-face__points">{reveal.cartaJugadorContrario.puntos} pts</span>
              </div>
            </div>
          )}
        </div>

        {isJDecide ? (
          <div className="stage2-reveal-actions">
            <button type="button" className="stage2-btn stage2-btn--primary" onClick={onSwap}>
              Intercambiar
            </button>
            <button type="button" className="stage2-btn stage2-btn--ghost" onClick={onDismiss}>
              No intercambiar
            </button>
          </div>
        ) : (
          <button type="button" className="stage2-btn stage2-btn--ghost" onClick={onDismiss}>
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}

function RevealedCardsOverlay({
  reveals,
  playerNameById,
  onClose,
}: {
  reveals: Array<{ jugadorId: string; indexCarta: number; carta: Card }>;
  playerNameById: ReadonlyMap<string, string>;
  onClose: () => void;
}) {
  const MIN_VISIBLE_MS = 2200;
  const BASE_VISIBLE_MS = 3200;
  const EXTRA_PER_CARD_MS = 1300;

  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const totalVisibleMs = BASE_VISIBLE_MS + (reveals.length * EXTRA_PER_CARD_MS);

  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, totalVisibleMs);
    const tickId = window.setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(tickId);
    };
  }, [onClose, totalVisibleMs]);

  if (reveals.length === 0) {
    return null;
  }

  const elapsedMs = Math.max(0, now - openedAt);
  const remainingMs = Math.max(0, totalVisibleMs - elapsedMs);
  const minLockMs = Math.max(0, MIN_VISIBLE_MS - elapsedMs);
  const canCloseNow = minLockMs === 0;
  const progress = Math.max(0, Math.min(1, elapsedMs / totalVisibleMs));

  return (
    <div className="stage2-peek-overlay" role="dialog" aria-modal="true">
      <div className="stage2-peek-modal">
        <p className="stage2-peek-modal__label">
          Cartas reveladas ({reveals.length})
        </p>

        <p className="stage2-skill-panel__hint">
          Se muestran todas las cartas reveladas de este poder.
        </p>

        <p className="stage2-skill-panel__hint">
          Cierre automático en {(remainingMs / 1000).toFixed(1)}s
        </p>

        <div className="stage2-overlay-timer" aria-hidden="true">
          <div
            className="stage2-overlay-timer__fill"
            style={{ transform: `scaleX(${Math.max(0, 1 - progress)})` }}
          />
        </div>

        <div className="stage2-revealed-grid">
          {reveals.map((reveal) => {
            const playerName = playerNameById.get(reveal.jugadorId) ?? reveal.jugadorId;
            return (
              <article key={`${reveal.jugadorId}-${reveal.indexCarta}`} className="stage2-revealed-item">
                <p className="stage2-revealed-item__meta">
                  {playerName} · posición #{reveal.indexCarta + 1}
                </p>

                <div className={`stage2-card-face${isRedSuit(reveal.carta) ? ' stage2-card-face--red' : ''}`}>
                  <span className="stage2-card-face__value">{formatCardShort(reveal.carta)}</span>
                  <span className="stage2-card-face__points">{reveal.carta.puntos} pts</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="stage2-reveal-actions">
          <button
            type="button"
            className="stage2-btn stage2-btn--ghost"
            onClick={onClose}
            disabled={!canCloseNow}
          >
            {canCloseNow
              ? 'Cerrar'
              : `Cerrar en ${(minLockMs / 1000).toFixed(1)}s`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Panel permanente de poderes almacenables (cartas 7 y 8). Similar al banner de CUBO. */
function StoredPowersPanel({
  storedPowers,
  canUsePoder7,
  canUsePoder8,
  onUsarPoder7,
  onUsarPoder8,
}: {
  storedPowers: number[];
  canUsePoder7: boolean;
  canUsePoder8: boolean;
  onUsarPoder7: () => void;
  onUsarPoder8: () => void;
}) {
  const hasPower7 = storedPowers.includes(7);
  const hasPower8 = storedPowers.includes(8);
  const hasAny = hasPower7 || hasPower8;

  return (
    <section
      className={`stage2-stored-powers${hasAny ? ' stage2-stored-powers--active' : ''}`}
      aria-live="polite"
    >
      <div className="stage2-stored-powers__header">
        <p className="stage2-stored-powers__title">Poderes guardados</p>
        <p className="stage2-stored-powers__hint">
          {hasAny
            ? 'Actívalos al inicio de tu turno (antes de robar).'
            : 'Aquí aparecerán los poderes que guardes al descartar una 7 u 8.'}
        </p>
      </div>

      <div className="stage2-stored-powers__list">
        <div className={`stage2-stored-power-slot${hasPower7 ? ' stage2-stored-power-slot--ready' : ''}`}>
          <span className="stage2-stored-power-slot__label">Carta 7</span>
          <span className="stage2-stored-power-slot__desc">
            {hasPower7 ? 'Revela quién tiene menos puntos' : 'Sin poder guardado'}
          </span>
          <button
            type="button"
            className="stage2-btn stage2-btn--primary stage2-stored-power-slot__btn"
            onClick={onUsarPoder7}
            disabled={!canUsePoder7}
          >
            {hasPower7 ? 'Usar' : '—'}
          </button>
        </div>

        <div className={`stage2-stored-power-slot${hasPower8 ? ' stage2-stored-power-slot--ready' : ''}`}>
          <span className="stage2-stored-power-slot__label">Carta 8</span>
          <span className="stage2-stored-power-slot__desc">
            {hasPower8 ? 'Anula la siguiente habilidad activa' : 'Sin poder guardado'}
          </span>
          <button
            type="button"
            className="stage2-btn stage2-btn--primary stage2-stored-power-slot__btn"
            onClick={onUsarPoder8}
            disabled={!canUsePoder8}
          >
            {hasPower8 ? 'Usar' : '—'}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Overlay modal con el resultado del poder 7. */
function MenosPuntuacionOverlay({
  jugadorId,
  playerNameById,
  onClose,
}: {
  jugadorId: string;
  playerNameById: ReadonlyMap<string, string>;
  onClose: () => void;
}) {
  const playerName = playerNameById.get(jugadorId) ?? jugadorId;

  useEffect(() => {
    const id = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(id);
  }, [onClose]);

  return (
    <div className="stage2-peek-overlay" role="dialog" aria-modal="true">
      <div className="stage2-peek-modal">
        <p className="stage2-peek-modal__label">Poder 7 — Jugador con menos puntos</p>
        <div className="stage2-menos-puntuacion-result">
          <span className="stage2-menos-puntuacion-result__name">{playerName}</span>
          <span className="stage2-menos-puntuacion-result__hint">tiene la mano con menos puntos</span>
        </div>
        <button type="button" className="stage2-btn stage2-btn--ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

function DebugPanel({
  events,
  onClear,
}: {
  events: Stage0DebugEvent[];
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <aside className="stage2-debug">
      <button
        type="button"
        className="stage2-debug__toggle"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? 'Ocultar debug' : `Debug (${events.length})`}
      </button>

      {open && (
        <div className="stage2-debug__content">
          <div className="stage2-debug__actions">
            <button type="button" className="stage2-btn stage2-btn--ghost" onClick={onClear}>
              Limpiar
            </button>
          </div>

          <div className="stage2-debug__list">
            {[...events].reverse().map((event, index) => (
              <article className="stage2-debug__item" key={`${event.receivedAt}-${index}`}>
                <header>
                  <strong>{event.event}</strong>
                  <span>{new Date(event.receivedAt).toLocaleTimeString()}</span>
                </header>
                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
              </article>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function SkillUseIndicator({
  skillUse,
}: {
  skillUse: Stage0SkillUse;
}) {
  const modeLabel = skillUse.trigger === 'auto' ? 'Auto-resuelta' : 'Activada al descartar';

  return (
    <section className="stage2-skill-indicator" role="status" aria-live="polite">
      <p className="stage2-skill-indicator__title">Habilidad {skillUse.powerValue} en uso</p>
      <p className="stage2-skill-indicator__meta">{modeLabel} por {skillUse.byName}</p>
      <p className="stage2-skill-indicator__desc">{skillUse.shortDesc}</p>
    </section>
  );
}

function SkillDeniedIndicator({
  habilidad,
}: {
  habilidad: string;
}) {
  const habilidadLabel = DENIED_SKILL_LABELS[habilidad] ?? habilidad;

  return (
    <section className="stage2-skill-indicator stage2-skill-indicator--denied" role="alert" aria-live="assertive">
      <p className="stage2-skill-indicator__title">Poder anulado</p>
      <p className="stage2-skill-indicator__meta">Tu habilidad fue cancelada por una carta 8.</p>
      <p className="stage2-skill-indicator__desc">Acción anulada: {habilidadLabel}. La habilidad no tuvo efecto y el turno avanza.</p>
    </section>
  );
}

function ResultModal({
  result,
  players,
  rematch,
  myUserId,
  onClose,
  onReplay,
}: {
  result: EvPartidaFinalizada;
  players: Stage0PlayerState[];
  rematch: Stage0RematchState;
  myUserId: string;
  onClose: () => void;
  onReplay: () => void;
}) {
  const [phase, setPhase] = useState<'reveal' | 'scores'>('reveal');
  const [replayRequested, setReplayRequested] = useState(false);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach((player) => map.set(player.userId, player.name));
    return map;
  }, [players]);

  const revealRows = useMemo(() => {
    return result.cartasJugadores.map((entry) => ({
      playerId: entry.jugadorId,
      playerName: names.get(entry.jugadorId) ?? entry.jugadorId,
      cards: entry.valoresCartas.map((cardId) => decodeCardId(cardId)),
    }));
  }, [result.cartasJugadores, names]);

  useEffect(() => {
    if (phase !== 'reveal') {
      return;
    }

    const timeoutMs = 2600 + revealRows.length * 650;
    const id = window.setTimeout(() => {
      setPhase('scores');
    }, timeoutMs);

    return () => {
      window.clearTimeout(id);
    };
  }, [phase, revealRows.length]);

  const waitingForHost = rematch.status === 'waiting-host';
  const rematchReady = rematch.status === 'room-ready';
  const hostName = rematch.hostId ? (names.get(rematch.hostId) ?? rematch.hostId) : null;
  const iAmReady = rematch.readyPlayerIds.includes(myUserId);

  return (
    <div className="stage2-result-overlay">
      <div className="stage2-result-modal">
        <h2>Partida finalizada</h2>

        {phase === 'reveal' ? (
          <>
            <p className="stage2-help">Revelando cartas...</p>
            <div className="stage2-result-reveal-grid">
              {revealRows.map((row) => (
                <article key={row.playerId} className="stage2-result-reveal-player">
                  <p className="stage2-result-reveal-player__name">{row.playerName}</p>
                  <div className="stage2-result-reveal-cards">
                    {row.cards.map((card, index) => (
                      <div
                        key={`${row.playerId}-${index}`}
                        className={`stage2-card-face stage2-card-face--small${card.isRed ? ' stage2-card-face--red' : ''}`}
                      >
                        <span className="stage2-card-face__value">{card.short}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="stage2-btn stage2-btn--ghost"
              onClick={() => setPhase('scores')}
            >
              Ver puntuaciones
            </button>
          </>
        ) : (
          <>
            <ol>
              {result.ranking.map((entry) => (
                <li key={entry.userId}>
                  <span>{names.get(entry.userId) ?? entry.userId}</span>
                  <span>{entry.puntaje} pts</span>
                </li>
              ))}
            </ol>

            <div className="stage2-result-actions">
              <button type="button" className="stage2-btn stage2-btn--ghost" onClick={onClose}>
                Volver al lobby
              </button>

              <button
                type="button"
                className="stage2-btn stage2-btn--primary"
                onClick={() => { setReplayRequested(true); onReplay(); }}
                disabled={replayRequested}
              >
                {replayRequested ? 'Preparando...' : 'Volver a jugar'}
              </button>
            </div>

            {waitingForHost && (
              <p className="stage2-help stage2-help--warning">
                {iAmReady ? 'Estás listo para revancha. ' : ''}
                Esperando a que {hostName ?? 'el líder'} pulse "Volver a jugar".
              </p>
            )}

            {rematchReady && (
              <p className="stage2-help">
                Sala de revancha preparada: {rematch.roomName ?? 'Sala'} ({rematch.roomCode ?? '---'}).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function GamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const myUserId = user?.username ?? '';

  const {
    state,
    myPlayer,
    isMyTurn,
    canDrawCard,
    canResolvePending,
    canActSkill,
    canRequestCubo,
    canUsePoder7,
    canUsePoder8,
    selectableHandCount,
    lastSkillUse,
    debugEvents,
    drawCard,
    discardPending,
    swapWithPending,
    verCarta,
    verCartaPropiaYRival,
    verCartaTodos,
    intercambiarTodas,
    prepararIntercambioCiego,
    responderIntercambioCiego,
    hacerRobarCarta,
    saltarTurno,
    protegerCarta,
    decidirIntercambioJ,
    clearPeekedCard,
    clearRevealedCards,
    clearDebugEvents,
    solicitarCubo,
    usarPoder7,
    usarPoder8,
    clearMenosPuntuacionResult,
    deniedSkillNotice,
    clearDeniedSkillNotice,
    power8PendingCount,
    power8QueuedCount,
    power8LastActivatorId,
    volverAJugar,
  } = useGame(myUserId);

  const [selectedSwapIndex, setSelectedSwapIndex] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [boardRadii, setBoardRadii] = useState({ rx: 290, ry: 170 });
  const [visibleSkillUse, setVisibleSkillUse] = useState<Stage0SkillUse | null>(null);
  const [visibleCuboToast, setVisibleCuboToast] = useState(false);
  // Solo navegar a la sala de revancha si el usuario pulsó "Volver a jugar" explícitamente
  const [rematchNavigationArmed, setRematchNavigationArmed] = useState(false);

  const myProtectedIndices = state.myProtectedIndices;

  const boardRef = useRef<HTMLDivElement | null>(null);
  const timerFillRef = useRef<HTMLDivElement | null>(null);
  const timerTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) {
      return;
    }

    const updateRadii = () => {
      const rect = boardElement.getBoundingClientRect();
      const next = {
        rx: Math.round(Math.max(130, rect.width * 0.42)),
        ry: Math.round(Math.max(92, rect.height * 0.38)),
      };

      setBoardRadii((prev) => (
        prev.rx === next.rx && prev.ry === next.ry ? prev : next
      ));
    };

    updateRadii();

    const observer = new ResizeObserver(updateRadii);
    observer.observe(boardElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const timerElement = timerFillRef.current;
    if (!timerElement) {
      return;
    }

    timerTweenRef.current?.kill();

    if (!state.turnDeadlineAt || state.result) {
      gsap.set(timerElement, { transformOrigin: 'left center', scaleX: 0 });
      return;
    }

    const remainingMs = Math.max(0, state.turnDeadlineAt - Date.now());
    gsap.set(timerElement, { transformOrigin: 'left center', scaleX: 1 });

    if (remainingMs === 0) {
      gsap.set(timerElement, { transformOrigin: 'left center', scaleX: 0 });
      return;
    }

    timerTweenRef.current = gsap.to(timerElement, {
      scaleX: 0,
      duration: remainingMs / 1000,
      ease: 'none',
    });

    return () => {
      timerTweenRef.current?.kill();
    };
  }, [state.turnDeadlineAt, state.activePlayerId, state.result]);

  useEffect(() => {
    if (selectableHandCount === 0) {
      setSelectedSwapIndex(null);
      return;
    }

    if (selectedSwapIndex === null) {
      return;
    }

    if (selectedSwapIndex >= selectableHandCount) {
      setSelectedSwapIndex(selectableHandCount - 1);
    }
  }, [selectableHandCount, selectedSwapIndex]);

  useEffect(() => {
    if (!lastSkillUse) {
      // Turno nuevo: limpiar el banner para que no quede colgado.
      setVisibleSkillUse(null);
      return;
    }

    setVisibleSkillUse(lastSkillUse);
    const timeoutId = window.setTimeout(() => {
      setVisibleSkillUse((current) => (
        current?.eventAt === lastSkillUse.eventAt ? null : current
      ));
    }, 5200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [lastSkillUse]);

  useEffect(() => {
    if (!deniedSkillNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearDeniedSkillNotice();
    }, 4800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [deniedSkillNotice, clearDeniedSkillNotice]);

  useEffect(() => {
    if (!state.cuboActive || !state.cuboSolicitanteId || !state.cuboAnnouncedAt) {
      setVisibleCuboToast(false);
      return;
    }

    setVisibleCuboToast(true);
    const timeoutId = window.setTimeout(() => {
      setVisibleCuboToast(false);
    }, 5200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.cuboActive, state.cuboAnnouncedAt, state.cuboSolicitanteId]);

  const orderedPlayers = useMemo(
    () => rotatePlayersFromMe(state.players, myUserId),
    [state.players, myUserId],
  );

  const renderPlayers = useMemo(
    () => orderedPlayers.slice(0, 8).map((player) => ({
      base: player,
      display: toBoardPlayer(player, player.cardCount),
    })),
    [orderedPlayers],
  );

  const positionedPlayers = useMemo(() => {
    const angles = getAnglesForCount(renderPlayers.length);

    return renderPlayers.map((playerBundle, index) => ({
      ...playerBundle,
      angleRad: angles[index],
    }));
  }, [renderPlayers]);

  // Rivales disponibles para habilidades que requieren seleccionar jugador.
  const rivals = useMemo(
    () => state.players.filter((p) => !p.isMe),
    [state.players],
  );

  const rivalCardCountById = useMemo(
    () => new Map(state.players.filter((p) => !p.isMe).map((p) => [p.userId, p.cardCount])),
    [state.players],
  );

  const playerNameById = useMemo(
    () => new Map(state.players.map((p) => [p.userId, p.name])),
    [state.players],
  );

  const activePlayerName =
    state.players.find((player) => player.userId === state.activePlayerId)?.name ??
    state.activePlayerId ??
    'Pendiente';

  const cuboSourceName = state.cuboSolicitanteId
    ? playerNameById.get(state.cuboSolicitanteId) ?? state.cuboSolicitanteId
    : null;

  const power8ActivatorName = power8LastActivatorId
    ? playerNameById.get(power8LastActivatorId) ?? power8LastActivatorId
    : null;

  const lastExchangeLabel = useMemo(() => {
    if (!state.lastExchange) {
      return null;
    }

    const from = playerNameById.get(state.lastExchange.remitente) ?? state.lastExchange.remitente;
    const to = playerNameById.get(state.lastExchange.destinatario) ?? state.lastExchange.destinatario;
    return `${from} ↔ ${to}`;
  }, [state.lastExchange, playerNameById]);

  const outOfStageRangePlayers = Math.max(0, state.players.length - 8);

  const handleProtegerCarta = useCallback((index: number) => {
    protegerCarta(index);
  }, [protegerCarta]);

  const handleLeave = useCallback(async () => {
    if (leaving) {
      return;
    }

    setLeaving(true);
    try {
      await leaveRoom();
      disconnectRoomsSocket();
    } finally {
      navigate('/home');
    }
  }, [leaving, navigate]);

  const handleConfirmSwap = useCallback(() => {
    if (selectedSwapIndex === null) {
      return;
    }
    swapWithPending(selectedSwapIndex);
  }, [selectedSwapIndex, swapWithPending]);

  const handleCuboClick = useCallback(() => {
    solicitarCubo();
  }, [solicitarCubo]);

  const handleReplay = useCallback(() => {
    setRematchNavigationArmed(true);
    volverAJugar();
  }, [volverAJugar]);

  useEffect(() => {
    if (!rematchNavigationArmed || state.rematch.status !== 'room-ready' || !state.rematch.roomCode) {
      return;
    }

    navigate('/waiting-room', {
      state: {
        roomCode: state.rematch.roomCode,
        roomName: state.rematch.roomName ?? 'Sala de revancha',
      },
    });
  }, [rematchNavigationArmed, navigate, state.rematch.roomCode, state.rematch.roomName, state.rematch.status]);

  if (state.result) {
    return (
      <ResultModal
        result={state.result}
        players={state.players}
        rematch={state.rematch}
        myUserId={myUserId}
        onClose={handleLeave}
        onReplay={handleReplay}
      />
    );
  }

  return (
    <div className="stage2-page">
      <header className="stage2-header">
        <div>
          <h1>Partida</h1>
          <p>{isMyTurn ? 'Tu turno' : `Turno de ${activePlayerName}`}</p>
        </div>
        <button
          type="button"
          className="stage2-btn stage2-btn--danger"
          onClick={handleLeave}
          disabled={leaving}
        >
          {leaving ? 'Saliendo...' : 'Salir'}
        </button>
      </header>

      <div className={`stage2-turn-timer${state.cuboActive ? ' stage2-turn-timer--cubo' : ''}`} aria-label="Temporizador de turno">
        <div className="stage2-turn-timer__fill" ref={timerFillRef} />
      </div>

      <section className={`stage2-cubo-banner${state.cuboActive ? ' stage2-cubo-banner--active' : ''}${visibleCuboToast ? ' stage2-cubo-banner--toast' : ''}`} aria-live="polite">
        <div className="stage2-cubo-banner__text">
          <p className="stage2-cubo-banner__title">CUBO</p>
          <p className="stage2-cubo-banner__desc">
            {state.cuboActive
              ? `${cuboSourceName ?? 'Un jugador'} ha dicho CUBO. Última ronda en marcha.`
              : 'Puedes declarar CUBO cuando creas que tienes la mano con menos puntos.'}
          </p>
        </div>

        <div className="stage2-cubo-banner__meta">
          {state.cuboActive ? (
            <>
              <span className="stage2-cubo-banner__count">Quedan {Math.max(0, state.cuboTurnosRestantes)} turno(s)</span>
              <span className="stage2-cubo-banner__source">Marcado: {cuboSourceName ?? 'Pendiente'}</span>
            </>
          ) : (
            <span className="stage2-cubo-banner__source">La última ronda se activará en cuanto un jugador pulse CUBO.</span>
          )}
        </div>

        <button
          type="button"
          className="stage2-btn stage2-btn--danger stage2-cubo-banner__btn"
          onClick={handleCuboClick}
          disabled={!canRequestCubo}
        >
          {state.cuboActive ? 'CUBO ya activado' : 'Decir CUBO'}
        </button>
      </section>

      <StoredPowersPanel
        storedPowers={state.myStoredPowers}
        canUsePoder7={canUsePoder7}
        canUsePoder8={canUsePoder8}
        onUsarPoder7={usarPoder7}
        onUsarPoder8={usarPoder8}
      />

      {(power8PendingCount > 0 || power8QueuedCount > 0) && (
        <section className="stage2-poder8-global" role="status" aria-live="polite">
          <p className="stage2-poder8-global__title">
            {power8PendingCount > 0 ? 'Carta 8 activa' : 'Carta 8 preparada'}
          </p>
          <p className="stage2-poder8-global__desc">
            {power8ActivatorName
              ? `${power8ActivatorName} activó una anulación global.`
              : 'Hay una anulación global en partida.'}
          </p>
          {power8QueuedCount > 0 && (
            <p className="stage2-poder8-global__desc">
              Entrará en vigor al finalizar el turno actual.
            </p>
          )}
          <p className="stage2-poder8-global__meta">
            Habilidades por anular: {power8PendingCount}
          </p>
          {power8QueuedCount > 0 && (
            <p className="stage2-poder8-global__meta">
              Anulaciones armadas (este turno): {power8QueuedCount}
            </p>
          )}
        </section>
      )}

      {visibleSkillUse && (
        <SkillUseIndicator skillUse={visibleSkillUse} />
      )}

      {deniedSkillNotice && (
        <SkillDeniedIndicator habilidad={deniedSkillNotice.habilidad} />
      )}

      {lastExchangeLabel && (
        <section className="stage2-skill-indicator" role="status" aria-live="polite">
          <p className="stage2-skill-indicator__title">Intercambio aplicado</p>
          <p className="stage2-skill-indicator__meta">{lastExchangeLabel}</p>
        </section>
      )}

      <main className="stage2-main">
        <section className={`stage2-board-shell${state.cuboActive ? ' stage2-board-shell--cubo' : ''}`}>
          <div className="stage2-board" ref={boardRef}>
            <div className="stage2-center-piles">
              <button
                type="button"
                className={`stage2-pile stage2-pile--deck${canDrawCard ? ' stage2-pile--active' : ''}`}
                onClick={drawCard}
                disabled={!canDrawCard}
              >
                <span className="stage2-pile__title">Mazo</span>
                <strong>{state.deckCount}</strong>
              </button>

              <div className="stage2-pile stage2-pile--discard">
                <span className="stage2-pile__title">Descarte</span>
                <div className="stage2-discard-face">
                  <strong>{state.topDiscardCard ? formatCardShort(state.topDiscardCard) : '-'}</strong>
                  <small>
                    {state.topDiscardCard ? `${state.topDiscardCard.puntos} pts` : 'Sin cartas'}
                  </small>
                </div>
              </div>
            </div>

            {positionedPlayers.map(({ base, display, angleRad }) => (
              <PlayerSlot
                key={base.userId}
                player={display}
                angleRad={angleRad}
                rx={boardRadii.rx}
                ry={boardRadii.ry}
                isActive={base.userId === state.activePlayerId}
                cuboSource={state.cuboActive && base.userId === state.cuboSolicitanteId}
              />
            ))}
          </div>
        </section>

        {state.pendingCard && (
          <PendingCardPanel
            pendingCard={state.pendingCard}
            selectableHandCount={selectableHandCount}
            canResolve={canResolvePending}
            selectedSwapIndex={selectedSwapIndex}
            onSelectSwap={setSelectedSwapIndex}
            onDiscard={discardPending}
            onConfirmSwap={handleConfirmSwap}
          />
        )}

        {state.pendingSkill && (isMyTurn || state.pendingSkill.tipo === 'intercambiar-carta-rival') && (
          <SkillPanel
            key={`${state.pendingSkill.tipo}-${state.pendingSkill.gameId}-${state.pendingSkill.rivalId ?? ''}`}
            pendingSkill={state.pendingSkill}
            rivals={rivals}
            rivalCardCountById={rivalCardCountById}
            myCardCount={selectableHandCount}
            myProtectedIndices={myProtectedIndices}
            canAct={canActSkill}
            onVerCarta={verCarta}
            onVerCartaPropiaYRival={verCartaPropiaYRival}
            onVerCartaTodos={verCartaTodos}
            onIntercambiarTodas={intercambiarTodas}
            onPrepararIntercambioCiego={prepararIntercambioCiego}
            onResponderIntercambioCiego={responderIntercambioCiego}
            onHacerRobarCarta={hacerRobarCarta}
            onSaltarTurno={saltarTurno}
            onProtegerCarta={handleProtegerCarta}
          />
        )}

        {myProtectedIndices.size > 0 && !state.result && (
          <p className="stage2-help stage2-help--protected">
            Protegidas: {Array.from(myProtectedIndices).sort((a, b) => a - b).map((i) => `#${i + 1}`).join(', ')}
          </p>
        )}

        {!state.pendingCard && !state.pendingSkill && (
          <p className="stage2-help">Roba una carta del mazo para continuar el turno.</p>
        )}

        <p className="stage2-help">Estado: {state.phase ?? 'sin fase'} · gameId: {state.gameId || 'pendiente'} · turno #{state.turnIndex}</p>
        <p className="stage2-help">Descarte superior: {state.topDiscardCard ? formatCardLong(state.topDiscardCard) : 'sin cartas'}</p>

        {outOfStageRangePlayers > 0 && (
          <p className="stage2-help stage2-help--warning">
            Hay {outOfStageRangePlayers} jugador(es) fuera del rango visual 2-8 de este estadio.
          </p>
        )}

        {!myPlayer && (
          <p className="stage2-help stage2-help--warning">
            Esperando sincronización del jugador local.
          </p>
        )}
      </main>

      {state.peekedCard && (
        <PeekedCardReveal
          reveal={state.peekedCard}
          onDismiss={state.peekedCard.cartaJugadorContrario
            ? () => decidirIntercambioJ(false)
            : clearPeekedCard}
          onSwap={state.peekedCard.cartaJugadorContrario
            ? () => decidirIntercambioJ(true)
            : undefined}
        />
      )}

      {state.revealedCards.length > 0 && (
        <RevealedCardsOverlay
          key={`${state.revealedCards[0]?.jugadorId ?? ''}-${state.revealedCards.length}`}
          reveals={state.revealedCards}
          playerNameById={playerNameById}
          onClose={clearRevealedCards}
        />
      )}

      {state.menosPuntuacionJugadorId && (
        <MenosPuntuacionOverlay
          key={state.menosPuntuacionJugadorId}
          jugadorId={state.menosPuntuacionJugadorId}
          playerNameById={playerNameById}
          onClose={clearMenosPuntuacionResult}
        />
      )}

      <DebugPanel events={debugEvents} onClear={clearDebugEvents} />
    </div>
  );
}
