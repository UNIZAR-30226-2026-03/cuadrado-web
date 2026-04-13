// pages/CreateRoomPage.tsx - Menú para crear salas
//
// Paso 1: selector de barajas (1 baraja / 2 barajas / reanudar) con iconos neón.
// Paso 2: configuración de sala — maxPlayers, turnTime, visibilidad + poderes de cartas.
//   Llama a room.service::createRoom y navega a /waiting-room.

// pages/CreateRoomPage.tsx - Menú para crear salas
//
// Paso 1: selector de barajas animado con GSAP stagger.
// Paso 2: configuración de sala con entrada animada.

import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import GameHeader from '../components/GameHeader';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { createRoom, leaveRoom } from '../services/room.service';
import { useAuth } from '../context/AuthContext';
import type { CreateRoomPayload } from '../types/room.types';
import '../styles/RoomPages.css';
import '../styles/CreateRoomExtras.css';

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

type DeckCount = 1 | 2;

interface CardPower {
  value: string;
  label: string;
  description: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Datos — descripciones completas de poderes
// ---------------------------------------------------------------------------

const INITIAL_POWERS: CardPower[] = [
  {
    value: 'A', label: 'A',
    description: 'Intercambia TODAS tus cartas por TODAS las cartas de otro jugador.',
    enabled: true,
  },
  {
    value: '2', label: '2',
    description: 'Elige un jugador para que robe una carta extra y la añada a su mano.',
    enabled: true,
  },
  {
    value: '3', label: '3',
    description: 'Protege una de tus cartas: esa carta no puede ser intercambiada por nadie hasta el final.',
    enabled: true,
  },
  {
    value: '4', label: '4',
    description: 'Salta el siguiente turno de un jugador a tu elección.',
    enabled: true,
  },
  {
    value: '5', label: '5',
    description: 'Elige una carta de cada jugador de la partida para verla en secreto.',
    enabled: true,
  },
  {
    value: '6', label: '6',
    description: 'Roba otra carta del mazo para tener una segunda oportunidad de intercambiar o descartar.',
    enabled: true,
  },
  {
    value: '7', label: '7',
    description: '(Guardable) Revela quién tiene la mano con menos puntos. Puedes activarlo en cualquier momento.',
    enabled: true,
  },
  {
    value: '8', label: '8',
    description: '(Guardable) Anula la siguiente habilidad que se active en la partida. Puedes activarlo en cualquier momento.',
    enabled: true,
  },
  {
    value: '9', label: '9',
    description: 'Propones un intercambio ciego a otro jugador: ambos elegís una carta para dar sin saber qué recibiréis.',
    enabled: true,
  },
  {
    value: '10', label: '10',
    description: 'Puedes ver una de tus propias cartas durante 5 segundos para refrescar la memoria.',
    enabled: true,
  },
  {
    value: 'J', label: 'J',
    description: 'Ve una de tus cartas y una de otro jugador. Decide si quieres intercambiarlas o no.',
    enabled: true,
  },
];

const TURN_TIME_OPTIONS = [15, 20, 30, 45, 60] as const;

/** Etiquetas descriptivas para cada opción de tiempo de turno */
const TURN_TIME_LABELS: Record<number, string> = {
  15: 'Relámpago',
  20: 'Rápido',
  30: 'Estándar',
  45: 'Calmado',
  60: 'Estratégico',
};

// ---------------------------------------------------------------------------
// Iconos SVG — estilo Neon Casino (colores neón, sin blanco/negro)
// ---------------------------------------------------------------------------

function IconOneDeck() {
  return (
    <svg viewBox="0 0 64 80" style={{ width: 58, height: 58 }} aria-hidden="true">
      <defs>
        <linearGradient id="deckGrad1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--neon-purple)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="12" y="8" width="40" height="64" rx="8" ry="8"
        fill="rgba(17,40,88,0.7)"
        stroke="url(#deckGrad1)"
        strokeWidth="2.5" />
      {/* Símbolo de carta */}
      <text x="32" y="47" textAnchor="middle" fontSize="20" fill="var(--neon-cyan)" fontFamily="Georgia, serif" opacity="0.85">♠</text>
    </svg>
  );
}

function IconTwoDecks() {
  return (
    <svg viewBox="0 0 90 80" style={{ width: 68, height: 58 }} aria-hidden="true">
      <defs>
        <linearGradient id="deckGrad2a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon-purple)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="deckGrad2b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--neon-purple)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="4" y="16" width="40" height="56" rx="7" ry="7"
        fill="rgba(17,40,88,0.6)"
        stroke="url(#deckGrad2a)"
        strokeWidth="2.5"
        transform="rotate(-12 24 44)" />
      <rect x="28" y="8" width="40" height="56" rx="7" ry="7"
        fill="rgba(17,40,88,0.85)"
        stroke="url(#deckGrad2b)"
        strokeWidth="2.5"
        transform="rotate(8 48 36)" />
      <text x="54" y="42" textAnchor="middle" fontSize="18" fill="var(--neon-cyan)" fontFamily="Georgia, serif" opacity="0.9" transform="rotate(8 54 42)">♠</text>
    </svg>
  );
}

// Icono de reanudar: círculo con flecha en sentido horario que apunta a la derecha
function IconResume() {
  return (
    <svg viewBox="0 0 80 80" style={{ width: 58, height: 58 }} aria-hidden="true">
      <defs>
        <linearGradient id="resumeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon-gold)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Arco circular en sentido horario, desde arriba y termina a la derecha */}
      <path
        d="M40 12 A28 28 0 1 1 12 40"
        fill="none"
        stroke="url(#resumeGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Flecha que apunta hacia abajo-izquierda (continuando el sentido horario) */}
      <polygon
        points="12,40 4,26 20,28"
        fill="var(--neon-gold)"
        opacity="0.9"
      />
      {/* Botón play centrado */}
      <polygon
        points="32,28 32,52 56,40"
        fill="var(--neon-gold)"
        opacity="0.85"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Subcomponente — Stepper numérico (maxPlayers)
// ---------------------------------------------------------------------------

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}

function Stepper({ value, min, max, onChange, label }: StepperProps) {
  return (
    <div className="room-stepper">
      <span className="room-stepper__label">{label}</span>
      <div className="room-stepper__control">
        <button
          className="room-stepper__btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Reducir"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="10" x2="16" y2="10" />
          </svg>
        </button>
        <span className="room-stepper__value">{value}</span>
        <button
          className="room-stepper__btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Aumentar"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="4" x2="10" y2="16" />
            <line x1="4" y1="10" x2="16" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function CreateRoomPage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const step1Ref   = useRef<HTMLDivElement>(null);
  const step2Ref   = useRef<HTMLDivElement>(null);

  const [deckCount,    setDeckCount]    = useState<DeckCount | null>(null);
  const [isPublic,     setIsPublic]     = useState(true);
  const [maxPlayers,   setMaxPlayers]   = useState(4);
  const [turnTime,     setTurnTime]     = useState<30 | 15 | 20 | 45 | 60>(30);
  const [powers,       setPowers]       = useState<CardPower[]>(INITIAL_POWERS);
  const [creating,     setCreating]     = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const allEnabled  = powers.every(p => p.enabled);
  const someEnabled = powers.some(p => p.enabled);

  // Animación de entrada al paso 1: stagger en las opciones de baraja
  useLayoutEffect(() => {
    if (deckCount !== null || !step1Ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.room-option', {
        y: 32,
        autoAlpha: 0,
        scale: 0.88,
        duration: 0.5,
        ease: 'back.out(1.5)',
        stagger: 0.08,
        clearProps: 'all',
      });
    }, step1Ref);
    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animación de entrada al paso 2
  useLayoutEffect(() => {
    if (deckCount === null || !step2Ref.current) return;
    gsap.from(step2Ref.current, {
      y: 24, autoAlpha: 0, duration: 0.45, ease: 'power2.out', clearProps: 'all',
    });
  }, [deckCount]);

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
      name: user?.username || 'Nueva sala',
      rules: {
        maxPlayers,
        turnTimeSeconds: turnTime,
        isPrivate: !isPublic,
        fillWithBots: false,
        deckCount,
        enabledPowers: powers.filter(p => p.enabled).map(p => p.value),
      },
    };

    try {
      await leaveRoom();
      await createRoom(payload);
      navigate('/waiting-room');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la partida');
    } finally {
      setCreating(false);
    }
  }, [deckCount, isPublic, maxPlayers, turnTime, powers, navigate]);

  // ---------------------------------------------------------------------------
  // Paso 1 — selector de barajas
  // ---------------------------------------------------------------------------

  if (deckCount === null) {
    return (
      <div className="skin-page">
        <GameHeader title="Crear Partida" onBack={() => navigate(-1)} />

        <main className="skin-page__content room-page__content">
          <div className="skin-page__panel room-panel room-panel--center" ref={step1Ref}>
            <div className="room-option-grid">
              {([
                {
                  key: '1', label: '1 Baraja', sublabel: 'Partida estándar',
                  Icon: IconOneDeck, onClick: () => setDeckCount(1),
                },
                {
                  key: '2', label: '2 Barajas', sublabel: 'Más cartas, más caos',
                  Icon: IconTwoDecks, onClick: () => setDeckCount(2),
                },
                {
                  key: 'r', label: 'Reanudar', sublabel: 'Última partida',
                  Icon: IconResume, onClick: () => navigate('/game'),
                },
              ] as const).map(({ key, label, sublabel, Icon, onClick }) => (
                <button key={key} className="room-option" onClick={onClick}>
                  <Icon />
                  <span className="room-option__label">{label}</span>
                  <span className="room-option__sublabel">{sublabel}</span>
                </button>
              ))}
            </div>

            <button className="room-link-btn" onClick={() => navigate('/home')}>
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

      <main className="skin-page__content room-page__content skin-page__content--room-config">
        <div className="skin-page__panel room-panel room-panel--stack" ref={step2Ref}>

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

          {/* Selectores numéricos */}
          <div className="room-settings-row">
            <Stepper
              label="Jugadores máximos"
              value={maxPlayers}
              min={2}
              max={8}
              onChange={setMaxPlayers}
            />
          </div>

          {/* Selector de tiempo de turno */}
          <div className="room-turntime">
            <span className="room-powers__title">Tiempo de turno</span>
            <div className="room-turntime__cards">
              {TURN_TIME_OPTIONS.map(t => (
                <button
                  key={t}
                  className={`room-turntime__card${turnTime === t ? ' is-active' : ''}`}
                  onClick={() => setTurnTime(t)}
                >
                  <ClockIcon />
                  <span className="room-turntime__card-time">{t}s</span>
                  <span className="room-turntime__card-label">{TURN_TIME_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Título poderes */}
          <p className="room-powers__title">Poderes de las cartas</p>

          {/* Panel scrollable de poderes */}
          <div className="room-powers__list">
            {/* Fila "seleccionar todos" */}
            <div
              className="room-power-row room-power-row--header"
              onClick={toggleAll}
            >
              <span
                role="checkbox"
                aria-checked={allEnabled ? true : someEnabled ? 'mixed' : false}
                tabIndex={0}
                onKeyDown={e => e.key === ' ' && toggleAll()}
                className="room-checkbox"
              >
                {allEnabled && <CheckIcon />}
                {!allEnabled && someEnabled && <DashIcon />}
              </span>
              <svg viewBox="0 0 56 44" style={{ width: 34, height: 26, flexShrink: 0 }} aria-hidden="true">
                <rect x="2"  y="10" width="22" height="30" rx="4" fill="rgba(17,40,88,0.7)" stroke="rgba(0,229,255,0.5)" strokeWidth="1.8" transform="rotate(-10 13 25)" />
                <rect x="18" y="6"  width="22" height="30" rx="4" fill="rgba(17,40,88,0.8)" stroke="rgba(0,229,255,0.7)" strokeWidth="1.8" transform="rotate(5 29 21)" />
                <rect x="32" y="2"  width="22" height="30" rx="4" fill="rgba(17,40,88,0.9)" stroke="rgba(0,229,255,0.9)" strokeWidth="1.8" transform="rotate(18 43 17)" />
              </svg>
              <span className="room-power__text" style={{ fontWeight: 600, color: 'var(--text-80)' }}>
                Seleccionar todos los poderes
              </span>
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
                  {power.enabled && <CheckIcon />}
                </span>
                <span className="room-card-badge">{power.label}</span>
                <span className="room-power__text">{power.description}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="skin-page__error" role="alert">{error}</div>
          )}

          {/* Footer */}
          <div className="room-footer room-footer--spread">
            <button className="room-link-btn" onClick={() => navigate('/rules')}>
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

// ---------------------------------------------------------------------------
// SVG inline helpers
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 13, height: 13 }} aria-hidden="true">
      <polyline points="3,10 8,16 17,4" fill="none" stroke="var(--neon-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 13, height: 13 }} aria-hidden="true">
      <line x1="4" y1="10" x2="16" y2="10" stroke="var(--neon-cyan)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Icono de reloj analógico para las tarjetas de tiempo de turno */
function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
      {/* Esfera */}
      <circle cx="10" cy="10" r="8" stroke="var(--neon-cyan)" strokeWidth="1.5" />
      {/* Manecilla de minutos (apunta hacia arriba) */}
      <line x1="10" y1="10" x2="10" y2="4"  stroke="var(--neon-cyan)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Manecilla de horas (apunta a las 3) */}
      <line x1="10" y1="10" x2="14" y2="10" stroke="var(--neon-cyan)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Centro */}
      <circle cx="10" cy="10" r="1" fill="var(--neon-cyan)" />
    </svg>
  );
}
