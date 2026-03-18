// ─────────────────────────────────────────────────────────
// pages/LoginPage.tsx — Página de inicio de sesión (ruta "/login")
//
// Formulario de login con validación local antes de llamar
// al backend. Diferencia dos tipos de error:
//   - Error de red (fetch falla): muestra el modal ErrorModal
//   - Error de API (credenciales incorrectas): mensaje inline
//
// Usa la estructura de formulario de la versión web con los
// estilos visuales de la versión desktop (glassmorphism,
// animaciones escalonadas, botones neón).
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorModal from '../components/ErrorModal';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Todos los campos son obligatorios');
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
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Link de volver a la pantalla de bienvenida */}
      <Link to="/" className="auth-back">Volver</Link>

      {/* Tarjeta de autenticación con glassmorphism */}
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Mensaje de error inline */}
          {error && <p className="auth-message--error">{error}</p>}

          {/* Campo: nombre de usuario */}
          <div className="auth-field">
            <label className="auth-field-label">Usuario</label>
            <input
              className="neon-input"
              type="text"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          {/* Campo: contraseña */}
          <div className="auth-field">
            <label className="auth-field-label">Contraseña</label>
            <input
              className="neon-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Links de navegación secundarios */}
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
