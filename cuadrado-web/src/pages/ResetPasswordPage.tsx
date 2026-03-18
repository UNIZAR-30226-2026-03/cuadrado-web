// ─────────────────────────────────────────────────────────
// pages/ResetPasswordPage.tsx — Restablecer contraseña (ruta "/reset-password")
//
// Paso final del flujo de recuperación de contraseña.
// El usuario introduce su nueva contraseña (con confirmación)
// y al enviarla se restablece en el backend mediante el código
// de verificación previamente validado.
//
// Recibe email y authCode por state de React Router (desde VerifyCodePage).
// Si el usuario accede directamente sin pasar por el flujo, se le
// redirige a /forgot-password.
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPasswordRequest } from '../services/auth.service';
import ErrorModal from '../components/ErrorModal';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Recuperamos email y authCode que vienen por state desde VerifyCodePage
  const { email, authCode } = (location.state as { email?: string; authCode?: string }) || {};

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // Errores por campo (validación local)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Error general del servidor
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  // Si no hay email o authCode en el state, el usuario ha accedido
  // directamente a esta ruta sin completar los pasos previos
  useEffect(() => {
    if (!email || !authCode) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, authCode, navigate]);

  // Limpia el error de un campo concreto cuando el usuario empieza a escribir
  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');

    // Validación local: cada campo con su mensaje específico
    const errors: Record<string, string> = {};

    if (!password) {
      errors.password = 'Campo obligatorio';
    } else if (password.length < 8) {
      errors.password = 'Mínimo 8 caracteres';
    }

    if (!confirm) {
      errors.confirm = 'Campo obligatorio';
    } else if (password && confirm !== password) {
      errors.confirm = 'Las contraseñas no coinciden';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await resetPasswordRequest({ email: email!, authCode: authCode!, newPassword: password });
      // Contraseña restablecida → volvemos a login con mensaje de éxito
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setShowNetworkError(true);
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  }

  // No renderizar nada si faltan datos (se está redirigiendo)
  if (!email || !authCode) return null;

  return (
    <div className="page">
      <Link to="/forgot-password" className="auth-back">Volver</Link>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Error del servidor: se muestra arriba del formulario */}
          {apiError && <p className="auth-message--error">{apiError}</p>}

          {/* Campo: nueva contraseña */}
          <div className="auth-field">
            <label className="auth-field-label">Nueva contraseña</label>
            <input
              className={`neon-input${fieldErrors.password ? ' neon-input--error' : ''}`}
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <span className="auth-field__error">{fieldErrors.password}</span>
            )}
          </div>

          {/* Campo: confirmar nueva contraseña */}
          <div className="auth-field">
            <label className="auth-field-label">Confirmar contraseña</label>
            <input
              className={`neon-input${fieldErrors.confirm ? ' neon-input--error' : ''}`}
              type="password"
              placeholder="Repetir contraseña"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); clearFieldError('confirm'); }}
              autoComplete="new-password"
            />
            {fieldErrors.confirm && (
              <span className="auth-field__error">{fieldErrors.confirm}</span>
            )}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Volver a Iniciar Sesión</Link>
        </div>
      </div>

      {showNetworkError && (
        <ErrorModal onClose={() => setShowNetworkError(false)} />
      )}
    </div>
  );
}
