// pages/RulesPage.tsx - Reglas de juego (/rules)
//
// Panel desplazable con las normas del juego.
// Mismo layout y clases que ShopPage.tsx, sin CSS adicional.

import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';

function RuleCard({ num }: { num: string }) {
  const colorKey = 'black';

  return (
    <div className="game-table__card game-table__card--face-up">
      <span className={`game-table__card-value game-table__card-value--${colorKey}`}>{num}</span>
    </div>
  );
}

export default function RulesPage() {
  const navigate = useNavigate();

  return (
    <div className="skin-page">
      <GameHeader title="Reglas de Cubo" onBack={() => navigate('/home')} />

      <main className="skin-page__content">
        <div className="skin-page__panel">
          {
            /* REGLAS */
            <div className="rules-container">
                <h1>¿Cómo jugar a Cubo?</h1>
                <br />
                <h2>Objetivo del juego:</h2>
                <br />
                <p>El objetivo del “Cuadrado” es tener la menor cantidad de puntos cuando acabe la partida. El valor de cada carta es el siguiente:</p>
                <br />
                <h2>Habilidades:</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                    <RuleCard num={"| 1 |"} />
                    <p>Texto de la primera regla…</p>
                </div>
            </div>
          }
        </div>
      </main>
    </div>
  );
}
