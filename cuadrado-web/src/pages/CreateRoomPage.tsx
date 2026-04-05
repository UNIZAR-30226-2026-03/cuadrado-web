// pages/CreateRoomPage.tsx - Menú para crear salas

import GameHeader from '../components/GameHeader';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CreateRoomPage() {
    const navigate   = useNavigate();
    const location   = useLocation();
    return (
    <div>
        <GameHeader title="Crear Partida" onBack={() => navigate('/home')} />
    </div>
    )
}