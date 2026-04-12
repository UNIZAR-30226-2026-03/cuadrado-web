// pages/WaitingRoomPage.tsx - Sala de Espera

import { useEffect, useState, useRef } from 'react';
import GameHeader from '../components/GameHeader';
import { useNavigate } from 'react-router-dom';
import {
  connectRoomsSocket,
  getRoomsSocket,
  startRoom,
  leaveRoom
} from '../services/room.service';
import type { RoomState } from '../types/room.types';
import '../styles/RoomPages.css';

export default function WaitingRoomPage() {
  const navigate = useNavigate();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [showPowers, setShowPowers] = useState(false);

  const isLeavingRef = useRef(false);

  const userId = localStorage.getItem('userId'); // asumimos que existe
  

  // ── Conexión y escucha en tiempo real ───────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const socket = await connectRoomsSocket();

      socket.on('room:update', (state: RoomState) => {
        if (!isMounted) return;
        setRoom(state);
      });

      socket.on('room:closed', () => {
        if (isLeavingRef.current) return;
        navigate('/');
      });
    };

    init();

    return () => {
      isMounted = false;
      const socket = getRoomsSocket();
      socket?.off('room:update');
    };
  }, [navigate]);

  // ── Comenzar partida ────────────────────────────────────────────────
  const handleStart = async () => {
    if (!room) return;
    try {
      await startRoom(room.code);
      navigate('/game');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBack = async () => {
    isLeavingRef.current = true;
    try{
        await leaveRoom();
    }catch (e) {
        console.error(e);
    }finally{
        navigate(-1);
    }
  }

  if (!room) {
    return (
      <div className="skin-page">
        <GameHeader title="Sala de espera" onBack={handleBack} />
        <p style={{ textAlign: 'center' }}>Cargando sala…</p>
      </div>
    );
  }

  const maxPlayers = room.rules.maxPlayers;

  // ── Construir slots ─────────────────────────────────────────────────
  type Slot =
    | { type: 'blocked' }
    | { type: 'empty' }
    | { type: 'player'; data: RoomState['players'][number] };

  const slots: Slot[] = Array.from({ length: 8 }, (_, i): Slot => {
    if (i >= maxPlayers) {
      return { type: 'blocked' };
    }

    const player = room.players[i];
    if (!player) {
      return { type: 'empty' };
    }

    return { type: 'player', data: player };
  });

  const isHost = userId === room.hostId;

  return (
    <div className="skin-page">
    <GameHeader title="Sala de espera" onBack={handleBack} />

    <main className="skin-page__content room-page__content">

      {/* ── Título ───────────────────────────────────────────── */}
      <section className="room-section">
        <p className="room-section__title">
          Sala de {room.name}
        </p>

        {/* ── Panel principal ───────────────────────────── */}
        <div className="skin-page__panel room-panel room-panel--center">

          {/* GRID */}
          <div className="waiting-grid">
            {slots.map((slot, index) => (
              <div key={index} className={`waiting-slot ${slot.type}`}>

                {slot.type === 'blocked' && (
                  <span className="waiting-slot__blocked">🔒</span>
                )}

                {slot.type === 'empty' && (
                  <span className="waiting-slot__empty">Vacío</span>
                )}

                {slot.type === 'player' && (
                  <div className="waiting-slot__player">
                    <div className="waiting-avatar">
                      {slot.data.userId === room.hostId && (
                        <span className="waiting-crown">👑</span>
                      )}
                    </div>
                    <span className="waiting-name">
                      {slot.data.userId}
                    </span>
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="room-footer room-footer--spread">

        <button
          className="room-link-btn"
          onClick={() => setShowPowers(true)}
        >
          Cartas con poderes
        </button>

        <button
          className="room-cta"
          disabled={!isHost}
          onClick={handleStart}
        >
          Comenzar partida
        </button>

        <div className="room-code">
          Código: <strong>{room.code}</strong>
        </div>

      </div>
    </main>

    {/* ── MODAL ───────────────────────────────────────────── */}
    {showPowers && (
      <div className="waiting-modal-overlay">
        <div className="waiting-modal">

          <h3 className="waiting-modal__title">
            Poderes activos
          </h3>

          <div className="waiting-cards">
            {room.rules.enabledPowers.map((p, i) => (
              <div key={i} className="waiting-card">
                {p}
              </div>
            ))}
          </div>

          <div className="waiting-modal__actions">
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
              Aceptar
            </button>
          </div>

        </div>
      </div>
    )}
    </div>
    );
}
