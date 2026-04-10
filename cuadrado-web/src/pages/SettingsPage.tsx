// pages/SettingsPage.tsx - Vista por ruta de configuración reutilizando contenido modular.

import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import SettingsContent from '../components/settings/SettingsContent';

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="skin-page">
      <GameHeader title="Configuración" onBack={() => navigate(-1)} />

      <main className="skin-page__content">
        <SettingsContent onClose={() => navigate('/home')} />
      </main>
    </div>
  );
}
