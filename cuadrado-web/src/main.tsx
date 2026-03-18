// ─────────────────────────────────────────────────────────
// main.tsx — Punto de entrada de la aplicación React
//
// Este fichero es el arranque de toda la app. React necesita
// un elemento HTML raíz (<div id="root"> en index.html)
// donde montar el árbol de componentes.
// ─────────────────────────────────────────────────────────

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'   // Estilos globales: variables CSS, reset, fondo
import App from './App.tsx'

// createRoot → API moderna de React 18+ para renderizado concurrente.
// El operador "!" le dice a TypeScript que getElementById nunca devolverá null
// (sabemos que el div#root siempre existe en index.html).
// StrictMode activa comprobaciones extra en desarrollo:
//   - renderizado doble para detectar efectos secundarios impuros
//   - advertencias sobre APIs obsoletas de React
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
