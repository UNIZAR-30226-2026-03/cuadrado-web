// pages/HomePage.tsx - Lobby principal del juego (ruta "/home")
//
// Compone: GameHeader (stats), GameTable (mesa decorativa) y GameNavBar (navegacion).
// Incluye cubos 3D efimeros y un overlay de orientacion para moviles verticales.

import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/HomePage.css';
import type { CSSProperties } from 'react';
import GameHeader from '../components/GameHeader';
import GameTable from '../components/GameTable';
import GameNavBar from '../components/GameNavBar';

// --- CubeMesh: cubo 3D CSS puro con 6 caras wireframe ---
function CubeMesh({ size }: { size: number }) {
  const half = size / 2;
  const faces = [
    `rotateY(0deg)   translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(90deg)  translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg)  translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];

  return (
    <div className="spawning-cube__body" style={{ width: size, height: size }}>
      {faces.map((t, i) => (
        <div
          key={i}
          className="spawning-cube__face"
          style={{ width: size, height: size, transform: t }}
        />
      ))}
    </div>
  );
}

// --- SpawnedCube: tipo para los cubos efimeros ---
// React gestiona el pool; CSS controla la animacion (animation-fill-mode: forwards).
interface SpawnedCube {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
}

const MAX_CUBES = 30;

function SpawningCubes() {
  const [cubes, setCubes] = useState<SpawnedCube[]>([]);
  const idRef = useRef(0);

  const spawn = useCallback(() => {
    const cube: SpawnedCube = {
      id: idRef.current++,
      size: 12 + Math.random() * 40,
      x: 1 + Math.random() * 96,
      y: 1 + Math.random() * 96,
      duration: 7000 + Math.random() * 9000,
    };

    setCubes(prev => {
      if (prev.length >= MAX_CUBES) return prev;
      return [...prev, cube];
    });

    // Eliminar al terminar la animación
    setTimeout(() => {
      setCubes(prev => prev.filter(c => c.id !== cube.id));
    }, cube.duration + 100);
  }, []);

  useEffect(() => {
    // Lote inicial más denso y escalonado rápidamente
    for (let i = 0; i < 16; i++) {
      setTimeout(spawn, i * 280);
    }

    // Spawneo continuo con intervalos más cortos para mayor densidad
    let timeoutId: ReturnType<typeof setTimeout>;
    function scheduleNext() {
      const delay = 700 + Math.random() * 1600;
      timeoutId = setTimeout(() => {
        spawn();
        scheduleNext();
      }, delay);
    }
    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [spawn]);

  return (
    <>
      {cubes.map(cube => (
        <div
          key={cube.id}
          className="spawning-cube"
          style={{
            left: `${cube.x}%`,
            top: `${cube.y}%`,
            '--cube-duration': `${cube.duration}ms`,
          } as CSSProperties}
        >
          <CubeMesh size={cube.size} />
        </div>
      ))}
    </>
  );
}

// --- PortraitOverlay: detecta movil vertical y pide girar el dispositivo ---
function PortraitOverlay() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    function check() {
      const smallerDim = Math.min(window.innerWidth, window.innerHeight);
      const isMobileSize = smallerDim < 600;
      const portrait = window.innerHeight > window.innerWidth * 1.15;
      setIsPortrait(isMobileSize && portrait);
    }

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', () => setTimeout(check, 150));

    return () => {
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <div className={`portrait-overlay${isPortrait ? ' portrait-overlay--visible' : ''}`}>
      <div className="portrait-overlay__content">
        {/* Icono SVG de dispositivo girando */}
        <div className="portrait-overlay__icon">
          <svg viewBox="0 0 64 64">
            <rect x="16" y="6" width="32" height="52" rx="4" ry="4" />
            <circle cx="32" cy="50" r="2.5" />
            <line x1="26" y1="12" x2="38" y2="12" />
            {/* Flecha de rotación */}
            <path
              d="M52 20 A20 20 0 0 1 44 44"
              strokeDasharray="4 3"
            />
            <polyline points="42,38 44,44 50,42" />
          </svg>
        </div>
        <p className="portrait-overlay__title">Gira tu dispositivo</p>
        <p className="portrait-overlay__subtitle">
          Para una mejor experiencia de juego
        </p>
      </div>
    </div>
  );
}

// --- HomePage: pagina principal del lobby ---
export default function HomePage() {
  return (
    <div className="lobby">
      {/* Fondo: grid isométrico pulsante + cubos efímeros */}
      <div className="iso-grid" aria-hidden="true" />
      <SpawningCubes />

      {/* Overlay de orientación vertical para móviles */}
      <PortraitOverlay />

      <GameHeader />

      {/* Zona central: mesa de juego decorativa */}
      <main className="lobby__content">
        <GameTable />
      </main>

      {/* Barra de navegación inferior */}
      <GameNavBar />
    </div>
  );
}
