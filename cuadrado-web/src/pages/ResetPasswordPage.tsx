// pages/ResetPasswordPage.tsx - Restablecer contrasena (ruta "/reset-password")
//
// Paso final del flujo de recuperacion. Recibe email y authCode por location.state
// (desde VerifyCodePage). Si accede directamente sin el state, redirige al inicio del flujo.

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPasswordRequest } from '../services/auth.service';
import ErrorModal from '../components/ErrorModal';
import { useAuthForm, useFieldErrors } from '../hooks/useAuthForm';
import '../styles/auth.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { email, authCode } = (location.state as { email?: string; authCode?: string }) || {};

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);

  const { apiError, showNetworkError, dismissNetworkError, withSubmit } = useAuthForm();
  const { fieldErrors, setFieldErrors, clearFieldError }               = useFieldErrors();

  useEffect(() => {
    if (!email || !authCode) navigate('/forgot-password', { replace: true });
  }, [email, authCode, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!password) {
      errors.password = 'Campo obligatorio';
    } else if (password.length < 8) {
      errors.password = 'Minimo 8 caracteres';
    }
    if (!confirm) {
      errors.confirm = 'Campo obligatorio';
    } else if (password && confirm !== password) {
      errors.confirm = 'Las contrasenias no coinciden';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    await withSubmit(async () => {
      await resetPasswordRequest({ email: email!, authCode: authCode!, newPassword: password });
      navigate('/login', { state: { resetSuccess: true } });
    });
    setLoading(false);
  }

  if (!email || !authCode) return null;

  return (
    <div className="page">
      <Link to="/forgot-password" className="auth-back">Volver</Link>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {apiError && <p className="auth-message--error">{apiError}</p>}

          <div className="auth-field">
            <label className="auth-field-label">Nueva contrasena</label>
            <input
              className={`neon-input${fieldErrors.password ? ' neon-input--error' : ''}`}
              type="password"
              placeholder="Minimo 8 caracteres"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              autoComplete="new-password"
            />
            {fieldErrors.password && <span className="auth-field__error">{fieldErrors.password}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-field-label">Confirmar contrasena</label>
            <input
              className={`neon-input${fieldErrors.confirm ? ' neon-input--error' : ''}`}
              type="password"
              placeholder="Repetir contrasena"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); clearFieldError('confirm'); }}
              autoComplete="new-password"
            />
            {fieldErrors.confirm && <span className="auth-field__error">{fieldErrors.confirm}</span>}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Restablecer contrasena'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Volver a Iniciar Sesion</Link>
        </div>
      </div>

      {showNetworkError && <ErrorModal onClose={dismissNetworkError} />}
    </div>
  );
}
