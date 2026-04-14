// pages/RulesPage.tsx - Página de reglas completa del juego Cubo
//
// Contiene las 8 secciones con todo el contenido: objetivo, valores de cartas,
// mecánica de turno, habilidades, descarte rápido, penalizaciones, CUBO y puntuación.
// Animaciones de entrada con GSAP + ScrollTrigger.

import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GameHeader from '../components/game/GameHeader';
import '../styles/RulesPage.css';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Datos — valores de las cartas
// ---------------------------------------------------------------------------

interface CardValueEntry {
  display: string;   // Texto en la carta visual
  label: string;     // Etiqueta bajo la carta
  points: string;    // Puntos mostrados
  color: 'black' | 'red' | 'joker' | 'gold';
  variant?: 'special' | 'danger';
  suit?: string;     // Palo decorativo
}

const CARD_VALUES: CardValueEntry[] = [
  { display: '🃏', label: 'Joker',   points: '-1', color: 'joker', variant: 'special' },
  { display: 'A',  label: 'As',      points: '1',  color: 'black', suit: '♠' },
  { display: '2',  label: '2 – 10',  points: 'Su nº', color: 'black', suit: '♣' },
  { display: 'J',  label: 'Jota',    points: '11', color: 'black', suit: '♠' },
  { display: 'Q',  label: 'Reina',   points: '12', color: 'red',   suit: '♥' },
  { display: 'K',  label: 'Rey rojo',points: '0',  color: 'red',   variant: 'special', suit: '♥' },
  { display: 'K',  label: 'Rey negro',points: '20', color: 'black',  variant: 'danger', suit: '♠' },
];

// ---------------------------------------------------------------------------
// Datos — habilidades
// ---------------------------------------------------------------------------

interface AbilityEntry {
  value: string;
  name: string;
  description: string;
  color: 'default' | 'gold' | 'purple';
  badgeColor: 'default' | 'red' | 'gold';
  storable?: boolean; // Almacenable (7, 8)
}

const ABILITIES: AbilityEntry[] = [
  {
    value: 'A', name: 'Gran Intercambio',
    description: 'Intercambia TODAS tus cartas por TODAS las cartas de otro jugador de tu elección. Un movimiento de alto riesgo y alta recompensa: puede catapultarte al primer puesto o hundirte si el rival tiene buenas cartas.',
    color: 'purple', badgeColor: 'default',
  },
  {
    value: '2', name: 'Carta Extra',
    description: 'Elige a un jugador de la partida. Ese jugador roba una carta extra del mazo y la añade a su mano boca abajo, sin verla. Aumenta la puntuación total del objetivo.',
    color: 'default', badgeColor: 'red',
  },
  {
    value: '3', name: 'Escudo',
    description: 'Elige una de tus cartas para protegerla. Esa carta queda protegida durante el resto de la partida y no puede ser intercambiada por otros jugadores (ni siquiera por el As).',
    color: 'default', badgeColor: 'default',
  },
  {
    value: '4', name: 'Bloqueo de Turno',
    description: 'Elige a un jugador. Ese jugador pierde su próximo turno. Un indicador visual avisará al jugador afectado de que su turno ha sido saltado.',
    color: 'default', badgeColor: 'red',
  },
  {
    value: '5', name: 'Espionaje General',
    description: 'Elige una carta de cada uno de los demás jugadores para verla en secreto. Solo tú ves las cartas seleccionadas. El efecto es temporal: las cartas se muestran durante unos segundos y vuelven a ocultarse.',
    color: 'default', badgeColor: 'default',
  },
  {
    value: '6', name: 'Segunda Oportunidad',
    description: 'Roba otra carta del mazo inmediatamente. Ahora tienes dos cartas robadas: la original y la nueva. Decide cuál intercambiar con tu mano y cuál descartar. Si descartás la segunda carta, se activa su poder.',
    color: 'default', badgeColor: 'red',
  },
  {
    value: '7', name: 'Sensor de Ventaja',
    description: 'Revela a todos los jugadores quién tiene la mano con menos puntos en ese momento. Puede guardarse y activarse en cualquier momento de la partida, incluso durante el turno de otro jugador.',
    color: 'gold', badgeColor: 'gold', storable: true,
  },
  {
    value: '8', name: 'Escudo Mágico',
    description: 'Anula la siguiente habilidad que se active en la partida, sea de quien sea. Puede guardarse y activarse cuando quieras como respuesta a cualquier poder. Si hay dos jugadores con un 8 guardado, prevalece el que lo active antes.',
    color: 'gold', badgeColor: 'gold', storable: true,
  },
  {
    value: '9', name: 'Intercambio Ciego',
    description: 'Propones un intercambio secreto a un jugador. Ambos elegís una de vuestras cartas para dar, pero ninguno sabe qué carta recibirá del otro. Una mezcla de psicología y riesgo calculado.',
    color: 'purple', badgeColor: 'default',
  },
  {
    value: '10', name: 'Autoespionaje',
    description: 'Puedes ver una de tus propias cartas boca arriba durante 5 segundos. Perfecta para refrescar la memoria. Solo tú ves la carta; los demás solo ven que la has mirado.',
    color: 'default', badgeColor: 'red',
  },
  {
    value: 'J', name: 'Intercambio Informado',
    description: 'Elige una de tus cartas y una carta de un oponente. Ambas se revelan solo para ti durante unos segundos. Luego decides si las intercambias o no. Si intercambias, puedes hacerlo con cartas distintas a las vistas, siempre que sean del mismo oponente.',
    color: 'default', badgeColor: 'default',
  },
];

// ---------------------------------------------------------------------------
// Subcomponente — Tarjeta de habilidad expandible
// ---------------------------------------------------------------------------

function AbilityCard({ ability }: { ability: AbilityEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`ability-card ${open ? 'is-open' : ''} ability-card--${ability.color}`}>
      <div className="ability-card__header" onClick={() => setOpen(o => !o)}>
        {/* Badge de carta de juego */}
        <div className={`ability-card__badge ability-card__badge--${ability.badgeColor}`}>
          {ability.value}
        </div>

        <div className="ability-card__name">
          {ability.value} — {ability.name}
        </div>

        {ability.storable && (
          <span className="ability-card__tag ability-card__tag--gold">Guardable</span>
        )}

        {/* Chevron animado con CSS */}
        <svg className="ability-card__chevron" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="5,8 10,13 15,8" />
        </svg>
      </div>

      {/* Cuerpo colapsable — CSS grid-template-rows */}
      <div className="ability-card__body">
        <div className="ability-card__inner">
          <p className="ability-card__desc">{ability.description}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponente — Carta de valor visual
// ---------------------------------------------------------------------------

function CardValueItem({ entry }: { entry: CardValueEntry }) {
  const pointsClass = entry.variant === 'danger'
    ? 'card-value-item__points--danger'
    : entry.variant === 'special'
      ? entry.color === 'joker'
        ? 'card-value-item__points--joker'
        : 'card-value-item__points--special'
      : '';

  return (
    <div className={`card-value-item ${entry.variant ? `card-value-item--${entry.variant}` : ''}`}>
      <div className={`mini-card mini-card--${entry.color}`}>
        {entry.color !== 'joker' && entry.suit && (
          <span className="mini-card__suit">{entry.suit}</span>
        )}
        {entry.display}
        {entry.color !== 'joker' && entry.suit && (
          <span className="mini-card__suit mini-card__suit--bottom">{entry.suit}</span>
        )}
      </div>
      <span className="card-value-item__label">{entry.label}</span>
      <span className={`card-value-item__points ${pointsClass}`}>
        {entry.points}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function RulesPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  // Animaciones de entrada con GSAP y ScrollTrigger
  useLayoutEffect(() => {
    const scroller = contentRef.current;
    if (!scroller) return;

    const ctx = gsap.context(() => {
      // Hero: animación de entrada inmediata
      gsap.from('.rules-hero', {
        y: -28, autoAlpha: 0, duration: 0.9, ease: 'power3.out',
      });

      // Secciones: aparecen al hacer scroll
      ScrollTrigger.batch('[data-animate-section]', {
        onEnter: (elements) => {
          gsap.from(elements, {
            y: 44, autoAlpha: 0, duration: 0.65,
            stagger: 0.08, ease: 'power2.out', clearProps: 'all',
          });
        },
        once: true,
        start: 'top 88%',
        scroller,
      });

      // Tarjetas de valor de cartas: stagger de entrada
      ScrollTrigger.batch('[data-animate-card]', {
        onEnter: (elements) => {
          gsap.from(elements, {
            scale: 0.82, autoAlpha: 0, duration: 0.5,
            stagger: 0.05, ease: 'back.out(1.4)', clearProps: 'all',
          });
        },
        once: true,
        start: 'top 90%',
        scroller,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="app-page">
      <GameHeader title="Reglas de Cubo" onBack={() => navigate(-1)} />

      <main className="app-page__content rules-page-content" ref={contentRef}>
        <div className="rules-container" ref={containerRef}>

          {/* Hero */}
          <div className="rules-hero">
            <h1 className="rules-hero__title">¿Cómo se juega a Cubo?</h1>
            <p className="rules-hero__subtitle">
              Memoriza tus cartas, espía a tus rivales y di CUBO cuando creas que tienes la mano más baja.
            </p>
          </div>

          {/* 1 — Objetivo */}
          <section className="rules-section" data-animate-section>
            <div className="rules-section__header">
              <span className="rules-section__number">1</span>
              <h2 className="rules-section__title">Objetivo</h2>
            </div>
            <div className="rules-section__body">
              <p className="rules-text">
                Gana el jugador que tenga la <strong>puntuación total más baja</strong> al final de la partida. Cada carta en tu mano suma puntos según su valor. Cuanto menos puntos, mejor.
              </p>
              <div className="rules-infobox rules-infobox--gold">
                <span className="rules-infobox__icon">🏆</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">La trampa</span>
                  <span className="rules-infobox__text">
                    Al empezar la partida verás tus cartas solo durante la fase de memorización. Después quedan boca abajo. Tendrás que recordar dónde están tus cartas durante toda la partida.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2 — Valor de las cartas */}
          <section className="rules-section" data-animate-section>
            <div className="rules-section__header">
              <span className="rules-section__number">2</span>
              <h2 className="rules-section__title">Valor de las cartas</h2>
            </div>
            <div className="rules-section__body">
              <p className="rules-text">
                Las cartas numéricas valen su propio número. Las figuras tienen valores especiales. Ojo con el Rey negro: ¡vale 20 puntos!
              </p>
              <div className="card-values-grid">
                {CARD_VALUES.map((entry, i) => (
                  <div key={i} data-animate-card>
                    <CardValueItem entry={entry} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3 — Mecánica de turno */}
          <section className="rules-section" data-animate-section>
            <div className="rules-section__header">
              <span className="rules-section__number">3</span>
              <h2 className="rules-section__title">Cómo funciona el turno</h2>
            </div>
            <div className="rules-section__body">
              <p className="rules-text">
                Cada jugador juega un turno por ronda. Cuando sea tu turno:
              </p>
              <div className="rules-infobox">
                <span className="rules-infobox__icon">1️⃣</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Robar</span>
                  <span className="rules-infobox__text">
                    Robas automáticamente la carta superior del mazo. Solo tú ves su valor; los demás ven el reverso.
                  </span>
                </div>
              </div>
              <div className="rules-infobox">
                <span className="rules-infobox__icon">2️⃣</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Decidir: Intercambiar o Descartar</span>
                  <span className="rules-infobox__text">
                    <strong>Intercambiar:</strong> Elige una carta de tu mano para cambiarla por la carta robada. La carta que sale de tu mano va a la pila de descartes (sin activar su poder).<br />
                    <strong>Descartar:</strong> Envía la carta robada directamente a la pila de descartes. Esto activa el poder de esa carta.
                  </span>
                </div>
              </div>
              <div className="rules-infobox rules-infobox--gold">
                <span className="rules-infobox__icon">⏱️</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Tiempo de turno</span>
                  <span className="rules-infobox__text">
                    Si no actúas antes de que se agote el tiempo, la carta robada se descarta automáticamente sin activar su habilidad.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 4 — Habilidades */}
          <section className="rules-section" data-animate-section>
            <div className="rules-section__header">
              <span className="rules-section__number">4</span>
              <h2 className="rules-section__title">Habilidades de las cartas</h2>
            </div>
            <div className="rules-section__body">
              <p className="rules-text">
                Las habilidades solo se activan al <strong>descartar directamente</strong> la carta robada. Si intercambias una carta con tu mano, su poder no se activa. Pulsa cada carta para ver su efecto.
              </p>
              <div className="abilities-grid">
                {ABILITIES.map(ability => (
                  <AbilityCard key={ability.value} ability={ability} />
                ))}
              </div>
            </div>
          </section>

          {/* 5 — Descarte rápido */}
          <section className="rules-section" data-animate-section>
            <div className="rules-section__header">
              <span className="rules-section__number">5</span>
              <h2 className="rules-section__title">Descarte rápido</h2>
            </div>
            <div className="rules-section__body">
              <p className="rules-text">
                Cuando cualquier carta llega a la pila de descartes, se abre una breve ventana de tiempo. Si recuerdas tener en tu mano una carta del mismo número, puedes descartarla encima en ese instante, aunque no sea tu turno.
              </p>
              <div className="rules-infobox rules-infobox--purple">
                <span className="rules-infobox__icon">⚡</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Solo el primero gana</span>
                  <span className="rules-infobox__text">
                    Si varios jugadores intentan el descarte rápido a la vez, solo tiene éxito el que llegue primero. El servidor decide quién fue más rápido.
                  </span>
                </div>
              </div>
              <div className="rules-infobox rules-infobox--red">
                <span className="rules-infobox__icon">⚠️</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Penalización por error</span>
                  <span className="rules-infobox__text">
                    Si descartas una carta que no coincide con la pila, te la devuelven a la mano y encima robas una carta extra del mazo como castigo. ¡Asegúrate antes de actuar!
                  </span>
                </div>
              </div>
              <p className="rules-text">
                El descarte rápido <strong>no activa habilidades</strong> de ninguna carta. Tampoco hay límite: si tienes dos cartas del mismo número puedes descartar ambas.
              </p>
            </div>
          </section>

          {/* 6 — Penalizaciones */}
          <section className="rules-section" data-animate-section>
            <div className="rules-section__header">
              <span className="rules-section__number">6</span>
              <h2 className="rules-section__title">Penalizaciones</h2>
            </div>
            <div className="rules-section__body">
              <div className="rules-infobox rules-infobox--red">
                <span className="rules-infobox__icon">🚫</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Descarte ilegal</span>
                  <span className="rules-infobox__text">
                    Intentar descartar una carta que no coincide con la pila → la carta vuelve a tu mano + robas una carta extra del mazo sin verla.
                  </span>
                </div>
              </div>
              <div className="rules-infobox rules-infobox--red">
                <span className="rules-infobox__icon">⌛</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Timeout de turno</span>
                  <span className="rules-infobox__text">
                    Si se acaba el tiempo de tu turno sin que actúes, la carta robada se descarta automáticamente sin activar su habilidad.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 7 — CUBO */}
          <section className="rules-section" data-animate-section>
            <div className="rules-section__header">
              <span className="rules-section__number">7</span>
              <h2 className="rules-section__title">CUBO — La última ronda</h2>
            </div>
            <div className="rules-section__body">
              <p className="rules-text">
                En cualquier momento de la partida, cualquier jugador puede pulsar el botón <strong>CUBO</strong>. Esto indica que cree tener la mano con menos puntos.
              </p>
              <div className="rules-infobox rules-infobox--gold">
                <span className="rules-infobox__icon">🎲</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">¿Qué pasa tras el CUBO?</span>
                  <span className="rules-infobox__text">
                    Se juega una vuelta completa más: cada jugador (en orden de turno) juega un turno adicional. Cuando llega de nuevo el turno del jugador que estaba activo cuando se dijo CUBO, la partida termina y se revelan todas las cartas.
                  </span>
                </div>
              </div>
              <div className="rules-infobox">
                <span className="rules-infobox__icon">⚠️</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Cuándo puedes decir CUBO</span>
                  <span className="rules-infobox__text">
                    En cualquier momento una vez completada al menos una ronda completa. No se puede decir CUBO en la primera ronda. Solo un jugador puede decir CUBO por partida.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 8 — Puntuación final */}
          <section className="rules-section" data-animate-section>
            <div className="rules-section__header">
              <span className="rules-section__number">8</span>
              <h2 className="rules-section__title">Puntuación final</h2>
            </div>
            <div className="rules-section__body">
              <p className="rules-text">
                Al acabar la partida se revelan todas las cartas. Se suman los puntos de cada jugador, pero las cartas iguales en la misma mano tienen bonificaciones especiales:
              </p>
              <div className="scoring-grid">
                <div className="scoring-item">
                  <span className="scoring-item__name">Sin grupos</span>
                  <span className="scoring-item__desc">Suma de todas las cartas individuales.</span>
                  <span className="scoring-item__value">= Suma</span>
                </div>
                <div className="scoring-item">
                  <span className="scoring-item__name">Pareja</span>
                  <span className="scoring-item__desc">2 cartas iguales. Solo cuenta una de las dos.</span>
                  <span className="scoring-item__value scoring-item__value--gold">÷ 2</span>
                </div>
                <div className="scoring-item">
                  <span className="scoring-item__name">Trío</span>
                  <span className="scoring-item__desc">3 cartas iguales. Las tres valen 0 puntos.</span>
                  <span className="scoring-item__value scoring-item__value--gold">= 0</span>
                </div>
                <div className="scoring-item">
                  <span className="scoring-item__name">Cuarteto o más</span>
                  <span className="scoring-item__desc">4+ cartas iguales. Bonificación extra.</span>
                  <span className="scoring-item__value scoring-item__value--purple">= -2</span>
                </div>
              </div>
              <div className="rules-infobox">
                <span className="rules-infobox__icon">ℹ️</span>
                <div className="rules-infobox__content">
                  <span className="rules-infobox__title">Los Jokers no agrupan</span>
                  <span className="rules-infobox__text">
                    Los Jokers siempre valen -1 puntos independientemente. No forman parejas, tríos ni cuartetos con otras cartas ni entre ellos.
                  </span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

