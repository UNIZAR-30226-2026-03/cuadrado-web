// pages/WelcomePage.tsx - Pantalla de bienvenida (ruta "/")
//
// Logo animado + titulo + tagline + botones de acceso.
// Entrada orquestada con GSAP timeline; idle con CSS animations.

import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import '../styles/WelcomePage.css';
import '../styles/auth.css';

export default function WelcomePage() {
  const pageRef = useRef<HTMLDivElement>(null);

  // Timeline de entrada: el CSS maneja el logo (logo-dramatic) y sus
  // animaciones idle (breathe-glow, breathe). GSAP orquesta el resto.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Título: letra-por-letra no es necesario — un reveal suave es suficiente
      tl.from('.welcome-title', {
        y: 18,
        autoAlpha: 0,
        letterSpacing: '0.35em',
        duration: 0.7,
        ease: 'power3.out',
        clearProps: 'all',
      }, 0.65);

    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="page welcome-page" ref={pageRef}>
      {/* Orbe de resplandor cyan/púrpura detrás del logo */}
      <div className="welcome-orb" aria-hidden="true" />

      {/* Logo con entrada dramática (CSS: logo-dramatic + breathe-glow) */}
      <div className="welcome-logo">
        <img src="/Logo.png" alt="Cubo logo" className="logo-hero" />
      </div>

      {/* Título principal (GSAP entrance) */}
      <h1 className="welcome-title">¡Bienvenido a Cubo!</h1>

      {/* Tagline con revelación de texto animada (CSS) */}
      <p className="welcome-tagline">El juego de cartas definitivo</p>

      {/* Botones de acceso con entrada deslizante (CSS) */}
      <div className="welcome-actions">
        <Link to="/login" className="btn-neon welcome-btn">
          Iniciar Sesión
        </Link>
        <Link to="/register" className="btn-ghost welcome-btn">
          Crear Cuenta
        </Link>
      </div>
    </div>
  );
}
