// ─────────────────────────────────────────────────────────
// pages/ForgotPasswordPage.tsx — Recuperación de contraseña (ruta "/forgot-password")
//
// El error de validación del campo email se muestra bajo el
// propio campo. Los errores del servidor se muestran arriba.
// El mensaje de éxito se muestra arriba del formulario.
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../services/auth.service';
import ErrorModal from '../components/ErrorModal';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(''); // Error específico del campo
  const [apiError, setApiError] = useState('');     // Error del servidor
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setApiError('');
    setSuccess('');

    if (!email) {
      setEmailError('El correo electrónico es obligatorio');
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
      <Link to="/login" className="auth-back">Volver</Link>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Mensajes globales (éxito o error del servidor) */}
          {apiError && <p className="auth-message--error">{apiError}</p>}
          {success && <p className="auth-message--success">{success}</p>}

          {/* Campo: correo electrónico */}
          <div className="auth-field">
            <label className="auth-field-label">Correo electrónico</label>
            <input
              className={`neon-input${emailError ? ' neon-input--error' : ''}`}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              autoComplete="email"
            />
            {emailError && (
              <span className="auth-field__error">{emailError}</span>
            )}
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
