// ─────────────────────────────────────────────────────────
// pages/RegisterPage.tsx — Página de registro (ruta "/register")
//
// Formulario de registro con validaciones locales escalonadas
// antes de llamar al backend:
//   1. Campos obligatorios (todos)
//   2. Longitud mínima de contraseña (8 caracteres)
//   3. Confirmación de contraseña (ambas deben coincidir)
//
// Tras un registro exitoso, redirige a /login para que el
// usuario inicie sesión con sus nuevas credenciales.
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sparkle from '../components/Sparkle';
import ErrorModal from '../components/ErrorModal';

export default function RegisterPage() {
  const { register } = useAuth(); // Función de registro del contexto global
  const navigate = useNavigate();

  // Estado local del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');       // Campo de confirmación de contraseña
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  // ── handleSubmit ────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validación 1: todos los campos son obligatorios
    if (!username || !email || !password || !confirm) {
      setError('Todos los campos son obligatorios');
      return;
    }

    // Validación 2: la contraseña debe tener al menos 8 caracteres
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Validación 3: ambas contraseñas deben coincidir
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await register({ username, email, password });
      // Tras registrarse correctamente, redirige a login para autenticarse
      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setShowNetworkError(true); // Error de red → modal
      } else if (err instanceof Error) {
        setError(err.message); // Error de API → mensaje inline
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="neon-panel auth-panel fade-in">
        <div className="logo-wrapper">
          <img src="/Logo.png" alt="Cubo logo" className="app-logo" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Campo: nombre de usuario */}
          <div className="form-group">
            <label className="form-label">Nombre de usuario</label>
            <input
              className="neon-input"
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          {/* Campo: correo electrónico — type="email" valida el formato automáticamente */}
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="neon-input"
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Campo: contraseña nueva */}
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="neon-input"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password" // Distingue del campo "current-password" en login
            />
          </div>

          {/* Campo: confirmar contraseña — se compara con el campo anterior */}
          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input
              className="neon-input"
              type="password"
              placeholder="Repetir contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {/* Error de validación o de API */}
          {error && <p className="form-error">{error}</p>}

          <button className="neon-btn neon-btn--large" type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: '1rem' }}>
          <Link to="/login">Volver a Iniciar Sesión</Link>
        </p>
      </div>

      <Sparkle />

      {showNetworkError && (
        <ErrorModal onClose={() => setShowNetworkError(false)} />
      )}
    </div>
  );
}
