// pages/VerifyCodePage.tsx - Verificacion del codigo de recuperacion (ruta "/verify-code")
//
// Recibe el email por location.state (desde ForgotPasswordPage).
// Si accede directamente sin pasar por el flujo, redirige a /forgot-password.

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyCodeRequest } from '../services/auth.service';
import ErrorModal from '../components/ErrorModal';
import { useAuthForm } from '../hooks/useAuthForm';
import { useAuthEntrance } from '../hooks/useAuthEntrance';
import '../styles/auth.css';

const RECOVERY_CODE_REGEX = /^[a-f0-9]{9}$/i;

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = (location.state as { email?: string })?.email || '';

  const [code, setCode]           = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading]     = useState(false);

  const { apiError, showNetworkError, dismissNetworkError, withSubmit } = useAuthForm();
  const containerRef = useAuthEntrance();

  // Sin email en el state → acceso directo sin seguir el flujo
  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCodeError('');

    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setCodeError('El codigo de verificacion es obligatorio');
      return;
    }
    if (!RECOVERY_CODE_REGEX.test(normalizedCode)) {
      setCodeError('El codigo debe tener 9 caracteres alfanumericos validos');
      return;
    }

    setLoading(true);
    await withSubmit(async () => {
      await verifyCodeRequest({ email, authCode: normalizedCode });
      navigate('/reset-password', { state: { email, authCode: normalizedCode } });
    });
    setLoading(false);
  }

  if (!email) return null;

  return (
    <div className="page" ref={containerRef}>
      <button className="auth-back" onClick={() => navigate(-1)}>Volver</button>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {apiError && <p className="auth-message--error">{apiError}</p>}
          <p className="auth-message--success">
            Hemos enviado un codigo de verificacion a tu correo electronico.
          </p>

          <div className="auth-field">
            <label className="auth-field-label">Codigo de verificacion</label>
            <input
              className={`neon-input${codeError ? ' neon-input--error' : ''}`}
              type="text"
              placeholder="Introduce el codigo de 9 caracteres"
              value={code}
              onChange={(e) => { setCode(e.target.value); setCodeError(''); }}
              maxLength={9}
              autoComplete="one-time-code"
              autoFocus
            />
            {codeError && <span className="auth-field__error">{codeError}</span>}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar codigo'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Reenviar codigo</Link>
          <Link to="/login">Volver a Iniciar Sesion</Link>
        </div>
      </div>

      {showNetworkError && <ErrorModal onClose={dismissNetworkError} />}
    </div>
  );
}
