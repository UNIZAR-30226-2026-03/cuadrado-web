// pages/LoginPage.tsx - Inicio de sesion (ruta "/login")
//
// Validacion local por campo + errores de API + modal de error de red.
// El estado resetSuccess llega por location.state desde ResetPasswordPage.

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorModal from '../components/modals/ErrorModal';
import { useAuthForm, useFieldErrors } from '../hooks/useAuthForm';
import { useAuthEntrance } from '../hooks/useAuthEntrance';
import '../styles/auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Mensaje de exito si venimos del flujo de restablecimiento de contrasena
  const resetSuccess = (location.state as { resetSuccess?: boolean })?.resetSuccess;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const { apiError, showNetworkError, dismissNetworkError, withSubmit } = useAuthForm();
  const { fieldErrors, setFieldErrors, clearFieldError }               = useFieldErrors();
  const containerRef = useAuthEntrance();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!username) errors.username = 'Campo obligatorio';
    if (!password) errors.password = 'Campo obligatorio';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    await withSubmit(async () => {
      await login({ username, password });
      navigate('/home');
    });
    setLoading(false);
  }

  return (
    <div className="page" ref={containerRef}>
      <button className="auth-back" onClick={() => navigate(-1)}>Volver</button>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {resetSuccess && (
            <p className="auth-message--success">
              Contrasena restablecida correctamente. Ya puedes iniciar sesion.
            </p>
          )}
          {apiError && <p className="auth-message--error">{apiError}</p>}

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
            {fieldErrors.username && <span className="auth-field__error">{fieldErrors.username}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-field-label">Contrasena</label>
            <input
              className={`neon-input${fieldErrors.password ? ' neon-input--error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              autoComplete="current-password"
            />
            {fieldErrors.password && <span className="auth-field__error">{fieldErrors.password}</span>}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar Sesion'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register">Crear una cuenta</Link>
          <Link to="/forgot-password">¿Olvidaste tu contrasena?</Link>
        </div>
      </div>

      {showNetworkError && <ErrorModal onClose={dismissNetworkError} />}
    </div>
  );
}
