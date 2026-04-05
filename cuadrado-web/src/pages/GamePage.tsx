// pages/GamePage.tsx - Pantalla de juego
import GameHeader from '../components/GameHeader';
import { useNavigate, useLocation } from 'react-router-dom';

export default function GamePage() {
    const navigate   = useNavigate();
    const location   = useLocation();
    return (
    <div>
        <GameHeader title="Juego" onBack={() => navigate('/home')} />
    </div>
    )
}