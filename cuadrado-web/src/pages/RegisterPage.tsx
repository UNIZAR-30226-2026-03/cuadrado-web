// ─────────────────────────────────────────────────────────
// pages/RegisterPage.tsx — Página de registro (ruta "/register")
//
// Formulario de registro con validaciones locales:
//   1. Campos obligatorios (todos)
//   2. Longitud mínima de contraseña (8 caracteres)
//   3. Confirmación de contraseña (ambas deben coincidir)
//
// Tras un registro exitoso, redirige a /login.
// Mantiene la estructura de formulario web con estilos desktop.
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirm) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
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
      <Link to="/" className="auth-back">Volver</Link>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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

          {/* Campo: correo electrónico */}
          <div className="auth-field">
            <label className="auth-field-label">Correo electrónico</label>
            <input
              className="neon-input"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Campo: contraseña */}
          <div className="auth-field">
            <label className="auth-field-label">Contraseña</label>
            <input
              className="neon-input"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {/* Campo: confirmar contraseña */}
          <div className="auth-field">
            <label className="auth-field-label">Confirmar contraseña</label>
            <input
              className="neon-input"
              type="password"
              placeholder="Repetir contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
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
