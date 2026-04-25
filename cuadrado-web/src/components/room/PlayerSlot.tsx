// components/room/PlayerSlot.tsx - Slot de jugador posicionado sobre el tapete de juego.
//
// Renderiza avatar, nombre, ELO y mano de cartas de un jugador.
// Se posiciona absolutamente mediante ángulo polar + radios del tapete.

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
function CardBack({ skinUrl }: { skinUrl: string | null }) {
  return (
    <div className="card-back">
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

type HandLayout = '2x2' | '2x3';

const GRID_2X2_SLOTS = [0, 1, 2, 3] as const;
const GRID_2X3_ADD_ORDER = [0, 1, 3, 4, 2, 5] as const;

// Memoria de cartas máximas vistas por jugador para mantener layout sticky 2x3.
const maxCardsSeenByPlayer = new Map<string, number>();

function clampHandCount(count: number): number {
  return Math.max(0, Math.min(6, count));
}

function takeSlots(order: readonly number[], count: number): number[] {
  return order.slice(0, clampHandCount(count));
}

/**
 * Mantiene slots estables para facilitar memoria espacial de cartas:
 * - 4 cartas: 2x2 centrado.
 * - Al llegar a 5/6: pasa a 2x3.
 * - Al bajar desde 2x3: conserva 2x3 para no recolocar cartas.
 */
function resolveHandGridState(count: number, maxCardsSeen: number): {
  layout: HandLayout;
  occupiedSlots: number[];
} {
  const safeCount = clampHandCount(count);
  const seen = clampHandCount(maxCardsSeen);
  const sticky2x3 = seen >= 5;

  if (!sticky2x3) {
    return {
      layout: '2x2',
      occupiedSlots: takeSlots(GRID_2X2_SLOTS, safeCount),
    };
  }

  return {
    layout: '2x3',
    occupiedSlots: takeSlots(GRID_2X3_ADD_ORDER, safeCount),
  };
}

function getStickyMaxCardsSeen(playerId: string, count: number): number {
  const safeCount = clampHandCount(count);
  const previousMax = maxCardsSeenByPlayer.get(playerId) ?? safeCount;
  const nextMax = Math.max(previousMax, safeCount);
  maxCardsSeenByPlayer.set(playerId, nextMax);
  return nextMax;
}

/** Mano de cartas en rejilla estable (2x2/2x3) con placeholders invisibles */
function CardHand({ playerId, count, skinUrl }: { playerId: string; count: number; skinUrl: string | null }) {
  const safeCount = clampHandCount(count);
  const maxCardsSeen = getStickyMaxCardsSeen(playerId, safeCount);

  const { layout, occupiedSlots } = resolveHandGridState(safeCount, maxCardsSeen);
  const cols = layout === '2x3' ? 3 : 2;
  const totalSlots = layout === '2x3' ? 6 : 4;
  const occupied = new Set(occupiedSlots);

  return (
    <div
      className={`card-hand card-hand--${layout}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: totalSlots }, (_, slotIdx) => (
        occupied.has(slotIdx)
          ? <CardBack key={slotIdx} skinUrl={skinUrl} />
          : <div key={slotIdx} className="card-back card-back--ghost" aria-hidden="true" />
      ))}
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
}

/** Slot de jugador posicionado absolutamente sobre el tapete mediante ángulo polar */
export default function PlayerSlot({ player, angleRad, rx, ry, isActive = false, cuboSource = false, slotRef }: PlayerSlotProps) {
  const left = `calc(50% + ${Math.cos(angleRad) * rx}px)`;
  const top  = `calc(50% + ${Math.sin(angleRad) * ry}px)`;

  return (
    <div
      ref={slotRef}
      className={`player-slot${player.isMe ? ' player-slot--me' : ''}${isActive ? ' player-slot--active' : ''}${cuboSource ? ' player-slot--cubo-source' : ''}`}
      style={{ left, top }}
    >
      <div className={`player-avatar${player.isMe ? ' player-avatar--me' : ''}`}>
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
      <CardHand playerId={player.id} count={player.cardCount} skinUrl={player.cardSkinUrl} />
    </div>
  );
}
