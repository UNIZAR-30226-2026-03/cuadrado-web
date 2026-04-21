// pages/GamePage.tsx - Estadio 0: consola minima de partida + debug de eventos.

import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Stage0DebugEvent, Stage0PlayerState } from '../hooks/useGame';
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

function normalizePokerValue(card: Card): number | 'JOKER' {
  if (card.palo === 'joker' || card.carta >= 53) {
    return 'JOKER';
  }

  if (card.carta >= 1 && card.carta <= 13) {
    return card.carta;
  }

  // Fallback robusto: convierte IDs absolutos de mazo (p.ej. 14..52) en rango 1..13.
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

function formatCard(card: Card): string {
  const value = formatCardValue(card);

  if (value === 'JOKER') {
    return `JOKER (${card.puntos} pts)`;
  }

  return `${value}${SUIT_SYMBOL[card.palo] ?? ''} (${card.puntos} pts)`;
}

/** Dev panel colapsable para inspeccionar eventos WebSocket en tiempo real. */
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
    <aside className="stage0-debug">
      <button
        type="button"
        className="stage0-debug__toggle"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? 'Ocultar debug' : `Debug (${events.length})`}
      </button>

      {open && (
        <div className="stage0-debug__content">
          <div className="stage0-debug__actions">
            <button
              type="button"
              className="stage0-btn stage0-btn--ghost"
              onClick={onClear}
              disabled={events.length === 0}
            >
              Limpiar
            </button>
          </div>

          <div className="stage0-debug__list">
            {events.length === 0 && (
              <p className="stage0-empty">Sin eventos todavía.</p>
            )}

            {[...events].reverse().map((event, index) => (
              <article className="stage0-debug__item" key={`${event.receivedAt}-${index}`}>
                <header className="stage0-debug__item-head">
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

/** Modal simple de resultado final (ranking + puntuacion). */
function ResultModal({
  result,
  players,
  onClose,
}: {
  result: EvPartidaFinalizada;
  players: Stage0PlayerState[];
  onClose: () => void;
}) {
  const names = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach((player) => map.set(player.userId, player.name));
    return map;
  }, [players]);

  return (
    <div className="stage0-result-overlay">
      <div className="stage0-result-modal">
        <h2>Partida finalizada</h2>
        <ol>
          {result.ranking.map((entry) => (
            <li key={entry.userId}>
              <span>{names.get(entry.userId) ?? entry.userId}</span>
              <span>{entry.puntaje} pts</span>
            </li>
          ))}
        </ol>
        <button type="button" className="stage0-btn stage0-btn--primary" onClick={onClose}>
          Volver al lobby
        </button>
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
    selectableHandCount,
    debugEvents,
    drawCard,
    discardPending,
    swapWithPending,
    clearDebugEvents,
  } = useGame(myUserId);

  const [selectedSwapIndex, setSelectedSwapIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const activePlayerName =
    state.players.find((player) => player.userId === state.activePlayerId)?.name ??
    state.activePlayerId ??
    'Pendiente';

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

  const selectableIndexes = useMemo(
    () => Array.from({ length: selectableHandCount }, (_, index) => index),
    [selectableHandCount],
  );

  const sequenceEvents = useMemo(
    () => debugEvents.map((event) => event.event.replace(/^cache:/, '')),
    [debugEvents],
  );

  const recentBotEvents = useMemo(
    () => debugEvents.filter((event) => event.event.includes('bot-')).slice(-5).reverse(),
    [debugEvents],
  );

  const hasStarted = sequenceEvents.includes('game:inicio-partida');
  const hasTurnStarted = sequenceEvents.includes('game:turno-iniciado');
  const hasDraw = sequenceEvents.includes('game:carta-robada');
  const hasDecision = sequenceEvents.includes('game:decision-requerida');
  const hasDiscard = sequenceEvents.includes('game:descartar-pendiente');

  if (state.result) {
    return (
      <ResultModal
        result={state.result}
        players={state.players}
        onClose={() => navigate('/home')}
      />
    );
  }

  return (
    <div className="stage0-page">
      <header className="stage0-header">
        <div>
          <h1>Partida - Estadio 0</h1>
          <p>Hook minimo + visibilidad total de eventos</p>
        </div>
        <button
          type="button"
          className="stage0-btn stage0-btn--danger"
          onClick={handleLeave}
          disabled={leaving}
        >
          {leaving ? 'Saliendo...' : 'Salir'}
        </button>
      </header>

      <main className="stage0-grid">
        <section className="stage0-card">
          <h2>Estado minimo</h2>
          <dl className="stage0-kv">
            <div>
              <dt>gameId</dt>
              <dd>{state.gameId || 'sin asignar'}</dd>
            </div>
            <div>
              <dt>activePlayerId</dt>
              <dd>{state.activePlayerId ?? 'sin turno'}</dd>
            </div>
            <div>
              <dt>phase</dt>
              <dd>{state.phase ?? 'null'}</dd>
            </div>
            <div>
              <dt>deckCount</dt>
              <dd>{state.deckCount}</dd>
            </div>
            <div>
              <dt>pendingCard</dt>
              <dd>{state.pendingCard ? formatCard(state.pendingCard) : 'null'}</dd>
            </div>
            <div>
              <dt>topDiscard</dt>
              <dd>{state.topDiscardCard ? formatCard(state.topDiscardCard) : 'sin descartes'}</dd>
            </div>
            <div>
              <dt>result</dt>
              <dd>{state.result ? 'finalizada' : 'null'}</dd>
            </div>
          </dl>
        </section>

        <section className="stage0-card">
          <h2>Jugadores ({state.players.length})</h2>
          {state.players.length === 0 && <p className="stage0-empty">Esperando game:inicio-partida...</p>}
          <ul className="stage0-players">
            {state.players.map((player) => {
              const isActivePlayer = player.userId === state.activePlayerId;

              return (
                <li
                  key={player.userId}
                  className={[
                    isActivePlayer ? 'is-active' : '',
                    player.isMe ? 'is-me' : '',
                  ].join(' ')}
                >
                  <div>
                    <strong>{player.name}</strong>
                    <span className="stage0-player-role">{player.isBot ? 'bot' : 'humano'}</span>
                  </div>
                  <div className="stage0-player-side">
                    <span className="stage0-player-count">{player.cardCount} cartas</span>
                    {isActivePlayer && (
                      <span className="stage0-player-turn-badge">
                        {player.isMe ? 'TU TURNO' : 'EN TURNO'}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="stage0-card">
          <h2>Acciones del turno</h2>
          <p className="stage0-turn">
            {isMyTurn ? 'Tu turno' : `Turno de ${activePlayerName}`}
          </p>

          <div className="stage0-actions">
            <button
              type="button"
              className="stage0-btn stage0-btn--primary"
              onClick={drawCard}
              disabled={!canDrawCard}
            >
              Robar carta
            </button>

            <button
              type="button"
              className="stage0-btn stage0-btn--ghost"
              onClick={discardPending}
              disabled={!canResolvePending}
            >
              Descartar pendiente
            </button>
          </div>

          {state.pendingCard && (
            <div className="stage0-pending">
              <p>Carta pendiente: {formatCard(state.pendingCard)}</p>

              <div className="stage0-swap">
                <label htmlFor="swapIndex">Intercambiar por carta:</label>
                <select
                  id="swapIndex"
                  value={selectedSwapIndex}
                  onChange={(event) => setSelectedSwapIndex(Number(event.target.value))}
                  disabled={selectableHandCount === 0 || !canResolvePending}
                >
                  {selectableIndexes.map((index) => (
                    <option key={index} value={index}>
                      #{index + 1}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="stage0-btn stage0-btn--ghost"
                  onClick={() => swapWithPending(selectedSwapIndex)}
                  disabled={!canResolvePending || selectableHandCount === 0}
                >
                  Intercambiar
                </button>
              </div>
            </div>
          )}

          {!state.pendingCard && (
            <p className="stage0-empty">Sin carta pendiente.</p>
          )}

          <p className="stage0-footnote">
            Tu mano (estimada): {Math.max(0, (myPlayer?.cardCount ?? 0) - (state.pendingCard ? 1 : 0))} cartas
          </p>
        </section>

        <section className="stage0-card">
          <h2>Secuencia de validacion</h2>
          <ul className="stage0-sequence">
            <li className={hasStarted ? 'ok' : ''}>inicio-partida</li>
            <li className={hasTurnStarted ? 'ok' : ''}>turno-iniciado</li>
            <li className={hasDraw ? 'ok' : ''}>carta-robada</li>
            <li className={hasDecision ? 'ok' : ''}>decision-requerida</li>
            <li className={hasDiscard ? 'ok' : ''}>descartar-pendiente</li>
          </ul>
          <p className="stage0-footnote">
            Usa este checklist junto al panel debug para confirmar orden y payloads.
          </p>

          <h3 className="stage0-subtitle">Actividad reciente de bots</h3>
          {recentBotEvents.length === 0 && (
            <p className="stage0-empty">Sin eventos de bot todavía.</p>
          )}
          {recentBotEvents.length > 0 && (
            <ul className="stage0-bot-activity">
              {recentBotEvents.map((event, index) => {
                const payload = event.payload as { botId?: string };
                return (
                  <li key={`${event.receivedAt}-${index}`}>
                    <strong>{event.event}</strong>
                    <span>{payload.botId ?? 'bot'} • {new Date(event.receivedAt).toLocaleTimeString()}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <DebugPanel events={debugEvents} onClear={clearDebugEvents} />
    </div>
  );
}
