import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../services/auth.service';
import Sparkle from '../components/Sparkle';
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
      <div className="neon-panel auth-panel fade-in">
        <div className="logo-wrapper">
          <img src="/Logo.png" alt="Cubo logo" className="app-logo" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <button className="neon-btn neon-btn--large" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
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
