// components/room/CreateRoomModalContent.tsx - Flujo modal de dos pasos para crear partida.
//
// Paso 1: selección del número de barajas (1 o 2).
// Paso 2: configuración de sala (visibilidad, jugadores, tiempo de turno, poderes).

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { createRoom, leaveRoom } from '../../services/room.service';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_POWERS } from '../../data/cardPowers';
import { IconOneDeck, IconTwoDecks, IconResume } from '../icons/DeckIcons';
import { ClockIcon, CheckIcon, DashIcon } from '../icons/UiIcons';
import type { CreateRoomPayload } from '../../types/room.types';
import '../../styles/RoomPages.css';
import '../../styles/CreateRoomExtras.css';

type DeckCount = 1 | 2;
type BotDifficulty = 'media' | 'dificil';

/** Estado interno de un poder con su flag de habilitado para esta sesión de creación */
interface RoomPower {
  value: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface CreateRoomModalContentProps {
  onClose: () => void;
}

const TURN_TIME_OPTIONS = [15, 20, 30, 45, 60] as const;

const TURN_TIME_LABELS: Record<number, string> = {
  15: 'Relámpago',
  20: 'Rápido',
  30: 'Estándar',
  45: 'Calmado',
  60: 'Estratégico',
};

// ── Stepper ───────────────────────────────────────────────────────────────────

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

// ── Componente principal ──────────────────────────────────────────────────────

export default function CreateRoomModalContent({ onClose }: CreateRoomModalContentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const step2Ref = useRef<HTMLDivElement>(null);

  const [deckCount, setDeckCount] = useState<DeckCount | null>(null);
  const [roomName, setRoomName] = useState(user?.username ?? '');
  const [isPublic, setIsPublic] = useState(true);
  const [fillWithBots, setFillWithBots] = useState(true);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('media');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [turnTime, setTurnTime] = useState<15 | 20 | 30 | 45 | 60>(30);
  const [powers, setPowers] = useState<RoomPower[]>(DEFAULT_POWERS);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allEnabled  = powers.every(power => power.enabled);
  const someEnabled = powers.some(power => power.enabled);

  // Animación de entrada al pasar al paso 2
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
      name: roomName.trim() || user?.username || 'Nueva sala',
      rules: {
        maxPlayers,
        turnTimeSeconds: turnTime,
        isPrivate: !isPublic,
        fillWithBots,
        dificultadBots: fillWithBots ? botDifficulty : undefined,
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
  }, [botDifficulty, deckCount, fillWithBots, isPublic, maxPlayers, navigate, onClose, powers, roomName, turnTime, user?.username]);

  // ── Paso 1: Selección de barajas ─────────────────────────────────────────

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
              <button
                className="room-option"
                onClick={() => {
                  setDeckCount(1);
                  setMaxPlayers(prev => Math.min(prev, 4)); //Por si cambias a 1 baraja de algun modo
                }}
              >
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

  // ── Paso 2: Configuración de sala ────────────────────────────────────────

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
          {/* ── Nombre de la sala ── */}
          <div className="room-settings-row">
            <label className="room-input__label" htmlFor="room-name-input">Nombre de la sala</label>
            <input
              id="room-name-input"
              className="room-input"
              value={roomName}
              onChange={event => setRoomName(event.target.value)}
              maxLength={40}
              placeholder={user?.username || 'Nueva sala'}
              autoComplete="off"
            />
          </div>

          {/* ── Visibilidad de sala ── */}
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

          {/* ── Completar sala con bots ── */}
          <div className="room-toggle">
            <span className={`room-toggle__label${!fillWithBots ? ' is-active' : ''}`}>Sin bots</span>
            <button
              role="switch"
              aria-checked={fillWithBots}
              aria-label="Cambiar bots automáticos"
              onClick={() => setFillWithBots(prev => !prev)}
              className={`room-toggle__switch${fillWithBots ? ' is-private' : ''}`}
            >
              <span className="room-toggle__thumb" />
            </button>
            <span className={`room-toggle__label${fillWithBots ? ' is-active' : ''}`}>Completar con bots</span>
          </div>

          {fillWithBots && (
            <div className="room-turntime">
              <span className="room-powers__title">Dificultad de bots</span>
              <div className="room-turntime__cards">
                <button
                  className={`room-turntime__card${botDifficulty === 'media' ? ' is-active' : ''}`}
                  onClick={() => setBotDifficulty('media')}
                >
                  <span className="room-turntime__card-time">Media</span>
                  <span className="room-turntime__card-label">Equilibrada</span>
                </button>

                <button
                  className={`room-turntime__card${botDifficulty === 'dificil' ? ' is-active' : ''}`}
                  onClick={() => setBotDifficulty('dificil')}
                >
                  <span className="room-turntime__card-time">Difícil</span>
                  <span className="room-turntime__card-label">Más competitiva</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Número de jugadores ── */}
          <div className="room-settings-row">
            <Stepper
              label="Jugadores máximos"
              value={maxPlayers}
              min={2}
              max={deckCount === 1 ? 4 : 8}
              onChange={setMaxPlayers}
            />
          </div>

          {/* ── Tiempo de turno ── */}
          <div className="room-turntime">
            <span className="room-powers__title">Tiempo de turno</span>
            <div className="room-turntime__cards">
              {TURN_TIME_OPTIONS.map(time => (
                <button
                  key={time}
                  className={`room-turntime__card${turnTime === time ? ' is-active' : ''}`}
                  onClick={() => setTurnTime(time)}
                >
                  <ClockIcon />
                  <span className="room-turntime__card-time">{time}s</span>
                  <span className="room-turntime__card-label">{TURN_TIME_LABELS[time]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Poderes de las cartas ── */}
          <p className="room-powers__title">Poderes de las cartas</p>

          <div className="room-powers__list">
            {/* Fila cabecera: seleccionar/deseleccionar todos */}
            <div className="room-power-row room-power-row--header" onClick={toggleAll}>
              <span
                role="checkbox"
                aria-checked={allEnabled ? true : someEnabled ? 'mixed' : false}
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key === ' ') { event.preventDefault(); toggleAll(); }
                }}
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

            {/* Filas individuales de poder */}
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
                    if (event.key === ' ') { event.preventDefault(); togglePower(power.value, !power.enabled); }
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
            <div className="app-page__error" role="alert">{error}</div>
          )}

          {/* ── Acciones finales ── */}
          <div className="room-footer room-footer--spread">
            <button
              className="room-link-btn"
              onClick={() => { onClose(); navigate('/rules'); }}
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
