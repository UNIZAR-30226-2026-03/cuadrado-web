// pages/WaitingRoomPage.tsx - Sala de Espera
import GameHeader from '../components/GameHeader';
import { useNavigate, useLocation } from 'react-router-dom';

export default function WaitingRoomPage() {
    const navigate   = useNavigate();
    const location   = useLocation();
    return (
    <div>
        <GameHeader title="Sala de espera" onBack={() => navigate('/home')} />
    </div>
    )
}