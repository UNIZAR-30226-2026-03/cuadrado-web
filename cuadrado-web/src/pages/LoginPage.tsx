// ─────────────────────────────────────────────────────────
// pages/LoginPage.tsx — Página de inicio de sesión (ruta "/login")
//
// Validación con errores por campo:
//   - fieldErrors: errores de validación local bajo cada input
//   - apiError: error del servidor (credenciales incorrectas, etc.)
//   - showNetworkError: modal cuando el backend no es accesible
//
// Al modificar un campo se limpia su error específico.
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorModal from '../components/ErrorModal';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si venimos del flujo de restablecimiento de contraseña, mostramos un mensaje de éxito
  const resetSuccess = (location.state as { resetSuccess?: boolean })?.resetSuccess;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Errores por campo (validación local)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Error general del servidor (no atribuible a un campo concreto)
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

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

    // Validación local: comprobamos cada campo de forma independiente
    const errors: Record<string, string> = {};
    if (!username) errors.username = 'Campo obligatorio';
    if (!password) errors.password = 'Campo obligatorio';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await login({ username, password });
      navigate('/home');
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

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Mensaje de éxito tras restablecer la contraseña */}
          {resetSuccess && (
            <p className="auth-message--success">
              Contraseña restablecida correctamente. Ya puedes iniciar sesión.
            </p>
          )}

          {/* Error del servidor: se muestra arriba del formulario */}
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

          {/* Campo: contraseña */}
          <div className="auth-field">
            <label className="auth-field-label">Contraseña</label>
            <input
              className={`neon-input${fieldErrors.password ? ' neon-input--error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="auth-field__error">{fieldErrors.password}</span>
            )}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register">Crear una cuenta</Link>
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </div>
      </div>

      {showNetworkError && (
        <ErrorModal onClose={() => setShowNetworkError(false)} />
      )}
    </div>
  );
}
