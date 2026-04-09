// components/create-room/CreateRoomModalContent.tsx - Flujo modal para crear partida estilo popup.

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { createRoom, leaveRoom } from '../../services/room.service';
import type { CreateRoomPayload } from '../../types/room.types';
import '../../styles/RoomPages.css';
import '../../styles/CreateRoomExtras.css';

type DeckCount = 1 | 2;

interface CardPower {
  value: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface CreateRoomModalContentProps {
  onClose: () => void;
}

const INITIAL_POWERS: CardPower[] = [
  {
    value: 'A',
    label: 'A',
    description: 'Intercambia todas tus cartas por todas las cartas de otro jugador.',
    enabled: true,
  },
  {
    value: '2',
    label: '2',
    description: 'Elige un jugador para que robe una carta extra.',
    enabled: true,
  },
  {
    value: '3',
    label: '3',
    description: 'Protege una carta para que no pueda ser intercambiada.',
    enabled: true,
  },
  {
    value: '4',
    label: '4',
    description: 'Salta el siguiente turno de un jugador.',
    enabled: true,
  },
  {
    value: '5',
    label: '5',
    description: 'Mira una carta de cada jugador en secreto.',
    enabled: true,
  },
  {
    value: '6',
    label: '6',
    description: 'Roba otra carta del mazo.',
    enabled: true,
  },
  {
    value: '7',
    label: '7',
    description: '(Guardable) Revela quién tiene menos puntos.',
    enabled: true,
  },
  {
    value: '8',
    label: '8',
    description: '(Guardable) Anula la siguiente habilidad activa.',
    enabled: true,
  },
  {
    value: '9',
    label: '9',
    description: 'Propones intercambio ciego con otro jugador.',
    enabled: true,
  },
  {
    value: '10',
    label: '10',
    description: 'Mira una de tus cartas durante 5 segundos.',
    enabled: true,
  },
  {
    value: 'J',
    label: 'J',
    description: 'Mira una carta tuya y otra rival; decide intercambio.',
    enabled: true,
  },
];

const TURN_TIME_OPTIONS = [15, 20, 30, 45, 60] as const;

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}

interface DeckIconDefsProps {
  prefix: string;
}

interface CardBackGlyphProps {
  prefix: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderColor: string;
  innerBorderColor: string;
  rotation?: number;
  opacity?: number;
}

function DeckIconDefs({ prefix }: DeckIconDefsProps) {
  return (
    <defs>
      <linearGradient id={`${prefix}-card-base`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0c1a38" />
        <stop offset="50%" stopColor="#081230" />
        <stop offset="100%" stopColor="#060e28" />
      </linearGradient>

      <radialGradient id={`${prefix}-card-glow`} cx="50%" cy="50%" r="65%">
        <stop offset="0%" stopColor="rgba(0, 229, 255, 0.14)" />
        <stop offset="100%" stopColor="rgba(0, 229, 255, 0)" />
      </radialGradient>

      <pattern
        id={`${prefix}-pattern-a`}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0, 229, 255, 0.14)" strokeWidth="1" />
      </pattern>

      <pattern
        id={`${prefix}-pattern-b`}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0, 229, 255, 0.12)" strokeWidth="1" />
      </pattern>

      <filter id={`${prefix}-shadow`} x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="4" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.5" />
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00e5ff" floodOpacity="0.25" />
      </filter>
    </defs>
  );
}

function CardBackGlyph({
  prefix,
  x,
  y,
  width,
  height,
  borderColor,
  innerBorderColor,
  rotation = 0,
  opacity = 1,
}: CardBackGlyphProps) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const inset = 3;

  return (
    <g
      opacity={opacity}
      transform={rotation !== 0 ? `rotate(${rotation} ${cx} ${cy})` : undefined}
      filter={`url(#${prefix}-shadow)`}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="7"
        ry="7"
        fill={`url(#${prefix}-card-base)`}
        stroke={borderColor}
        strokeWidth="1.8"
      />

      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="5"
        ry="5"
        fill={`url(#${prefix}-card-glow)`}
      />

      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="5"
        ry="5"
        fill={`url(#${prefix}-pattern-a)`}
      />

      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="5"
        ry="5"
        fill={`url(#${prefix}-pattern-b)`}
      />

      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="5"
        ry="5"
        fill="none"
        stroke={innerBorderColor}
        strokeWidth="1"
      />

      {/* No mostrar palo en icono: diseño limpio */}
    </g>
  );
}

function IconOneDeck() {
  const prefix = 'modal-one-deck';

  return (
    <svg viewBox="0 0 64 80" style={{ width: 58, height: 58 }} aria-hidden="true">
      <DeckIconDefs prefix={prefix} />

      <CardBackGlyph
        prefix={prefix}
        x={12}
        y={8}
        width={40}
        height={64}
        borderColor="rgba(0, 229, 255, 0.62)"
        innerBorderColor="rgba(0, 229, 255, 0.35)"
      />
    </svg>
  );
}

function IconTwoDecks() {
  const prefix = 'modal-two-decks';

  return (
    <svg viewBox="0 0 90 80" style={{ width: 68, height: 58 }} aria-hidden="true">
      <DeckIconDefs prefix={prefix} />

      <CardBackGlyph
        prefix={prefix}
        x={10}
        y={12}
        width={34}
        height={52}
        borderColor="rgba(196, 131, 255, 0.6)"
        innerBorderColor="rgba(196, 131, 255, 0.36)"
        rotation={-11}
        opacity={0.92}
      />

      <CardBackGlyph
        prefix={prefix}
        x={34}
        y={12}
        width={34}
        height={52}
        borderColor="rgba(0, 229, 255, 0.68)"
        innerBorderColor="rgba(0, 229, 255, 0.38)"
        rotation={8}
      />
    </svg>
  );
}

function IconResume() {
  const cx = 40;
  const cy = 40;
  const r = 27;

  // Extremos del arco en grados (sistema SVG: 0° a la derecha, 90° hacia abajo).
  // Se dibuja arco largo en sentido horario, dejando la apertura en el cuadrante derecho.
  // Ajustados para acortar ligeramente la porción superior del arco.
  // Hacemos la abertura superior un poco mayor (gap más grande) para que el arco
  // en la parte superior resulte más corto visualmente.
  const arcStartDeg = 60;
  const arcEndDeg = 300;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pointOnCircle = (deg: number) => {
    const rad = toRad(deg);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const arcStart = pointOnCircle(arcStartDeg);
  const arcEnd = pointOnCircle(arcEndDeg);

  // Colocamos la flecha un poco adelantada respecto al extremo del arco
  // para que quede dentro del gap.
  const arrowPlacementOffsetDeg = 23; // grados adelante sobre el arco
  const arrowAngleDeg = arcEndDeg + arrowPlacementOffsetDeg;
  const arcEndflecha = pointOnCircle(arrowAngleDeg);

  // Tangente del círculo en el punto donde situamos la flecha.
  const endRad = toRad(arrowAngleDeg);
  const tx = -Math.sin(endRad);
  const ty = Math.cos(endRad);

  // Ajuste de orientación: rotar la dirección +5° hacia abajo (clockwise)
  const angleAdjustDeg = 5;
  const angleAdjustRad = toRad(angleAdjustDeg);
  const rtx = tx * Math.cos(angleAdjustRad) - ty * Math.sin(angleAdjustRad);
  const rty = tx * Math.sin(angleAdjustRad) + ty * Math.cos(angleAdjustRad);

  // Aumentamos ligeramente el tamaño de la flecha (longitud y ancho).
  const arrowLength = 15; // antes 12
  const arrowHalfWidth = 9; // antes 8
  const baseCenter = {
    x: arcEndflecha.x - rtx * arrowLength,
    y: arcEndflecha.y - rty * arrowLength,
  };
  const nx = -rty;
  const ny = rtx;
  const arrowLeft = {
    x: baseCenter.x + nx * arrowHalfWidth,
    y: baseCenter.y + ny * arrowHalfWidth,
  };
  const arrowRight = {
    x: baseCenter.x - nx * arrowHalfWidth,
    y: baseCenter.y - ny * arrowHalfWidth,
  };

  return (
    <svg viewBox="0 0 80 80" style={{ width: 58, height: 58 }} aria-hidden="true">
      <defs>
        <linearGradient id="modalResumeStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#0087f5" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="modalResumePlay" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00f6ff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#00a3ff" stopOpacity="0.95" />
        </linearGradient>

        <filter id="modalResumeGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00e5ff" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Arco circular definido por extremos calculados */}
      <path
        d={`M ${arcStart.x.toFixed(2)} ${arcStart.y.toFixed(2)} A ${r} ${r} 0 1 1 ${arcEnd.x.toFixed(2)} ${arcEnd.y.toFixed(2)}`}
        fill="none"
        stroke="url(#modalResumeStroke)"
        strokeWidth={6.2}
        strokeLinecap="round"
        filter="url(#modalResumeGlow)"
      />

      {/* Flecha posicionada con el punto final del arco y su tangente */}
      <polygon
        points={`${arcEndflecha.x.toFixed(2)},${arcEndflecha.y.toFixed(2)} ${arrowLeft.x.toFixed(2)},${arrowLeft.y.toFixed(2)} ${arrowRight.x.toFixed(2)},${arrowRight.y.toFixed(2)}`}
        fill="url(#modalResumeStroke)"
      />

      {/* Triángulo de play centrado */}
      <polygon points="34,31.5 34,48.5 49,40" fill="rgba(0, 20, 36, 0.9)" />
    </svg>
  );
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
          <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
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
          <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="10" y1="4" x2="10" y2="16" />
            <line x1="4" y1="10" x2="16" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function CreateRoomModalContent({ onClose }: CreateRoomModalContentProps) {
  const navigate = useNavigate();
  const step2Ref = useRef<HTMLDivElement>(null);

  const [deckCount, setDeckCount] = useState<DeckCount | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [turnTime, setTurnTime] = useState<15 | 20 | 30 | 45 | 60>(30);
  const [powers, setPowers] = useState<CardPower[]>(INITIAL_POWERS);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allEnabled = powers.every(power => power.enabled);
  const someEnabled = powers.some(power => power.enabled);

  useLayoutEffect(() => {
    if (deckCount === null || !step2Ref.current) return;

    gsap.from(step2Ref.current, {
      y: 20,
      autoAlpha: 0,
      duration: 0.35,
      ease: 'power2.out',
    });
  }, [deckCount]);

  const toggleAll = useCallback(() => {
    const nextEnabled = !allEnabled;
    setPowers(prev => prev.map(power => ({ ...power, enabled: nextEnabled })));
  }, [allEnabled]);

  const togglePower = useCallback((value: string, enabled: boolean) => {
    setPowers(prev => prev.map(power => (power.value === value ? { ...power, enabled } : power)));
  }, []);

  const handleCreateRoom = useCallback(async () => {
    if (!deckCount) return;

    setCreating(true);
    setError(null);

    const payload: CreateRoomPayload = {
      name: 'Nueva sala',
      rules: {
        maxPlayers,
        turnTimeSeconds: turnTime,
        isPrivate: !isPublic,
        fillWithBots: false,
        deckCount,
        enabledPowers: powers.filter(power => power.enabled).map(power => power.value),
      },
    };

    try {
      await leaveRoom();
      await createRoom(payload);
      onClose();
      navigate('/waiting-room');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la partida');
    } finally {
      setCreating(false);
    }
  }, [deckCount, isPublic, maxPlayers, navigate, onClose, powers, turnTime]);

  if (deckCount === null) {
    return (
      <div className="create-room-embedded">
        <div className="create-room-embedded__header">
          <button className="room-link-btn create-room-embedded__back" onClick={onClose}>
            ← Volver
          </button>
          <h3 className="create-room-embedded__title">Crear partida</h3>
          <div className="create-room-embedded__spacer" aria-hidden="true" />
        </div>

        <div className="create-room-embedded__content room-page__content">
          <div className="room-panel--center create-room-embedded__panel">
            <h4 className="room-powers__title">Selecciona el número de barajas</h4>

            <div className="room-option-grid">
              <button className="room-option" onClick={() => setDeckCount(1)}>
                <IconOneDeck />
                <span className="room-option__label">1 Baraja</span>
                <span className="room-option__sublabel">Partida estándar</span>
              </button>

              <button className="room-option" onClick={() => setDeckCount(2)}>
                <IconTwoDecks />
                <span className="room-option__label">2 Barajas</span>
                <span className="room-option__sublabel">Más cartas, más caos</span>
              </button>

              <button className="room-option room-option--disabled" disabled>
                <IconResume />
                <span className="room-option__label">Reanudar</span>
                <span className="room-option__sublabel">Próximamente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-embedded">
      <div className="create-room-embedded__header">
        <button
          className="room-link-btn create-room-embedded__back"
          onClick={() => setDeckCount(null)}
        >
          ← Volver
        </button>
        <h3 className="create-room-embedded__title">Configuración de partida</h3>
        <div className="create-room-embedded__spacer" aria-hidden="true" />
      </div>

      <div className="create-room-embedded__content room-page__content">
        <div
          className="room-panel--stack create-room-embedded__panel"
          ref={step2Ref}
        >
          <div className="room-toggle">
            <span className={`room-toggle__label${isPublic ? ' is-active' : ''}`}>Sala pública</span>
            <button
              role="switch"
              aria-checked={!isPublic}
              aria-label="Cambiar visibilidad de sala"
              onClick={() => setIsPublic(prev => !prev)}
              className={`room-toggle__switch${!isPublic ? ' is-private' : ''}`}
            >
              <span className="room-toggle__thumb" />
            </button>
            <span className={`room-toggle__label${!isPublic ? ' is-active' : ''}`}>Sala privada</span>
          </div>

          <div className="room-settings-row">
            <Stepper
              label="Jugadores máximos"
              value={maxPlayers}
              min={2}
              max={8}
              onChange={setMaxPlayers}
            />
          </div>

          <div className="room-turntime">
            <span className="room-powers__title">Tiempo de turno</span>
            <div className="room-turntime__pills">
              {TURN_TIME_OPTIONS.map(time => (
                <button
                  key={time}
                  className={`room-turntime__pill${turnTime === time ? ' is-active' : ''}`}
                  onClick={() => setTurnTime(time)}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          <p className="room-powers__title">Poderes de las cartas</p>

          <div className="room-powers__list">
            <div className="room-power-row room-power-row--header" onClick={toggleAll}>
              <span
                role="checkbox"
                aria-checked={allEnabled ? true : someEnabled ? 'mixed' : false}
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key === ' ') {
                    event.preventDefault();
                    toggleAll();
                  }
                }}
                className="room-checkbox"
              >
                {allEnabled && <CheckIcon />}
                {!allEnabled && someEnabled && <DashIcon />}
              </span>

              <span className="room-card-badge">ALL</span>

              <span className="room-power__text" style={{ fontWeight: 600, color: 'var(--text-80)' }}>
                Seleccionar todos los poderes
              </span>
            </div>

            {powers.map(power => (
              <div
                key={power.value}
                className="room-power-row"
                onClick={() => togglePower(power.value, !power.enabled)}
              >
                <span
                  role="checkbox"
                  aria-checked={power.enabled}
                  tabIndex={0}
                  onKeyDown={event => {
                    if (event.key === ' ') {
                      event.preventDefault();
                      togglePower(power.value, !power.enabled);
                    }
                  }}
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

          <div className="room-footer room-footer--spread">
            <button
              className="room-link-btn"
              onClick={() => {
                onClose();
                navigate('/rules');
              }}
            >
              Cómo jugar
            </button>

            <button disabled={creating} className="room-cta" onClick={handleCreateRoom}>
              {creating ? 'Creando…' : 'Crear Partida'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 13, height: 13 }} aria-hidden="true">
      <polyline
        points="3,10 8,16 17,4"
        fill="none"
        stroke="var(--neon-cyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 13, height: 13 }} aria-hidden="true">
      <line
        x1="4"
        y1="10"
        x2="16"
        y2="10"
        stroke="var(--neon-cyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
