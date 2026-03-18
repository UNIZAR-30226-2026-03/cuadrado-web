// ─────────────────────────────────────────────────────────
// pages/VerifyCodePage.tsx — Verificación del código de recuperación (ruta "/verify-code")
//
// Pantalla intermedia del flujo de recuperación de contraseña.
// El usuario introduce el código de 9 caracteres que ha recibido
// por email. Al verificarlo correctamente, se navega a la pantalla
// de restablecimiento de contraseña.
//
// El email llega por state de React Router (desde ForgotPasswordPage).
// Si el usuario accede directamente sin pasar por el flujo, se le
// redirige a /forgot-password.
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyCodeRequest } from '../services/auth.service';
import ErrorModal from '../components/ErrorModal';

const RECOVERY_CODE_REGEX = /^[a-f0-9]{9}$/i;

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Recuperamos el email que viene por state desde ForgotPasswordPage
  const email = (location.state as { email?: string })?.email || '';

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(''); // Error específico del campo
  const [apiError, setApiError] = useState('');   // Error del servidor
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  // Si no hay email en el state, el usuario ha accedido directamente
  // a esta ruta sin pasar por el flujo → redirigimos al inicio
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCodeError('');
    setApiError('');

    // Validación local: el código es obligatorio
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setCodeError('El código de verificación es obligatorio');
      return;
    }

    if (!RECOVERY_CODE_REGEX.test(normalizedCode)) {
      setCodeError('El código debe tener 9 caracteres alfanuméricos válidos');
      return;
    }

    try {
      setLoading(true);
      await verifyCodeRequest({ email, authCode: normalizedCode });
      // Código correcto → navegamos a la pantalla de nueva contraseña
      // pasando email y código por state para el endpoint /reset
      navigate('/reset-password', { state: { email, authCode: normalizedCode } });
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

  // No renderizar nada si no hay email (se está redirigiendo)
  if (!email) return null;

  return (
    <div className="page">
      <Link to="/forgot-password" className="auth-back">Volver</Link>

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Logo.png" alt="Cubo logo" className="auth-logo-img" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Error del servidor: se muestra arriba del formulario */}
          {apiError && <p className="auth-message--error">{apiError}</p>}

          {/* Mensaje informativo sobre el código enviado */}
          <p className="auth-message--success">
            Hemos enviado un código de verificación a tu correo electrónico.
          </p>

          {/* Campo: código de verificación */}
          <div className="auth-field">
            <label className="auth-field-label">Código de verificación</label>
            <input
              className={`neon-input${codeError ? ' neon-input--error' : ''}`}
              type="text"
              placeholder="Introduce el código de 9 caracteres"
              value={code}
              onChange={(e) => { setCode(e.target.value); setCodeError(''); }}
              maxLength={9}
              autoComplete="one-time-code"
              autoFocus
            />
            {codeError && (
              <span className="auth-field__error">{codeError}</span>
            )}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Reenviar código</Link>
          <Link to="/login">Volver a Iniciar Sesión</Link>
        </div>
      </div>

      {showNetworkError && (
        <ErrorModal onClose={() => setShowNetworkError(false)} />
      )}
    </div>
  );
}
