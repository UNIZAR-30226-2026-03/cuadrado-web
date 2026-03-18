// ─────────────────────────────────────────────────────────
// pages/ForgotPasswordPage.tsx — Recuperación de contraseña (ruta "/forgot-password")
//
// Permite solicitar un correo de recuperación introduciendo
// la dirección de email. No modifica el estado de
// autenticación global, llama directamente al servicio.
//
// Muestra dos tipos de feedback:
//   - success: mensaje verde si el correo se envió
//   - error: mensaje rosa/rojo si hubo un problema
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../services/auth.service';
import ErrorModal from '../components/ErrorModal';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('El correo electrónico es obligatorio');
      return;
    }

    try {
      setLoading(true);
      await forgotPasswordRequest({ email });
      setSuccess('Se ha enviado un correo de recuperación. Revisa tu bandeja de entrada.');
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
      <Link to="/login" className="auth-back">Volver</Link>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-message--error">{error}</p>}
          {success && <p className="auth-message--success">{success}</p>}

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

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
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
