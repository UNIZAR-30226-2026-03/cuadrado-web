// pages/WaitingRoomPage.tsx - Sala de Espera
//
// Muestra el estado en tiempo real de la sala de espera via WebSocket.
// Incluye: indicador del jugador propio, info de sala, poderes con detalle
// por palo, código copiable en esquina y flujo de relleno con bots.

import { useEffect, useState, useRef, useCallback } from 'react';
import gsap from 'gsap';
import GameHeader from '../components/game/GameHeader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  connectRoomsSocket,
  disconnectRoomsSocket,
  getRoomsSocket,
  startRoom,
  leaveRoom,
  getLastRoomState,
} from '../services/room.service';
import { POWER_MAP } from '../data/cardPowers';
import type { RoomState } from '../types/room.types';
import '../styles/RoomPages.css';

interface LocalBot {
  userId: string;
  isBot: true;
}

// Función pura fuera del componente: formatea segundos a "m:ss" o "Xs"
function formatTurnTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const sec = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${sec}`;
  }
  return `${seconds}s`;
}

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estado inicial desde caché para evitar parpadeo "Cargando sala…"
  const [room, setRoom] = useState<RoomState | null>(getLastRoomState());
  const [showPowers, setShowPowers] = useState(false);
  const [selectedPower, setSelectedPower] = useState<string | null>(null);
  const [closedByHost, setClosedByHost] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showFillBots, setShowFillBots] = useState(false);
  const [fillingBots, setFillingBots] = useState(false);
  const [localBots, setLocalBots] = useState<LocalBot[]>([]);

  const isLeavingRef = useRef(false);
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // El backend usa el username como userId en las salas (decoded.sub del JWT)
  const currentUserId = user?.username ?? '';

  // ── Conexión y escucha en tiempo real ───────────────────────────────
  useEffect(() => {
    let isMounted = true;

    // Handlers nombrados para poder eliminarlos individualmente en cleanup.
    // socket.off sin referencia de función eliminaría TODOS los listeners del evento,
    // incluyendo el listener permanente de caché de room.service.ts.
    const handleRoomUpdate = (state: RoomState) => {
      if (!isMounted) return;
      setRoom(state);
      // Navegar a /game para todos los jugadores (no solo el host) cuando inicia la partida
      if (state.started) {
        navigate('/game');
      }
    };

    const handleRoomClosed = () => {
      if (!isMounted) return;
      if (isLeavingRef.current) return;
      disconnectRoomsSocket();
      setRoom(null);
      setClosedByHost(true);
    };

    const init = async () => {
      const socket = await connectRoomsSocket();
      socket.on('room:update', handleRoomUpdate);
      socket.on('room:closed', handleRoomClosed);
    };

    init();

    return () => {
      isMounted = false;
      const socket = getRoomsSocket();
      socket?.off('room:update', handleRoomUpdate);
      socket?.off('room:closed', handleRoomClosed);
    };
  }, [navigate]);

  // Animar el último slot de bot añadido tras cada render
  useEffect(() => {
    if (localBots.length === 0 || !room) return;
    const botSlotIndex = room.players.length + localBots.length - 1;
    const slotEl = slotRefs.current[botSlotIndex];
    if (slotEl) {
      gsap.from(slotEl, { scale: 0, opacity: 0, duration: 0.4, ease: 'back.out(1.7)' });
    }
  }, [localBots.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Comenzar partida ────────────────────────────────────────────────
  const handleStart = async () => {
    if (!room) return;
    if (room.players.length === 1 && !room.rules.fillWithBots) {
      return;
    }

    if (room.players.length >= room.rules.maxPlayers) {
      try {
        await startRoom(room.code);
        navigate('/game');
      } catch (err) {
        console.error(err);
      }
    } else if (room.rules.fillWithBots) {
      setShowFillBots(true);
    } else {
      try {
        await startRoom(room.code);
        navigate('/game');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFillBots = async () => {
    if (!room) return;
    setFillingBots(true);
    const numBots = room.rules.maxPlayers - room.players.length;
    for (let i = 0; i < numBots; i++) {
      if (i > 0) {
        await new Promise<void>(r => setTimeout(r, 500));
      }
      setLocalBots(prev => [...prev, { userId: `Bot ${i + 1}`, isBot: true }]);
    }
    // Esperar a que la animación del último bot termine antes de enviar la señal
    await new Promise<void>(r => setTimeout(r, 600));
    try {
      await startRoom(room.code);
      navigate('/game');
    } catch (err) {
      console.error(err);
      // Restaurar estado para que el usuario pueda reintentar
      setFillingBots(false);
      setLocalBots([]);
    }
  };

  const handleBack = async () => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    try {
      await leaveRoom();
    } catch (e) {
      console.error('Error al abandonar la sala', e);
    } finally {
      disconnectRoomsSocket();
      setRoom(null);
      navigate('/home');
    }
  };

  // ── Copiar código al portapapeles ───────────────────────────────────
  const handleCopyCode = useCallback(() => {
    if (!room) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }, [room]);

  // ── Popup: sala cerrada por el admin ────────────────────────────────
  if (closedByHost) {
    return (
      <div className="app-page">
        <div className="room-modal-overlay">
          <div className="room-modal">
            <p className="room-modal__icon">🚪</p>
            <h3 className="room-modal__title">Sala cerrada</h3>
            <p className="room-modal__body">
              El administrador ha abandonado la sala. Has sido expulsado de la partida.
            </p>
            <button className="room-cta" onClick={() => navigate('/home')}>
              Volver al lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Estado de carga ─────────────────────────────────────────────────
  if (!room) {
    return (
      <div className="app-page">
        <GameHeader title="Sala de espera" onBack={handleBack} />
        <p style={{ textAlign: 'center' }}>Cargando sala…</p>
      </div>
    );
  }

  const maxPlayers = room.rules.maxPlayers;
  const deckCount = room.rules.deckCount;
  const isHost = currentUserId === room.hostId;
  const blockedSoloStart = room.players.length === 1 && !room.rules.fillWithBots;
  
  // ── Construir slots ─────────────────────────────────────────────────
  type Slot =
    | { type: 'blocked' }
    | { type: 'empty' }
    | { type: 'player'; data: RoomState['players'][number] }
    | { type: 'bot'; data: LocalBot };

  const allPlayers: (RoomState['players'][number] | LocalBot)[] = [
    ...room.players,
    ...localBots,
  ];

  const slots: Slot[] = Array.from({ length: 8 }, (_, i): Slot => {
    if (i >= maxPlayers) return { type: 'blocked' };
    const p = allPlayers[i];
    if (!p) return { type: 'empty' };
    if ('isBot' in p) return { type: 'bot', data: p as LocalBot };
    return { type: 'player', data: p as RoomState['players'][number] };
  });

  return (
    <div className="app-page">
      <GameHeader title="Sala de espera" onBack={handleBack} />

      <main className="app-page__content room-page__content">

        {/* ── Título ────────────────────────────────────────────── */}
        <section className="room-section">
          <p className="room-section__title">
            Sala de {room.name}
          </p>

          {/* ── Badges de información de sala ──────────────────── */}
          <div className="room-info-bar">
            <span className={`room-info-badge ${room.rules.isPrivate ? 'room-info-badge--private' : 'room-info-badge--public'}`}>
              {room.rules.isPrivate ? '🔒 Privada' : '🌐 Pública'}
            </span>
            <span className="room-info-badge">
              🃏 {deckCount} {deckCount === 1 ? 'baraja' : 'barajas'}
            </span>
            <span className="room-info-badge">
              ⏱️ {formatTurnTime(room.rules.turnTimeSeconds)} por turno
            </span>
            <span className="room-info-badge">
              👥 {room.players.length}/{maxPlayers} jugadores
            </span>
          </div>

          {/* ── Panel de slots ─────────────────────────────────── */}
          <div className="app-page__panel room-panel room-panel--center">
            <div className="waiting-grid">
              {slots.map((slot, index) => {
                const isSelf = slot.type === 'player' && slot.data.userId === currentUserId;

                return (
                  <div
                    key={index}
                    ref={el => { slotRefs.current[index] = el; }}
                    className={`waiting-slot ${slot.type}${isSelf ? ' waiting-slot--self' : ''}`}
                  >
                    {slot.type === 'blocked' && (
                      <span className="waiting-slot__blocked">🔒</span>
                    )}

                    {slot.type === 'empty' && (
                      <span className="waiting-slot__empty">Vacío</span>
                    )}

                    {slot.type === 'player' && (
                      <div className="waiting-slot__player">
                        <div className="waiting-avatar">
                          {/* Inicial del username como avatar (el backend no envía avatarUrl en RoomState) */}
                          <span className="waiting-avatar__initial">
                            {slot.data.userId.charAt(0).toUpperCase()}
                          </span>
                          {slot.data.userId === room.hostId && (
                            <span className="waiting-crown">👑</span>
                          )}
                        </div>
                        <div className="waiting-player-info">
                          <span className="waiting-name">
                            {slot.data.userId}
                            {isSelf && <span className="waiting-you-badge"> (Tú)</span>}
                          </span>
                        </div>
                      </div>
                    )}

                    {slot.type === 'bot' && (
                      <div className="waiting-slot__player">
                        <div className="waiting-avatar waiting-avatar--bot">
                          <span className="waiting-avatar__initial">🤖</span>
                        </div>
                        <div className="waiting-player-info">
                          <span className="waiting-name">{slot.data.userId}</span>
                          <span className="waiting-bot-badge">Bot</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="room-footer room-footer--waiting">
          <div className="room-footer__row">
            <button
              className="room-link-btn"
              onClick={() => { setShowPowers(true); setSelectedPower(null); }}
            >
              Cartas con poderes
            </button>

            {/* Botón de iniciar — solo para el admin */}
            {isHost && (
              <button
                className="room-cta"
                disabled={blockedSoloStart}
                onClick={handleStart}
                title={blockedSoloStart ? 'Necesitas al menos otro jugador o tener completar con bots activo' : undefined}
              >
                Comenzar partida
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ── Código copiable (esquina inferior derecha) ─────────────────── */}
      <button
        className="room-code-corner"
        onClick={handleCopyCode}
        title="Clic para copiar el código"
      >
        <span className="room-code-corner__label">Código</span>
        <span className="room-code-corner__value">{room.code}</span>
        <span className="room-code-corner__copy">{codeCopied ? '✅' : '📋'}</span>
      </button>

      {/* ── Modal: rellenar con bots ─────────────────────────────────── */}
      {showFillBots && (
        <div
          className="room-modal-overlay"
          onClick={() => { if (!fillingBots) setShowFillBots(false); }}
        >
          <div
            className="room-modal room-modal--fill-bots"
            onClick={e => e.stopPropagation()}
          >
            <p className="room-modal__icon">⚠️</p>
            <h3 className="room-modal__title">Sala incompleta</h3>
            <p className="room-modal__body">
              Hay {room.rules.maxPlayers - room.players.length} hueco
              {room.rules.maxPlayers - room.players.length !== 1 ? 's' : ''} libre
              {room.rules.maxPlayers - room.players.length !== 1 ? 's' : ''}.
              ¿Rellenar con bots y comenzar?
            </p>
            <div className="room-modal__actions">
              <button
                className="room-link-btn"
                disabled={fillingBots}
                onClick={() => setShowFillBots(false)}
              >
                Cancelar
              </button>
              <button
                className="room-cta"
                disabled={fillingBots}
                onClick={handleFillBots}
              >
                {fillingBots ? 'Rellenando…' : 'Rellenar con bots y empezar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de poderes ─────────────────────────────────────────── */}
      {showPowers && (
        <div
          className="room-modal-overlay"
          onClick={() => setShowPowers(false)}
        >
          <div
            className={`room-modal room-modal--powers${selectedPower ? ' room-modal--powers-detail' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="room-modal__title">Cartas con poderes activos</h3>

            {room.rules.enabledPowers.length === 0 ? (
              <p className="powers-empty">No hay poderes activos en esta sala.</p>
            ) : (
              <div className="powers-layout">
                <div className="powers-fan-panel">
                  <div className="powers-fan">
                    {room.rules.enabledPowers.map((p, i) => (
                      <button
                        key={p}
                        className={`fan-card${selectedPower === p ? ' fan-card--selected' : ''}`}
                        style={{ '--fan-index': i, '--fan-total': room.rules.enabledPowers.length } as React.CSSProperties}
                        onClick={() => setSelectedPower(prev => prev === p ? null : p)}
                      >
                        <span className="fan-card__value">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detalle de la carta seleccionada: los 4 palos */}
                {selectedPower && (
                  <div className="power-detail">
                    <h4 className="power-detail__title">Carta {selectedPower}</h4>
                    <div className="power-detail__suits">
                      <span className="suit-card suit-card--hearts">
                        {selectedPower}<span className="suit">♥</span>
                      </span>
                      <span className="suit-card suit-card--diamonds">
                        {selectedPower}<span className="suit">♦</span>
                      </span>
                      <span className="suit-card suit-card--clubs">
                        {selectedPower}<span className="suit">♣</span>
                      </span>
                      <span className="suit-card suit-card--spades">
                        {selectedPower}<span className="suit">♠</span>
                      </span>
                    </div>
                    <p className="power-detail__desc">
                      {POWER_MAP[selectedPower]?.shortDesc ?? 'Poder activo en esta sala.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="room-modal__actions">
              <button
                className="room-link-btn"
                onClick={() => navigate('/rules')}
              >
                Cómo jugar
              </button>
              <button
                className="room-cta"
                onClick={() => setShowPowers(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
