// PortraitOverlay.tsx - Overlay que pide girar el dispositivo en móvil vertical
// Muestra un pequeño SVG y el texto: "Gira tu dispositivo / Para una mejor experiencia de juego"

import React, { useEffect, useState } from 'react';
import '../../styles/PortraitOverlay.css';

/**
 * Detecta pantallas móviles en orientación vertical y muestra el overlay.
 */
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
      // orientationchange handler no necesita limpieza específica aquí
    };
  }, []);

  return (
    <div className={`portrait-overlay${isPortrait ? ' portrait-overlay--visible' : ''}`}>
      <div className="portrait-overlay__content">
        <div className="portrait-overlay__icon" aria-hidden>
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="6" width="32" height="52" rx="4" ry="4" />
            <circle cx="32" cy="50" r="2.5" />
            <line x1="26" y1="12" x2="38" y2="12" />
            <path d="M52 20 A20 20 0 0 1 44 44" strokeDasharray="4 3" />
            <polyline points="42,38 44,44 50,42" />
          </svg>
        </div>
        <p className="portrait-overlay__title">Gira tu dispositivo</p>
        <p className="portrait-overlay__subtitle">Para una mejor experiencia de juego</p>
      </div>
    </div>
  );
}

export default PortraitOverlay;
