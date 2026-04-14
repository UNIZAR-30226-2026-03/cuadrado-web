// pages/GamePage.tsx - Pantalla de juego
//
// Layout dinámico: datos reales del usuario y skins via API. Lógica de juego pendiente.
// GSAP para entrada del tablero, stagger de slots, idle del botón CUBO.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import PlayerSlot, { type GamePlayer } from '../components/room/PlayerSlot';
import {
  connectRoomsSocket,
  disconnectRoomsSocket,
  getLastRoomState,
  getRoomsSocket,
  leaveRoom,
} from '../services/room.service';
import { getEquipped } from '../services/skin.service';
import type { EquippedSkinUrls } from '../services/skin.service';
import type { RoomState } from '../types/room.types';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR_URL, DEFAULT_CARD_URL } from '../config/skinDefaults';
import { getAccessToken } from '../utils/token';
import '../styles/AppModal.css';
import '../styles/GamePage.css';

// ── Tipos locales ─────────────────────────────────────────────────────────────

const DEMO_TURN_SECONDS = 30;

// ── Constantes de posicionamiento ─────────────────────────────────────────────
// Ángulos en grados (0°=derecha, 90°=abajo, 180°=izquierda, 270°=arriba)
// Convenio CSS-canvas: eje Y positivo hacia abajo.
const SLOT_ANGLES_DEG = [270, 315, 0, 45, 90, 135, 180, 225] as const;

// Para N jugadores, distribuir equidistantemente incluyendo siempre pos 4 (abajo) para 'isMe'
function getActivePositionIndices(n: number): number[] {
  const step = Math.floor(8 / n);
  return Array.from({ length: n }, (_, i) => (4 + i * step) % 8);
}

/**
 * Ordena jugadores para fijar siempre al usuario local en la posición inferior (índice angular 4).
 * Si no se encuentra una posición válida, mantiene el orden original.
 */
function orderPlayers(players: GamePlayer[], posIndices: number[]): GamePlayer[] {
  const orderedPlayers: GamePlayer[] = new Array(players.length);

  const mePlayers = players.filter(player => player.isMe);
  const restPlayers = players.filter(player => !player.isMe);
  const mePosInSlots = posIndices.findIndex(index => index === 4);

  if (mePosInSlots === -1 || mePlayers.length === 0) {
    players.forEach((player, index) => {
      orderedPlayers[index] = player;
    });
    return orderedPlayers;
  }

  orderedPlayers[mePosInSlots] = mePlayers[0];
  let restIndex = 0;
  for (let slotIndex = 0; slotIndex < players.length; slotIndex++) {
    if (slotIndex === mePosInSlots) continue;
    orderedPlayers[slotIndex] = restPlayers[restIndex++];
  }

  return orderedPlayers;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function GamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const boardRef     = useRef<HTMLDivElement>(null);
  const timerFillRef = useRef<HTMLDivElement>(null);
  const cuboRef      = useRef<HTMLButtonElement>(null);
  const voiceRef     = useRef<HTMLDivElement>(null);
  const slotRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const pilesRef     = useRef<HTMLDivElement>(null);

  const [mutedMic,  setMutedMic]  = useState(false);
  const [deafened,  setDeafened]  = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(() => getLastRoomState());
  const [equippedSkins, setEquippedSkins] = useState<EquippedSkinUrls | null>(null);

  const currentUserId = user?.username ?? '';
  const isHost = Boolean(roomState && currentUserId && roomState.hostId === currentUserId);
  const actionLabel = isHost ? 'Cerrar partida' : 'Salir de la partida';
  const actionDescription = isHost
    ? 'Eres anfitrion. Al cerrar la partida, se cerrara la sala y todos volveran al lobby.'
    : 'Al salir, dejaras de estar en la sala y volveras al lobby.';

  // Carga las skins equipadas del jugador local al montar
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    getEquipped(token).then(setEquippedSkins).catch(() => {});
  }, []);

  // Lista dinámica de jugadores: usuario local + resto de jugadores recibidos por socket
  // (incluye bots si el backend los ha añadido al iniciar la partida).
  const allPlayers = useMemo((): GamePlayer[] => {
    const me: GamePlayer = {
      id: currentUserId || 'me',
      name: currentUserId || 'Tú',
      elo: user?.eloRating ?? 1200,
      cardCount: 4,
      avatarUrl: equippedSkins?.avatar ?? DEFAULT_AVATAR_URL,
      cardSkinUrl: equippedSkins?.carta ?? DEFAULT_CARD_URL,
      isMe: true,
    };

    if (!roomState) return [me];

    const others: GamePlayer[] = roomState.players
      .filter(p => p.userId !== currentUserId)
      .map(p => ({
        id: p.userId,
        name: p.controlador === 'bot' ? (p.nombreEnPartida ?? 'Bot') : p.userId,
        elo: 1200,
        cardCount: 4,
        // No hay endpoint para skins equipadas de terceros: usar defaults visibles.
        avatarUrl: DEFAULT_AVATAR_URL,
        cardSkinUrl: DEFAULT_CARD_URL,
        isBot: p.controlador === 'bot',
      }));

    return [me, ...others];
  }, [currentUserId, user?.eloRating, equippedSkins, roomState]);

  // URL del tapete equipado (null → degradado CSS por defecto)
  const tapeteUrl = equippedSkins?.tapete ?? null;

  const n = allPlayers.length;
  const posIndices = getActivePositionIndices(n);

  // Radios del tapete (en px, aprox. la mitad del tamaño CSS)
  const rx = 280;
  const ry = 160;

  // ── Animaciones de entrada y idle ──────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. GameBoard: entrada escala
      tl.from(boardRef.current, {
        scale: 0.85,
        autoAlpha: 0,
        duration: 0.6,
      });

      // 2. PlayerSlots: stagger desde escala 0
      tl.from(slotRefs.current.filter(Boolean), {
        scale: 0,
        autoAlpha: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: 'back.out(1.7)',
      }, '-=0.25');

      // 3. CenterPiles: desde arriba
      if (pilesRef.current) {
        tl.from(pilesRef.current, {
          y: -30,
          autoAlpha: 0,
          duration: 0.35,
        }, '-=0.3');
      }

      // 4. VoiceChatBar: slide desde la derecha
      if (voiceRef.current) {
        tl.from(voiceRef.current, {
          x: 80,
          autoAlpha: 0,
          duration: 0.45,
        }, '-=0.3');
      }

      // 5. Idle CUBO: pulso continuo
      if (cuboRef.current) {
        gsap.to(cuboRef.current, {
          scale: 1.08,
          duration: 0.9,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }

      // 6. TurnTimerBar: animación demo de 100% → 0% en DEMO_TURN_SECONDS
      if (timerFillRef.current) {
        gsap.to(timerFillRef.current, {
          scaleX: 0,
          duration: DEMO_TURN_SECONDS,
          ease: 'none',
          onUpdate() {
            const el = timerFillRef.current;
            if (!el) return;
            const pct = parseFloat(gsap.getProperty(el, 'scaleX') as string);
            if (pct < 0.33) {
              el.classList.add('turn-timer-bar__fill--red');
              el.classList.remove('turn-timer-bar__fill--orange');
            } else if (pct < 0.66) {
              el.classList.add('turn-timer-bar__fill--orange');
              el.classList.remove('turn-timer-bar__fill--red');
            }
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const onRoomUpdate = (state: RoomState) => {
      if (!isMounted) return;
      setRoomState(state);
    };

    const onRoomClosed = () => {
      if (!isMounted) return;
      disconnectRoomsSocket();
      setRoomState(null);
      navigate('/home');
    };

    const initSocket = async () => {
      try {
        const socket = await connectRoomsSocket();
        if (!isMounted) return;

        socket.on('room:update', onRoomUpdate);
        socket.on('room:closed', onRoomClosed);
      } catch (error) {
        console.error('No se pudo conectar con la sala activa', error);
      }
    };

    initSocket();

    return () => {
      isMounted = false;
      const socket = getRoomsSocket();
      socket?.off('room:update', onRoomUpdate);
      socket?.off('room:closed', onRoomClosed);
    };
  }, [navigate]);

  useEffect(() => {
    if (!showConfigModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isLeavingRoom) return;
      setShowConfigModal(false);
      setConfigError(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showConfigModal, isLeavingRoom]);

  const handleCubo = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleLeaveOrCloseGame = async () => {
    if (isLeavingRoom) return;

    setIsLeavingRoom(true);
    setConfigError(null);

    try {
      await leaveRoom();
      disconnectRoomsSocket();
      setRoomState(null);
      setShowConfigModal(false);
      navigate('/home');
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'No se pudo salir de la partida');
    } finally {
      setIsLeavingRoom(false);
    }
  };

  const orderedPlayers = orderPlayers(allPlayers, posIndices);

  return (
    <div className="game-page">
      {/* ── Barra temporizador ── */}
      <div className="turn-timer-bar">
        <div className="turn-timer-bar__fill" ref={timerFillRef} />
      </div>

      {/* ── Configuracion de partida ── */}
      <button
        className="leave-game-btn"
        onClick={() => {
          setConfigError(null);
          setShowConfigModal(true);
        }}
        aria-label="Configuracion de partida"
        title="Configuracion de partida"
      >
        ⚙
      </button>

      {/* ── Tablero ── */}
      <div className="game-board" ref={boardRef}>
        <div
          className={`game-tapete${tapeteUrl ? ' game-tapete--skin' : ''}`}
        >
          {tapeteUrl && (
            <img
              className="game-tapete__skin"
              src={tapeteUrl}
              alt="Tapete equipado"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          {/* Pilas centrales */}
          <div className="center-piles" ref={pilesRef}>
            {/* Mazo de robar: 5 capas de profundidad + carta superior */}
            <div className="game-pile game-pile--draw">
              <div className="game-pile-depth" />
              <div className="game-pile-depth" />
              <div className="game-pile-depth" />
              <div className="game-pile-depth" />
              <div className="game-pile-depth" />
              <div className="game-pile-card" />
            </div>
            {/* Pila de descartes: abanico de 3 cartas + carta boca arriba */}
            <div className="game-pile game-pile--discard">
              <div className="game-pile-card game-pile-card--fan" />
              <div className="game-pile-card game-pile-card--fan" />
              <div className="game-pile-card game-pile-card--fan" />
              <div className="game-pile-card game-pile-card--face-up">
                <span className="game-pile-card__label">?</span>
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

      {/* ── Botón CUBO ── */}
      <button
        ref={cuboRef}
        className="cubo-btn"
        onClick={handleCubo}
        aria-label="Declarar cubo"
      >
        CUBO
      </button>

      {/* ── Toast CUBO ── */}
      {showToast && (
        <div className="cubo-toast" key={Date.now()}>¡Cubo declarado!</div>
      )}

      {/* ── Modal de configuracion de partida ── */}
      {showConfigModal && (
        <div
          className="app-modal-overlay"
          onClick={() => {
            if (isLeavingRoom) return;
            setShowConfigModal(false);
            setConfigError(null);
          }}
          role="presentation"
        >
          <section
            className="app-modal leave-game-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Configuracion de partida"
            onClick={event => event.stopPropagation()}
          >
            <header className="app-modal__header">
              <button
                className="app-modal__back"
                onClick={() => {
                  if (isLeavingRoom) return;
                  setShowConfigModal(false);
                  setConfigError(null);
                }}
              >
                ← Volver
              </button>
              <h2 className="app-modal__title">Configuracion de partida</h2>
              <div className="app-modal__spacer" aria-hidden="true" />
            </header>

            <div className="app-modal__content app-modal__content--tight">
              <div className="leave-game-modal__content">
                <p className="leave-game-modal__headline">{actionLabel}</p>
                <p className="leave-game-modal__text">{actionDescription}</p>

                {configError && (
                  <div className="leave-game-modal__error" role="alert">
                    {configError}
                  </div>
                )}

                <div className="leave-game-modal__actions">
                  <button
                    className="leave-game-modal__btn leave-game-modal__btn--ghost"
                    onClick={() => {
                      if (isLeavingRoom) return;
                      setShowConfigModal(false);
                      setConfigError(null);
                    }}
                    disabled={isLeavingRoom}
                  >
                    Cancelar
                  </button>

                  <button
                    className="leave-game-modal__btn leave-game-modal__btn--danger"
                    onClick={handleLeaveOrCloseGame}
                    disabled={isLeavingRoom}
                  >
                    {isLeavingRoom ? 'Procesando…' : actionLabel}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── VoiceChatBar ── */}
      <div className="voice-chat-bar" ref={voiceRef}>
        <button
          className={`voice-btn${mutedMic ? ' voice-btn--muted' : ''}`}
          onClick={() => setMutedMic(m => !m)}
          aria-label={mutedMic ? 'Activar micrófono' : 'Silenciar micrófono'}
          title={mutedMic ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {mutedMic ? '🔇' : '🎤'}
        </button>
        <button
          className={`voice-btn${deafened ? ' voice-btn--muted' : ''}`}
          onClick={() => setDeafened(d => !d)}
          aria-label={deafened ? 'Dejar de ensordecerse' : 'Ensordecerse'}
          title={deafened ? 'Dejar de ensordecerse' : 'Ensordecerse'}
        >
          {deafened ? '🚫🔊' : '🔊'}
        </button>
      </div>
    </div>
  );
}

