// pages/Join-RoomPage.tsx - Menú para unirse a salas ya existentes

import GameHeader from '../components/GameHeader';
import { useNavigate, useLocation } from 'react-router-dom';

export default function JoinRoomPage() {
    const navigate   = useNavigate();
    const location   = useLocation();
    return (
    <div>
        <GameHeader title="Buscar Partida" onBack={() => navigate('/home')} />
    </div>
    )
}