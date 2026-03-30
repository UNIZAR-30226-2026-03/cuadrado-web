// main.tsx - Punto de entrada de la aplicacion React

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode activa comprobaciones extra en desarrollo (renders dobles, APIs obsoletas).
// El "!" indica a TypeScript que #root siempre existe en index.html.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
