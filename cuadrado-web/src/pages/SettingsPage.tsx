// pages/SettingsPage.tsx - Vista por ruta de configuración reutilizando contenido modular.

import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/game/GameHeader';
import SettingsContent from '../components/settings/SettingsContent';

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="app-page">
      <GameHeader title="Configuración" onBack={() => navigate(-1)} />

      <main className="app-page__content">
        <SettingsContent onClose={() => navigate('/home')} />
      </main>
    </div>
  );
}

