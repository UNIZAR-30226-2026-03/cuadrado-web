// ─────────────────────────────────────────────────────────
// pages/RegisterPage.tsx — Página de registro (ruta "/register")
//
// Validación con errores por campo:
//   - username: obligatorio
//   - email: obligatorio
//   - password: obligatorio, mínimo 8 caracteres
//   - confirm: obligatorio, debe coincidir con password
//
// Los errores se muestran bajo cada campo. Al modificar
// un campo se limpia su error específico.
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorModal from '../components/ErrorModal';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

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

    if (!username) errors.username = 'Campo obligatorio';
    if (!email) {
      errors.email = 'Campo obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Introduce un correo electrónico válido';
    }

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
      await register({ username, email, password });
      navigate('/login');
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

  return (
    <div className="page">
      <Link to="/" className="auth-back">Volver</Link>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {apiError && <p className="auth-message--error">{apiError}</p>}

          {/* Campo: nombre de usuario */}
          <div className="auth-field">
            <label className="auth-field-label">Usuario</label>
            <input
              className={`neon-input${fieldErrors.username ? ' neon-input--error' : ''}`}
              type="text"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearFieldError('username'); }}
              autoComplete="username"
            />
            {fieldErrors.username && (
              <span className="auth-field__error">{fieldErrors.username}</span>
            )}
          </div>

          {/* Campo: correo electrónico */}
          <div className="auth-field">
            <label className="auth-field-label">Correo electrónico</label>
            <input
              className={`neon-input${fieldErrors.email ? ' neon-input--error' : ''}`}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="auth-field__error">{fieldErrors.email}</span>
            )}
          </div>

          {/* Campo: contraseña */}
          <div className="auth-field">
            <label className="auth-field-label">Contraseña</label>
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

          {/* Campo: confirmar contraseña */}
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
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </div>

      {showNetworkError && (
        <ErrorModal onClose={() => setShowNetworkError(false)} />
      )}
    </div>
  );
}
