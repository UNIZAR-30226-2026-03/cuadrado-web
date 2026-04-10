// pages/GamePage.tsx - Pantalla de juego
import GameHeader from '../components/GameHeader';
import { useNavigate } from 'react-router-dom';

export default function GamePage() {
    const navigate   = useNavigate();
    return (
    <div>
        <GameHeader title="Juego" onBack={() => navigate(-1)} />
    </div>
    )
}