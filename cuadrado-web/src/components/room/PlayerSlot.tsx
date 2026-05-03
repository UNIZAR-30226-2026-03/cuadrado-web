// components/room/PlayerSlot.tsx - Slot de jugador posicionado sobre el tapete de juego.
//
// Renderiza avatar, nombre, ELO y mano de cartas de un jugador.
// Se posiciona absolutamente mediante ángulo polar + radios del tapete.

import '../../styles/VoiceChat.css';
import type { CSSProperties } from 'react';
import {
  clampHandCount,
  HAND_LAYOUT_SPECS,
  pendingRemovalSlotByPlayer,
  resolveHandGridState,
} from '../../utils/handGrid';

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Datos de un jugador necesarios para renderizar su slot en el tablero */
export interface GamePlayer {
  id: string;
  name: string;
  elo: number;
  cardCount: number;
  avatarUrl: string | null;
  cardSkinUrl: string | null;
  isMe?: boolean;
  isBot?: boolean;
}

// ── Helpers internos ──────────────────────────────────────────────────────────

/** Reverso de una carta individual */
function CardBack({ skinUrl, className = '', style }: { skinUrl: string | null; className?: string; style?: CSSProperties }) {
  return (
    <div className={`card-back${className ? ` ${className}` : ''}`} style={style}>
      {skinUrl && (
        <img
          className="card-back__skin"
          src={skinUrl}
          alt=""
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}

/** Mano de cartas en rejilla estable (2x2/2x3) con placeholders invisibles */
function CardHand({
  playerId,
  count,
  skinUrl,
  isMe = false,
  onCardClick,
  protectedIndices = new Set(),
}: {
  playerId: string;
  count: number;
  skinUrl: string | null;
  isMe?: boolean;
  onCardClick?: (cardIndex: number, slotIndex: number) => void;
  protectedIndices?: ReadonlySet<number>;
}) {
  const safeCount = clampHandCount(count);
  const { layout, occupiedSlots } = resolveHandGridState(playerId, safeCount);
  const layoutSpec = HAND_LAYOUT_SPECS[layout];

  if (safeCount === 0) {
    return null;
  }

  return (
    <div
      className={`card-hand card-hand--${layout}`}
      style={{
        gridTemplateColumns: `repeat(${layoutSpec.columns}, max-content)`,
        gridTemplateRows: `repeat(${layoutSpec.rows}, max-content)`,
      }}
    >
      {layoutSpec.cells.map(({ slotIndex, row, column }) => {
        // AQUÍ LA CLAVE: El índice en el array nos dice qué número de carta es
        const cardIndex = occupiedSlots.indexOf(slotIndex);
        const isOccupied = cardIndex !== -1;
        const cellStyle = { gridRow: row, gridColumn: column } as const;

        if (isOccupied) {
          const isProtected = protectedIndices.has(cardIndex);

          return isMe && onCardClick ? (
            <button
              key={slotIndex}
              className="card-back card-back--clickable"
              onClick={() => {
                pendingRemovalSlotByPlayer.set(playerId, slotIndex);
                onCardClick(cardIndex, slotIndex);
              }}
              type="button"
              aria-label={`Carta ${cardIndex + 1}`}
              style={cellStyle}
            >
              <CardBack skinUrl={skinUrl} />
              {isProtected && <span className="card-protected-badge">🔒</span>}
            </button>
          ) : (
            <div key={slotIndex} style={{ ...cellStyle, position: 'relative' }}>
              <CardBack skinUrl={skinUrl} />
              {isProtected && <span className="card-protected-badge">🔒</span>}
            </div>
          );
        }
        return <div key={slotIndex} className="card-back card-back--ghost" aria-hidden="true" style={cellStyle} />;
      })}
    </div>
  );
}

// ── Componente público ────────────────────────────────────────────────────────

interface PlayerSlotProps {
  player: GamePlayer;
  /** Ángulo en radianes (0=derecha, π/2=abajo) — convenio CSS-canvas */
  angleRad: number;
  /** Radio horizontal del tapete en px */
  rx: number;
  /** Radio vertical del tapete en px */
  ry: number;
  isActive?: boolean;
  cuboSource?: boolean;
  slotRef?: (el: HTMLDivElement | null) => void;
  /** true → borde de voz activo (rojo); false/undefined → sin borde de voz */
  voiceConnected?: boolean;
  /** true → jugador está hablando ahora mismo (borde brillante + pulse) */
  isSpeaking?: boolean;
  /** Callback para cuando el usuario hace clic en una carta de su mano */
  onCardClick?: (cardIndex: number) => void;
  protectedIndices?: ReadonlySet<number>;
}

/** Slot de jugador posicionado absolutamente sobre el tapete mediante ángulo polar */
export default function PlayerSlot({
  player,
  angleRad,
  rx,
  ry,
  isActive = false,
  cuboSource = false,
  slotRef,
  voiceConnected = false,
  isSpeaking = false,
  onCardClick,
  protectedIndices,
}: PlayerSlotProps) {
  const left = `calc(50% + ${Math.cos(angleRad) * rx}px)`;
  const top  = `calc(50% + ${Math.sin(angleRad) * ry}px)`;

  // Clase de indicador de voz: --speaking tiene prioridad sobre --voice
  const voiceClass = isSpeaking
    ? ' player-avatar--speaking'
    : voiceConnected
      ? ' player-avatar--voice'
      : '';

  return (
    <div
      ref={slotRef}
      className={`player-slot${player.isMe ? ' player-slot--me' : ''}${isActive ? ' player-slot--active' : ''}${cuboSource ? ' player-slot--cubo-source' : ''}`}
      style={{ left, top }}
    >
      <div className={`player-avatar${player.isMe ? ' player-avatar--me' : ''}${voiceClass}`}>
        <span className="player-avatar__fallback" aria-hidden="true">
          {player.name.charAt(0).toUpperCase() || '?'}
        </span>
        {player.avatarUrl && (
          <img
            src={player.avatarUrl}
            alt={player.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <span className="player-elo">{player.elo} ELO</span>
      </div>
      <CardHand
        playerId={player.id}
        count={player.cardCount}
        skinUrl={player.cardSkinUrl}
        isMe={player.isMe}
        onCardClick={onCardClick}
        protectedIndices={protectedIndices}
      />
    </div>
  );
}
