import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand">Cuadrado</div>
        <h1 className="auth-title">Panel de usuario</h1>
        <p className="auth-subtitle">
          Bienvenido{user?.username ? `, ${user.username}` : ''}.
        </p>

        <div className="dashboard-grid">
          <div className="dashboard-item">
            <span className="dashboard-label">Cubitos</span>
            <strong className="dashboard-value">{user?.cubitos ?? '-'}</strong>
          </div>
          <div className="dashboard-item">
            <span className="dashboard-label">Elo</span>
            <strong className="dashboard-value">{user?.eloRating ?? '-'}</strong>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link className="auth-button auth-button--ghost" to="/change-password">
            Cambiar contraseña
          </Link>
          <button className="auth-button" type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}
