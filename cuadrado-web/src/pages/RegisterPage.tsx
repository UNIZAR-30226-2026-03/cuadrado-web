// pages/RegisterPage.tsx - Registro de nuevo usuario (ruta "/register")
//
// Validacion: username obligatorio, email valido, password >= 8 chars, confirm coincide.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorModal from '../components/ErrorModal';
import { useAuthForm, useFieldErrors } from '../hooks/useAuthForm';
import { useAuthEntrance } from '../hooks/useAuthEntrance';
import '../styles/auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);

  const { apiError, showNetworkError, dismissNetworkError, withSubmit } = useAuthForm();
  const { fieldErrors, setFieldErrors, clearFieldError }               = useFieldErrors();
  const containerRef = useAuthEntrance();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!username) errors.username = 'Campo obligatorio';
    if (!email) {
      errors.email = 'Campo obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Introduce un correo electronico valido';
    }
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
      await register({ username, email, password });
      navigate('/login');
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
            <label className="auth-field-label">Correo electronico</label>
            <input
              className={`neon-input${fieldErrors.email ? ' neon-input--error' : ''}`}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
              autoComplete="email"
            />
            {fieldErrors.email && <span className="auth-field__error">{fieldErrors.email}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-field-label">Contrasena</label>
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
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">¿Ya tienes cuenta? Inicia sesion</Link>
        </div>
      </div>

      {showNetworkError && <ErrorModal onClose={dismissNetworkError} />}
    </div>
  );
}
