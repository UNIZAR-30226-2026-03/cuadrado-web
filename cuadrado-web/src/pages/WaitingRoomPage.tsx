// pages/WaitingRoomPage.tsx - Sala de Espera
import GameHeader from '../components/GameHeader';
import { useNavigate } from 'react-router-dom';

export default function WaitingRoomPage() {
    const navigate   = useNavigate();
    return (
    <div>
        <GameHeader title="Sala de espera" onBack={() => navigate(-1)} />
    </div>
    )
}