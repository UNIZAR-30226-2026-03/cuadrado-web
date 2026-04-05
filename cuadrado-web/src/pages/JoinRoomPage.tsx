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

  // ── Hover ─────────────────────────────────────────────────────────────
  const [hov, setHov] = useState<string | null>(null);

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

      <main className="skin-page__content" style={{ gap: '1.25rem' }}>

        {/* ── Salas Públicas ─────────────────────────────────────────── */}
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', color: '#111' }}>
          Salas Públicas
        </p>

        <div
          className="skin-page__panel"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}
        >
          {loadingList && (
            <div className="skin-page__loading" style={{ padding: '1.5rem', textAlign: 'center' }}>
              Cargando salas…
            </div>
          )}

          {!loadingList && listError && (
            <div className="skin-page__error" role="alert" style={{ margin: '1rem' }}>
              {listError}
              <button
                onClick={fetchRooms}
                style={{ marginLeft: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', color: 'inherit' }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!loadingList && !listError && rooms.length === 0 && (
            <div className="skin-empty" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p>No hay salas públicas disponibles.</p>
            </div>
          )}

          {!loadingList && rooms.map((room, i) => (
            <div
              key={room.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.875rem',
                borderTop: i === 0 ? 'none' : '1px solid #f0f0f0',
                background: hov === room.code ? '#fffbe6' : 'transparent',
                transition: 'background 0.12s',
                flexWrap: 'wrap',
              }}
              onMouseEnter={() => setHov(room.code)}
              onMouseLeave={() => setHov(null)}
            >
              {/* Nombre de sala */}
              <span style={{ flex: '1 1 140px', fontSize: '0.9rem', fontWeight: 600, color: '#111', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Sala de {room.name}
              </span>

              {/* Jugadores */}
              <span style={{ flexShrink: 0, fontSize: '0.88rem', color: '#444', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {room.playersCount}/{room.rules.maxPlayers}
                {/* Icono persona */}
                <svg viewBox="0 0 20 20" style={{ width: 14, height: 14, marginLeft: 1 }} aria-hidden="true">
                  <circle cx="10" cy="6" r="4" fill="currentColor" />
                  <path d="M2 18c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                </svg>
              </span>

              {/* Reglas activas */}
              <span style={{ flexShrink: 0, fontSize: '0.82rem', color: '#666' }}>
                Reglas: {room.rules.enabledPowers.join(', ') || '—'}
              </span>

              {/* Botón unirse */}
              <button
                disabled={joiningId === room.code}
                onClick={() => handleJoinPublic(room.code)}
                onMouseEnter={() => setHov(`btn-${room.code}`)}
                onMouseLeave={() => setHov(room.code)}
                style={{
                  flexShrink: 0,
                  padding: '0.35rem 1rem',
                  border: '2px solid #f5c518',
                  borderRadius: 999,
                  background: joiningId === room.code ? '#f5c518' : (hov === `btn-${room.code}` ? '#f5c518' : 'transparent'),
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: joiningId === room.code ? 'not-allowed' : 'pointer',
                  opacity: joiningId === room.code ? 0.6 : 1,
                  transition: 'background 0.15s',
                }}
              >
                {joiningId === room.code ? '…' : 'Unirse'}
              </button>
            </div>
          ))}
        </div>

        {/* ── Salas Privadas ─────────────────────────────────────────── */}
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', color: '#111' }}>
          Salas Privadas
        </p>

        {/* Campo de código + botón unirse */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '2px solid #111',
            borderRadius: 999,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
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
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              padding: '0.6rem 1.25rem',
              fontSize: '1rem',
              letterSpacing: '0.18em',
              fontWeight: 600,
              color: '#111',
              background: 'transparent',
              minWidth: 0,
            }}
          />
          <button
            disabled={privateCode.length !== 7 || joiningPrivate}
            onClick={handleJoinPrivate}
            style={{
              flexShrink: 0,
              padding: '0.6rem 1.25rem',
              border: '2px solid #f5c518',
              borderRadius: 999,
              margin: 3,
              background: privateCode.length === 7 && !joiningPrivate ? '#f5c518' : 'transparent',
              fontSize: '0.88rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: privateCode.length !== 7 || joiningPrivate ? 'not-allowed' : 'pointer',
              opacity: privateCode.length !== 7 ? 0.45 : 1,
              transition: 'background 0.15s, opacity 0.15s',
            }}
          >
            {joiningPrivate ? '…' : 'Unirse'}
          </button>
        </div>

        {privateError && (
          <div className="skin-page__error" role="alert">{privateError}</div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            style={{
              padding: '0.55rem 1.5rem',
              border: '2px solid #f5c518',
              borderRadius: 999,
              background: hov === 'rules' ? '#fffbe6' : 'transparent',
              fontSize: '0.88rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={() => setHov('rules')}
            onMouseLeave={() => setHov(null)}
            onClick={() => navigate('/rules')}
          >
            Cómo jugar
          </button>
        </div>

      </main>
    </div>
  );
}
