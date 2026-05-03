// components/settings/SettingsContent.tsx - Contenido reutilizable de configuración para página y popup.

import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useVoice } from '../../context/VoiceContext';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../context/AuthContext';
import {
  getMySettingsRequest,
  updateMySettingsRequest,
} from '../../services/user.service';
import { getAccessToken } from '../../utils/token';
import '../../styles/SettingsPage.css';

interface SettingsContentProps {
  onClose: () => void;
  inModal?: boolean;
  context?: 'lobby' | 'waiting-room' | 'in-game';
  gameId?: string;
  isHost?: boolean;
  onSaveAndClose?: () => void;
  onCloseWithoutSave?: () => void;
  onLeaveGame?: () => void;
  onLeaveRoom?: () => void;
}

function loadPref<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function savePref<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new Event('app:audio-settings-changed'));
}

function ajustarPorcentaje(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

interface SliderRowProps {
  icon: ReactNode;
  iconVariant?: 'default' | 'gold' | 'purple';
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function SliderRow({ icon, iconVariant = 'default', label, value, onChange }: SliderRowProps) {
  return (
    <div className="settings-row">
      <span className={`settings-row__icon settings-row__icon--${iconVariant}`}>{icon}</span>
      <div className="settings-row__body">
        <span className="settings-row__label">{label}</span>
      </div>
      <div className="settings-row__control">
        <div className="settings-slider">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="settings-slider__track"
            aria-label={label}
          />
          <span className="settings-slider__value">{value}%</span>
        </div>
      </div>
    </div>
  );
}

interface PasswordFormProps {
  open: boolean;
  onClose: () => void;
}

function PasswordForm({ open, onClose }: PasswordFormProps) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = useCallback(async () => {
    if (next !== confirm) {
      setFeedback({ type: 'error', msg: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (next.length < 8) {
      setFeedback({ type: 'error', msg: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setFeedback({ type: 'success', msg: 'Contraseña actualizada correctamente.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Error al cambiar la contraseña.',
      });
    } finally {
      setLoading(false);
    }
  }, [changePassword, confirm, current, next]);

  return (
    <div className={`settings-password-form${open ? ' is-open' : ''}`}>
      <div className="settings-password-form__inner">
        <div className="settings-password-fields">
          <div className="settings-field">
            <label className="settings-field__label">Contraseña actual</label>
            <input
              type="password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className="settings-field__input"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <div className="settings-field">
            <label className="settings-field__label">Nueva contraseña</label>
            <input
              type="password"
              value={next}
              onChange={e => setNext(e.target.value)}
              className="settings-field__input"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="settings-field">
            <label className="settings-field__label">Confirmar contraseña nueva</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="settings-field__input"
              autoComplete="new-password"
              placeholder="Repite la nueva contraseña"
            />
          </div>

          {feedback && (
            <p className={`settings-feedback settings-feedback--${feedback.type}`}>{feedback.msg}</p>
          )}

          <div className="settings-password-actions">
            <button className="settings-cancel-btn" onClick={onClose}>Cancelar</button>
            <button
              className="settings-submit-btn"
              onClick={handleSubmit}
              disabled={loading || !current || !next || !confirm}
            >
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InGameSection({
  isHost,
  onSaveAndClose,
  onCloseWithoutSave,
  onLeaveGame,
}: {
  isHost: boolean;
  onSaveAndClose: () => void;
  onCloseWithoutSave: () => void;
  onLeaveGame: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="settings-section">
      <h2 className="settings-section__title">Partida</h2>
      <div className="settings-panel">
        {isHost ? (
          <>
            <div className="settings-row">
              <span className="settings-row__icon settings-row__icon--red">💾</span>
              <div className="settings-row__body">
                <span className="settings-row__label">Cerrar partida</span>
                <span className="settings-row__sublabel">Podrás reanudarla más tarde</span>
              </div>
              <div className="settings-row__control">
                <button
                  className="settings-action-btn settings-action-btn--danger"
                  onClick={() => setConfirmOpen(true)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {confirmOpen && (
              <div className="save-confirm-modal">
                <p className="save-confirm-modal__title">¿Qué quieres hacer con la partida?</p>
                <p className="save-confirm-modal__subtitle">
                  Elige si quieres conservar el progreso actual o cerrar la sala sin guardar.
                </p>
                <div className="save-confirm-modal__actions">
                  <button className="save-confirm-modal__button save-confirm-modal__button--primary" onClick={onSaveAndClose}>
                    Guardar y cerrar
                  </button>
                  <button className="save-confirm-modal__button save-confirm-modal__button--danger" onClick={onCloseWithoutSave}>
                    Cerrar sin guardar
                  </button>
                  <button className="save-confirm-modal__button save-confirm-modal__button--ghost" onClick={() => setConfirmOpen(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="settings-row">
            <span className="settings-row__icon settings-row__icon--red">🚪</span>
            <div className="settings-row__body">
              <span className="settings-row__label">Salir de la partida</span>
              <span className="settings-row__sublabel">Serás sustituido por un bot</span>
            </div>
            <div className="settings-row__control">
              <button
                className="settings-action-btn settings-action-btn--danger"
                onClick={onLeaveGame}
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsContent({
  onClose,
  inModal = false,
  context,
  isHost,
  onSaveAndClose,
  onCloseWithoutSave,
  onLeaveGame,
  onLeaveRoom,
}: SettingsContentProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    micPermission,
    audioInputDevices,
    selectedDeviceId,
    requestPermission,
    selectDevice,
    setOutputVolume,
  } = useVoice();

  const [volGeneral, setVolGeneral] = useState(() => loadPref('vol_general', 80));
  const [volMusic, setVolMusic] = useState(() => loadPref('vol_music', 60));
  const [volSfx, setVolSfx] = useState(() => loadPref('vol_sfx', 80));
  const [volVoice, setVolVoice] = useState(() => loadPref('vol_voice', 90));
  const initialGeneralVolumeRef = useRef(volGeneral);
  const settingsLoadedFromApiRef = useRef(false);
  const hasAudioChangesRef = useRef(false);

  const volumesRef = useRef({
    volGeneral,
    volMusic,
    volSfx,
    volVoice,
  });

  const [passOpen, setPassOpen] = useState(false);

  const handleVolGeneralChange = useCallback((value: number) => {
    hasAudioChangesRef.current = true;
    setVolGeneral(value);
  }, []);

  const handleVolMusicChange = useCallback((value: number) => {
    hasAudioChangesRef.current = true;
    setVolMusic(value);
  }, []);

  const handleVolSfxChange = useCallback((value: number) => {
    hasAudioChangesRef.current = true;
    setVolSfx(value);
  }, []);

  const handleVolVoiceChange = useCallback((value: number) => {
    hasAudioChangesRef.current = true;
    setVolVoice(value);
  }, []);

  useEffect(() => {
    savePref('vol_general', volGeneral);
  }, [volGeneral]);

  useEffect(() => {
    savePref('vol_music', volMusic);
  }, [volMusic]);

  useEffect(() => {
    savePref('vol_sfx', volSfx);
  }, [volSfx]);

  useEffect(() => {
    savePref('vol_voice', volVoice);
    setOutputVolume(volVoice);
  }, [volVoice, setOutputVolume]);

  useEffect(() => {
    volumesRef.current = {
      volGeneral,
      volMusic,
      volSfx,
      volVoice,
    };
  }, [volGeneral, volMusic, volSfx, volVoice]);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const settings = await getMySettingsRequest(token);
        if (cancelled) return;

        const currentFactor = ajustarPorcentaje(initialGeneralVolumeRef.current) / 100;
        const factor = currentFactor > 0 ? currentFactor : 1;

        //Al mandarlo se multiplica, para enseñarlo correctamente hay que dividir
        setVolVoice(ajustarPorcentaje(settings.voiceChatVolume / factor));
        setVolMusic(ajustarPorcentaje(settings.gameMusicVolume / factor));
        setVolSfx(ajustarPorcentaje(settings.soundEffectsVolume / factor));
        settingsLoadedFromApiRef.current = true;
      } catch {
        // Si falla, mantenemos las locales como fallback
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      const token = getAccessToken();
      if (!token) return;
      if (!settingsLoadedFromApiRef.current) return;
      if (!hasAudioChangesRef.current) return;

      const {
        volGeneral: currentGeneral,
        volMusic: currentMusic,
        volSfx: currentSfx,
        volVoice: currentVoice,
      } = volumesRef.current;

      const multiplier = ajustarPorcentaje(currentGeneral) / 100;

      void updateMySettingsRequest(token, {
        voiceChatVolume: ajustarPorcentaje(currentVoice * multiplier),
        gameMusicVolume: ajustarPorcentaje(currentMusic * multiplier),
        soundEffectsVolume: ajustarPorcentaje(currentSfx * multiplier),
      }).catch(() => {
        // Evita bloquear el cierre si la persistencia remota falla
      });
    };
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Secciones deslizan desde abajo escalonadas
      tl.from('.settings-section', {
        y: 28,
        autoAlpha: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all',
      });

      // Filas dentro de cada sección: stagger fino con entrada desde la izquierda
      tl.from('.settings-row', {
        x: -12,
        autoAlpha: 0,
        duration: 0.3,
        stagger: 0.04,
        ease: 'power2.out',
        clearProps: 'all',
      }, 0.1);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      className={`settings-container${inModal ? ' settings-container--modal' : ''}`}
      ref={containerRef}
    >
      {(context === 'lobby' || !context) && (
        <div className="settings-section">
          <h2 className="settings-section__title">Cuenta</h2>
          <div className="settings-panel">
            <div className="settings-row">
              <span className="settings-row__icon">
                <LockIcon />
              </span>
              <div className="settings-row__body">
                <span className="settings-row__label">Contraseña</span>
                <span className="settings-row__sublabel">Actualiza tu contraseña de acceso</span>
              </div>
              <div className="settings-row__control">
                <button className="settings-action-btn" onClick={() => setPassOpen(open => !open)}>
                  {passOpen ? 'Cancelar' : 'Cambiar'}
                </button>
              </div>
            </div>

            <PasswordForm open={passOpen} onClose={() => setPassOpen(false)} />

            <div className="settings-row">
              <span className="settings-row__icon settings-row__icon--red">
                <LogoutIcon />
              </span>
              <div className="settings-row__body">
                <span className="settings-row__label">Cerrar sesión</span>
                <span className="settings-row__sublabel">Saldrás de tu cuenta actual</span>
              </div>
              <div className="settings-row__control">
                <button
                  className="settings-action-btn settings-action-btn--danger"
                  onClick={() => {
                    logout();
                    onClose();
                    navigate('/');
                  }}
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {context === 'waiting-room' && (
        <div className="settings-section">
          <h2 className="settings-section__title">Partida</h2>
          <div className="settings-panel">
            <div className="settings-row">
              <span className="settings-row__icon settings-row__icon--red">🚪</span>
              <div className="settings-row__body">
                <span className="settings-row__label">Salir de la sala</span>
                <span className="settings-row__sublabel">
                  {isHost ? 'Se cerrará la sala para todos' : 'Los demás jugadores continuarán en la sala'}
                </span>
              </div>
              <div className="settings-row__control">
                <button
                  className="settings-action-btn settings-action-btn--danger"
                  onClick={() => { onLeaveRoom?.(); onClose(); }}
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {context === 'in-game' && (
        <InGameSection
          isHost={isHost ?? false}
          onSaveAndClose={() => { onSaveAndClose?.(); onClose(); }}
          onCloseWithoutSave={() => { onCloseWithoutSave?.(); onClose(); }}
          onLeaveGame={() => { onLeaveGame?.(); onClose(); }}
        />
      )}

      <div className="settings-section">
        <h2 className="settings-section__title">Audio</h2>
        <div className="settings-panel">
          <SliderRow
            icon={<VolumeIcon />}
            label="Volumen general"
            value={volGeneral}
            onChange={handleVolGeneralChange}
          />
          <SliderRow
            icon={<MusicIcon />}
            iconVariant="purple"
            label="Música"
            value={volMusic}
            onChange={handleVolMusicChange}
          />
          <SliderRow
            icon={<SfxIcon />}
            iconVariant="gold"
            label="Efectos de sonido"
            value={volSfx}
            onChange={handleVolSfxChange}
          />
          <SliderRow icon={<MicIcon />} label="Voz" value={volVoice} onChange={handleVolVoiceChange} />

          {/* ── Dispositivo de micrófono ─────────────────────────── */}
          <div className="settings-row">
            <span className="settings-row__icon"><MicIcon /></span>
            <div className="settings-row__body">
              <span className="settings-row__label">Micrófono</span>
              <span className="settings-row__sublabel">
                {micPermission === 'denied'
                  ? 'Sin acceso al micrófono — revisa los permisos del navegador'
                  : micPermission === 'unknown'
                    ? 'Toca para activar el chat de voz'
                    : audioInputDevices.length === 0
                      ? 'Micrófono por defecto del sistema'
                      : `${audioInputDevices.length} dispositivo(s) detectado(s)`}
              </span>
            </div>
            <div className="settings-row__control">
              {micPermission !== 'granted' ? (
                <button
                  className="settings-action-btn"
                  onClick={() => void requestPermission()}
                >
                  {micPermission === 'denied' ? 'Sin acceso' : 'Activar'}
                </button>
              ) : audioInputDevices.length > 0 ? (
                <select
                  className="settings-select"
                  value={selectedDeviceId}
                  onChange={e => void selectDevice(e.target.value)}
                  aria-label="Seleccionar micrófono"
                >
                  <option value="default">Por defecto</option>
                  {audioInputDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Micrófono ${d.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="settings-row__sublabel">Por defecto</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function SfxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
