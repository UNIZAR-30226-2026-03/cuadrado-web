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

  // ── Estilos inline compartidos ──────────────────────────────────────────

  const optionBtn = (hovered: boolean): React.CSSProperties => ({
    flex: '1 1 160px',
    maxWidth: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '1.5rem 1rem',
    minHeight: 180,
    border: '2.5px solid #f5c518',
    borderRadius: 16,
    background: hovered ? '#fffbe6' : '#fff',
    cursor: 'pointer',
    transform: hovered ? 'translateY(-3px)' : 'none',
    boxShadow: hovered ? '0 6px 18px rgba(0,0,0,0.12)' : 'none',
    transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
  });

  // Botones con hover — necesitamos estado local por botón
  const [hov, setHov] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Paso 1 — selector de barajas
  // ---------------------------------------------------------------------------

  if (deckCount === null) {
    return (
      <div className="skin-page">
        <GameHeader title="Crear Partida" onBack={() => navigate('/home')} />

        <main className="skin-page__content">
          <div className="skin-page__panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2rem 1.5rem 1.5rem' }}>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>

              {([
                { key: '1', label: '1 Baraja',   Icon: IconOneDeck,   onClick: () => setDeckCount(1) },
                { key: '2', label: '2 Barajas',  Icon: IconTwoDecks,  onClick: () => setDeckCount(2) },
                { key: 'r', label: 'Reanudar\núltima partida', Icon: IconResume, onClick: () => navigate('/game') },
              ] as const).map(({ key, label, Icon, onClick }) => (
                <button
                  key={key}
                  style={optionBtn(hov === key)}
                  onMouseEnter={() => setHov(key)}
                  onMouseLeave={() => setHov(null)}
                  onClick={onClick}
                >
                  <Icon />
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.3, color: '#111', whiteSpace: 'pre-line' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <button
              style={{ padding: '0.55rem 2.5rem', border: '2px solid #f5c518', borderRadius: 999, background: hov === 'cancel' ? '#fffbe6' : 'transparent', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={() => setHov('cancel')}
              onMouseLeave={() => setHov(null)}
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

      <main className="skin-page__content">
        <div className="skin-page__panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>

          {/* Toggle sala pública / privada */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.875rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: isPublic ? '#111' : '#999', transition: 'color 0.2s' }}>
              Sala Pública
            </span>

            <button
              role="switch"
              aria-checked={!isPublic}
              aria-label="Cambiar visibilidad de sala"
              onClick={() => setIsPublic(p => !p)}
              style={{ position: 'relative', width: 48, height: 26, borderRadius: 999, border: `2px solid ${isPublic ? '#ccc' : '#f5c518'}`, background: isPublic ? '#ddd' : '#f5c518', cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background 0.2s, border-color 0.2s' }}
            >
              <span style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: '50%', background: isPublic ? '#888' : '#fff', transition: 'transform 0.2s, background 0.2s', transform: isPublic ? 'translateX(0)' : 'translateX(22px)', display: 'block' }} />
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: !isPublic ? '#111' : '#999', transition: 'color 0.2s' }}>
              Sala Privada
            </span>
          </div>

          {/* Título poderes */}
          <p style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', margin: 0, color: '#111' }}>
            Selecciona poderes de las cartas
          </p>

          {/* Panel scrollable */}
          <div
            className="skin-page__panel"
            style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}
          >
            {/* Fila "seleccionar todos" */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', cursor: 'pointer', background: '#fafafa', borderBottom: '1.5px solid #e5e5e5' }}
              onClick={toggleAll}
            >
              {/* Checkbox indeterminado / marcado */}
              <span
                role="checkbox"
                aria-checked={allEnabled ? true : someEnabled ? 'mixed' : false}
                tabIndex={0}
                onKeyDown={e => e.key === ' ' && toggleAll()}
                style={{ flexShrink: 0, width: 22, height: 22, border: '2.5px solid #f5c518', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', outline: 'none', cursor: 'pointer' }}
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

              <span style={{ fontSize: '0.88rem', color: '#444', lineHeight: 1.4 }}>Seleccionar todos los poderes</span>
            </div>

            {/* Filas de cartas */}
            {powers.map((power, i) => (
              <div
                key={power.value}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', cursor: 'pointer', borderTop: i === 0 ? 'none' : '1px solid #f0f0f0', transition: 'background 0.12s' }}
                onClick={() => togglePower(power.value, !power.enabled)}
                onMouseEnter={e => (e.currentTarget.style.background = '#fffbe6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  role="checkbox"
                  aria-checked={power.enabled}
                  tabIndex={0}
                  onKeyDown={e => e.key === ' ' && togglePower(power.value, !power.enabled)}
                  style={{ flexShrink: 0, width: 22, height: 22, border: '2.5px solid #f5c518', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', outline: 'none', cursor: 'pointer' }}
                >
                  {power.enabled && (
                    <svg viewBox="0 0 20 20" style={{ width: 14, height: 14 }} aria-hidden="true">
                      <polyline points="3,10 8,16 17,4" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                {/* Badge carta */}
                <span style={{ flexShrink: 0, minWidth: 32, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111', borderRadius: 6, fontSize: '0.9rem', fontWeight: 800, background: '#fff', padding: '0 5px' }}>
                  {power.label}
                </span>

                <span style={{ fontSize: '0.88rem', color: '#444', lineHeight: 1.4 }}>{power.description}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="skin-page__error" role="alert">{error}</div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <button
              style={{ padding: '0.55rem 1.5rem', border: '2px solid #f5c518', borderRadius: 999, background: hov === 'rules' ? '#fffbe6' : 'transparent', fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={() => setHov('rules')}
              onMouseLeave={() => setHov(null)}
              onClick={() => navigate('/rules')}
            >
              Cómo jugar
            </button>

            <button
              disabled={creating}
              style={{ padding: '0.6rem 2rem', border: '2.5px solid #f5c518', borderRadius: 999, background: '#f5c518', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.5 : 1, transition: 'opacity 0.15s, transform 0.15s' }}
              onMouseEnter={e => { if (!creating) e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = creating ? '0.5' : '1'; }}
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
