// pages/CreateRoomPage.tsx - Menú para crear salas
//
// Paso 1: selector de barajas (1 baraja / 2 barajas / reanudar).
// Paso 2: configuración de sala — visibilidad + poderes de cartas.
//   Llama a room.service::createRoom y navega a /waiting-room.

import { useState, useCallback } from 'react';
import GameHeader from '../components/GameHeader';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/room.service';
import type { CreateRoomPayload } from '../types/room.types';
import '../styles/RoomPages.css';

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

type DeckCount = 1 | 2;

interface CardPower {
  value: string;
  label: string;
  description: string; // TODO: rellena la descripción de cada carta
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Datos — rellena las descripciones donde indica el comentario TODO
// ---------------------------------------------------------------------------

const INITIAL_POWERS: CardPower[] = [
  { value: 'A',  label: 'A',  description: /* TODO */ 'Descripción del poder del As',   enabled: true },
  { value: '2',  label: '2',  description: /* TODO */ 'Descripción del poder del 2',    enabled: true },
  { value: '3',  label: '3',  description: /* TODO */ 'Descripción del poder del 3',    enabled: true },
  { value: '4',  label: '4',  description: /* TODO */ 'Descripción del poder del 4',    enabled: true },
  { value: '5',  label: '5',  description: /* TODO */ 'Descripción del poder del 5',    enabled: true },
  { value: '6',  label: '6',  description: /* TODO */ 'Descripción del poder del 6',    enabled: true },
  { value: '7',  label: '7',  description: /* TODO */ 'Descripción del poder del 7',    enabled: true },
  { value: '8',  label: '8',  description: /* TODO */ 'Descripción del poder del 8',    enabled: true },
  { value: '9',  label: '9',  description: /* TODO */ 'Descripción del poder del 9',    enabled: true },
  { value: '10', label: '10', description: /* TODO */ 'Descripción del poder del 10',   enabled: true },
  { value: 'J',  label: 'J',  description: /* TODO */ 'Descripción del poder de la J',  enabled: true },
];

// ---------------------------------------------------------------------------
// Iconos SVG inline
// ---------------------------------------------------------------------------

function IconOneDeck() {
  return (
    <svg viewBox="0 0 64 80" style={{ width: 64, height: 64 }} aria-hidden="true">
      <rect x="12" y="8" width="40" height="64" rx="7" ry="7"
        fill="white" stroke="black" strokeWidth="3.5" />
    </svg>
  );
}

function IconTwoDecks() {
  return (
    <svg viewBox="0 0 80 80" style={{ width: 64, height: 64 }} aria-hidden="true">
      <rect x="4"  y="16" width="40" height="56" rx="7" ry="7"
        fill="white" stroke="black" strokeWidth="3.5" transform="rotate(-12 24 44)" />
      <rect x="22" y="10" width="40" height="56" rx="7" ry="7"
        fill="white" stroke="black" strokeWidth="3.5" transform="rotate(8 42 38)" />
    </svg>
  );
}

function IconResume() {
  return (
    <svg viewBox="0 0 80 80" style={{ width: 64, height: 64 }} aria-hidden="true">
      <circle cx="40" cy="40" r="32" fill="white" stroke="black" strokeWidth="3.5" />
      <path d="M40 14 A26 26 0 1 1 16 52" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" />
      <polygon points="40,6 32,18 48,18" fill="black" />
      <polygon points="33,28 33,52 56,40" fill="black" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function CreateRoomPage() {
  const navigate = useNavigate();

  const [deckCount, setDeckCount] = useState<DeckCount | null>(null);
  const [isPublic,  setIsPublic]  = useState(true);
  const [powers,    setPowers]    = useState<CardPower[]>(INITIAL_POWERS);
  const [creating,  setCreating]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const allEnabled  = powers.every(p => p.enabled);
  const someEnabled = powers.some(p => p.enabled);

  const toggleAll = useCallback(() => {
    const next = !allEnabled;
    setPowers(prev => prev.map(p => ({ ...p, enabled: next })));
  }, [allEnabled]);

  const togglePower = useCallback((value: string, enabled: boolean) => {
    setPowers(prev => prev.map(p => p.value === value ? { ...p, enabled } : p));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!deckCount) return;

    setCreating(true);
    setError(null);

    const payload: CreateRoomPayload = {
      name: 'Nueva sala', // 🔥 obligatorio según backend
      rules: {
        maxPlayers: 4,
        turnTimeSeconds: 30,
        isPrivate: !isPublic,
        fillWithBots: false,

        deckCount,
        enabledPowers: powers.filter(p => p.enabled).map(p => p.value),
      },
    };

    try {
      await createRoom(payload);
      navigate('/waiting-room');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la partida');
    } finally {
      setCreating(false);
    }
  }, [deckCount, isPublic, powers, navigate]);

  // ---------------------------------------------------------------------------
  // Paso 1 — selector de barajas
  // ---------------------------------------------------------------------------

  if (deckCount === null) {
    return (
      <div className="skin-page">
        <GameHeader title="Crear Partida" onBack={() => navigate('/home')} />

        <main className="skin-page__content room-page__content">
          <div className="skin-page__panel room-panel room-panel--center">
            <div className="room-option-grid">
              {([
                { key: '1', label: '1 Baraja',   Icon: IconOneDeck,   onClick: () => setDeckCount(1) },
                { key: '2', label: '2 Barajas',  Icon: IconTwoDecks,  onClick: () => setDeckCount(2) },
                { key: 'r', label: 'Reanudar\núltima partida', Icon: IconResume, onClick: () => navigate('/game') },
              ] as const).map(({ key, label, Icon, onClick }) => (
                <button
                  key={key}
                  className="room-option"
                  onClick={onClick}
                >
                  <Icon />
                  <span className="room-option__label">{label}</span>
                </button>
              ))}
            </div>

            <button
              className="room-link-btn"
              onClick={() => navigate('/home')}
            >
              Cancelar
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Paso 2 — configuración de partida
  // ---------------------------------------------------------------------------

  return (
    <div className="skin-page">
      <GameHeader title="Configuración de Partida" onBack={() => setDeckCount(null)} />

      <main className="skin-page__content room-page__content">
        <div className="skin-page__panel room-panel room-panel--stack">
          {/* Toggle sala pública / privada */}
          <div className="room-toggle">
            <span className={`room-toggle__label${isPublic ? ' is-active' : ''}`}>
              Sala Pública
            </span>

            <button
              role="switch"
              aria-checked={!isPublic}
              aria-label="Cambiar visibilidad de sala"
              onClick={() => setIsPublic(p => !p)}
              className={`room-toggle__switch${!isPublic ? ' is-private' : ''}`}
            >
              <span className="room-toggle__thumb" />
            </button>

            <span className={`room-toggle__label${!isPublic ? ' is-active' : ''}`}>
              Sala Privada
            </span>
          </div>

          {/* Título poderes */}
          <p className="room-powers__title">Selecciona poderes de las cartas</p>

          {/* Panel scrollable */}
          <div className="room-powers__list">
            {/* Fila "seleccionar todos" */}
            <div
              className="room-power-row room-power-row--header"
              onClick={toggleAll}
            >
              {/* Checkbox indeterminado / marcado */}
              <span
                role="checkbox"
                aria-checked={allEnabled ? true : someEnabled ? 'mixed' : false}
                tabIndex={0}
                onKeyDown={e => e.key === ' ' && toggleAll()}
                className="room-checkbox"
              >
                {allEnabled && (
                  <svg viewBox="0 0 20 20" style={{ width: 14, height: 14 }} aria-hidden="true">
                    <polyline points="3,10 8,16 17,4" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {!allEnabled && someEnabled && (
                  <svg viewBox="0 0 20 20" style={{ width: 14, height: 14 }} aria-hidden="true">
                    <line x1="4" y1="10" x2="16" y2="10" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )}
              </span>

              {/* Icono mazo */}
              <svg viewBox="0 0 56 44" style={{ width: 36, height: 28, flexShrink: 0 }} aria-hidden="true">
                <rect x="2"  y="10" width="22" height="30" rx="4" fill="white" stroke="black" strokeWidth="2" transform="rotate(-10 13 25)" />
                <rect x="18" y="6"  width="22" height="30" rx="4" fill="white" stroke="black" strokeWidth="2" transform="rotate(5 29 21)" />
                <rect x="32" y="2"  width="22" height="30" rx="4" fill="white" stroke="black" strokeWidth="2" transform="rotate(18 43 17)" />
              </svg>

              <span className="room-power__text">Seleccionar todos los poderes</span>
            </div>

            {/* Filas de cartas */}
            {powers.map((power) => (
              <div
                key={power.value}
                className="room-power-row"
                onClick={() => togglePower(power.value, !power.enabled)}
              >
                <span
                  role="checkbox"
                  aria-checked={power.enabled}
                  tabIndex={0}
                  onKeyDown={e => e.key === ' ' && togglePower(power.value, !power.enabled)}
                  className="room-checkbox"
                >
                  {power.enabled && (
                    <svg viewBox="0 0 20 20" style={{ width: 14, height: 14 }} aria-hidden="true">
                      <polyline points="3,10 8,16 17,4" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                {/* Badge carta */}
                <span className="room-card-badge">
                  {power.label}
                </span>

                <span className="room-power__text">{power.description}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="skin-page__error" role="alert">{error}</div>
          )}

          {/* Footer */}
          <div className="room-footer room-footer--spread">
            <button
              className="room-link-btn"
              onClick={() => navigate('/rules')}
            >
              Cómo jugar
            </button>

            <button
              disabled={creating}
              className="room-cta"
              onClick={handleCreate}
            >
              {creating ? 'Creando…' : 'Crear Partida'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
