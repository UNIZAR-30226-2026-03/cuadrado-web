// components/settings/SettingsContent.tsx - Contenido reutilizable de configuración para página y popup.

import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../context/AuthContext';
import '../../styles/SettingsPage.css';

interface SettingsContentProps {
  onClose: () => void;
  inModal?: boolean;
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

export default function SettingsContent({ onClose, inModal = false }: SettingsContentProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const [volGeneral, setVolGeneral] = useState(() => loadPref('vol_general', 80));
  const [volMusic, setVolMusic] = useState(() => loadPref('vol_music', 60));
  const [volSfx, setVolSfx] = useState(() => loadPref('vol_sfx', 80));
  const [volVoice, setVolVoice] = useState(() => loadPref('vol_voice', 90));

  const [passOpen, setPassOpen] = useState(false);

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
  }, [volVoice]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.settings-section', {
        y: 28,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      className={`settings-container${inModal ? ' settings-container--modal' : ''}`}
      ref={containerRef}
    >
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

      <div className="settings-section">
        <h2 className="settings-section__title">Audio</h2>
        <div className="settings-panel">
          <SliderRow icon={<VolumeIcon />} label="Volumen general" value={volGeneral} onChange={setVolGeneral} />
          <SliderRow
            icon={<MusicIcon />}
            iconVariant="purple"
            label="Música"
            value={volMusic}
            onChange={setVolMusic}
          />
          <SliderRow
            icon={<SfxIcon />}
            iconVariant="gold"
            label="Efectos de sonido"
            value={volSfx}
            onChange={setVolSfx}
          />
          <SliderRow icon={<MicIcon />} label="Voz" value={volVoice} onChange={setVolVoice} />
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
