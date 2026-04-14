// pages/ForgotPasswordPage.tsx - Solicitud de recuperacion de contrasena (ruta "/forgot-password")
//
// Valida el email localmente y llama al backend para enviar el codigo.
// Si tiene exito, navega a /verify-code pasando el email por state.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordRequest } from '../services/auth.service';
import ErrorModal from '../components/modals/ErrorModal';
import { useAuthForm } from '../hooks/useAuthForm';
import { useAuthEntrance } from '../hooks/useAuthEntrance';
import '../styles/auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail]         = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading]     = useState(false);

  const { apiError, showNetworkError, dismissNetworkError, withSubmit } = useAuthForm();
  const containerRef = useAuthEntrance();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');

    if (!email) {
      setEmailError('El correo electronico es obligatorio');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Introduce un correo electronico valido');
      return;
    }

    setLoading(true);
    await withSubmit(async () => {
      await forgotPasswordRequest({ email });
      // Pasamos el email por state para no exponerlo en la URL
      navigate('/verify-code', { state: { email } });
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

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {apiError && <p className="auth-message--error">{apiError}</p>}

          <div className="auth-field">
            <label className="auth-field-label">Correo electronico</label>
            <input
              className={`neon-input${emailError ? ' neon-input--error' : ''}`}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              autoComplete="email"
            />
            {emailError && <span className="auth-field__error">{emailError}</span>}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar correo de recuperacion'}
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
