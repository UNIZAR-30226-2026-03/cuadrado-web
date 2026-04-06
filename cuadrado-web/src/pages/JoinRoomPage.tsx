// pages/JoinRoomPage.tsx - Buscar y unirse a salas (/join-room)
//
// Sección superior: lista de salas públicas obtenida del backend via
//   room.service::listPublicRooms, con botón "Unirse" por fila.
// Sección inferior: campo de código de 7 dígitos para salas privadas.
// Ambas acciones llaman a room.service::joinRoom y navegan a /waiting-room.

import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../components/GameHeader';
import { useNavigate } from 'react-router-dom';
import { listPublicRooms, joinRoom } from '../services/room.service';
import type { PublicRoomSummary } from '../types/room.types';
import '../styles/RoomPages.css';

export default function JoinRoomPage() {
  const navigate = useNavigate();

  // ── Salas públicas ────────────────────────────────────────────────────
  const [rooms,       setRooms]       = useState<PublicRoomSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError,   setListError]   = useState<string | null>(null);
  const [joiningId,   setJoiningId]   = useState<string | null>(null);

  // ── Sala privada ──────────────────────────────────────────────────────
  const [privateCode,    setPrivateCode]    = useState('');
  const [joiningPrivate, setJoiningPrivate] = useState(false);
  const [privateError,   setPrivateError]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Carga inicial de salas públicas ───────────────────────────────────
  const fetchRooms = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await listPublicRooms();
      setRooms(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Error al cargar las salas');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── Unirse a sala pública ─────────────────────────────────────────────
  const handleJoinPublic = useCallback(async (roomCode: string) => {
    setJoiningId(roomCode);
    try {
      await joinRoom(roomCode);
      navigate('/waiting-room');
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Error al unirse a la sala');
      setJoiningId(null);
    }
  }, [navigate]);

  // ── Unirse a sala privada ─────────────────────────────────────────────
  const handleJoinPrivate = useCallback(async () => {
    if (privateCode.length !== 7) return;
    setJoiningPrivate(true);
    setPrivateError(null);
    try {
      await joinRoom(privateCode);
      navigate('/waiting-room');
    } catch (err) {
      setPrivateError(err instanceof Error ? err.message : 'Código incorrecto o sala no encontrada');
    } finally {
      setJoiningPrivate(false);
    }
  }, [privateCode, navigate]);

  // Solo permite dígitos, máximo 7
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 7);
    setPrivateCode(val);
    setPrivateError(null);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="skin-page">
      <GameHeader title="Buscar Partida" onBack={() => navigate('/home')} />

      <main className="skin-page__content room-page__content">
        {/* ── Salas Públicas ─────────────────────────────────────────── */}
        <section className="room-section">
          <p className="room-section__title">Salas Públicas</p>

          <div className="skin-page__panel room-panel room-panel--list">
            {loadingList && (
              <div className="skin-page__loading">Cargando salas…</div>
            )}

            {!loadingList && listError && (
              <div className="skin-page__error" role="alert">
                {listError}
                <button
                  onClick={fetchRooms}
                  className="room-retry"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loadingList && !listError && rooms.length === 0 && (
              <div className="skin-empty">
                <p>No hay salas públicas disponibles.</p>
              </div>
            )}

            {!loadingList && rooms.length > 0 && (
              <div className="room-list">
                {rooms.map((room) => (
                  <div
                    key={room.code}
                    className="room-row"
                  >
                    {/* Nombre de sala */}
                    <span className="room-row__name">
                      Sala de {room.name}
                    </span>

                    {/* Jugadores */}
                    <span className="room-row__players">
                      {room.playersCount}/{room.rules.maxPlayers}
                      <svg viewBox="0 0 20 20" className="room-row__icon" aria-hidden="true">
                        <circle cx="10" cy="6" r="4" fill="currentColor" />
                        <path d="M2 18c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                      </svg>
                    </span>

                    {/* Reglas activas */}
                    <span className="room-row__rules">
                      Reglas: {room.rules.enabledPowers.join(', ') || '—'}
                    </span>

                    {/* Botón unirse */}
                    <button
                      disabled={joiningId === room.code}
                      onClick={() => handleJoinPublic(room.code)}
                      className="room-row__join"
                    >
                      {joiningId === room.code ? '…' : 'Unirse'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Salas Privadas ─────────────────────────────────────────── */}
        <section className="room-section">
          <p className="room-section__title">Salas Privadas</p>

          <div className="skin-page__panel room-panel">
            <div className="room-private">
              <div className="room-private__field">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={7}
                  value={privateCode}
                  onChange={handleCodeChange}
                  placeholder="_ _ _ _ _ _ _"
                  aria-label="Código de sala privada (7 dígitos)"
                  className="room-private__input"
                />
                <button
                  disabled={privateCode.length !== 7 || joiningPrivate}
                  onClick={handleJoinPrivate}
                  className="room-private__submit"
                >
                  {joiningPrivate ? '…' : 'Unirse'}
                </button>
              </div>

              {privateError && (
                <div className="skin-page__error" role="alert">{privateError}</div>
              )}
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="room-footer">
          <button
            className="room-link-btn"
            onClick={() => navigate('/rules')}
          >
            Cómo jugar
          </button>
        </div>
      </main>
    </div>
  );
}
