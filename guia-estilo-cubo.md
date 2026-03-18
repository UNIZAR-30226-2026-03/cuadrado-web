# Documento de Especificación de Estilo UI/UX: Proyecto "Cubo"

## 1. Concepto Visual General
El diseño de la aplicación "Cubo" se basa en una estética **"Neon Casino"** unificada entre las versiones web y desktop. Se caracteriza por interfaces oscuras que simulan un entorno virtual, con elementos definidos por líneas de luz neón, efectos de glassmorphism y animaciones fluidas. El fondo es un sistema multicapa animado (gradiente mesh, campo de estrellas, viñeta) que aporta profundidad sin distraer del contenido.

---

## 2. Paleta de Colores
La paleta se apoya en el alto contraste entre fondos oscuros profundos y acentos neón luminosos.

* **Fondos (Backgrounds):**
    * `--bg-void`: `#0b1733` — Fondo base más oscuro
    * `--bg-deep`: `#122449` — Fondo intermedio
    * `--bg-surface`: `#193360` — Superficie elevada
* **Glassmorphism:**
    * `--glass`: `rgba(17, 40, 88, 0.60)` — Fondo de paneles translúcidos
    * `--glass-light`: `rgba(26, 55, 110, 0.52)` — Variante más clara
    * `--glass-border`: `rgba(120, 210, 255, 0.22)` — Borde sutil de paneles
    * `--glass-border-lit`: `rgba(0, 229, 255, 0.35)` — Borde iluminado (hover/foco)
* **Acentos Neón:**
    * `--neon-cyan`: `#00e5ff` — Color dominante para bordes, botones y resplandores
    * `--neon-purple`: `#a855f7` — Acento secundario para botones ghost y variaciones
    * `--neon-pink`: `#ec4899` — Errores y validaciones de formulario
    * `--neon-gold`: `#fbbf24` — Elementos premium, recompensas y rangos
* **Colores Semánticos:**
    * `--green`: `#86efac` — Mensajes de éxito y confirmaciones
    * `--red`: `#ff5a5a` — Mensajes de error y acciones destructivas
* **Textos:**
    * `--text-100`: `#ffffff` — Texto principal (nombres, valores, títulos)
    * `--text-80`: `rgba(200, 220, 255, 0.85)` — Texto secundario (subtítulos, descripciones)
    * `--text-50`: `rgba(180, 205, 240, 0.72)` — Texto atenuado (labels, placeholders, taglines)
    * `--text-link`: `#38bdf8` — Color de enlaces

---

## 3. Tipografía
Se utilizan dos familias tipográficas para crear jerarquía visual:

* **Tipografía de Títulos (Display / Headers):**
    * **Fuente:** `Playfair Display`, Georgia, serif
    * **Variable CSS:** `--font-display`
    * **Uso:** Títulos de pantallas, nombres del juego, encabezados de modales
    * **Pesos:** 400 (normal), 700 (bold), 900 (black)
    * **Características:** Fuente serif elegante con personalidad, aporta distinción frente a las sans-serif genéricas

* **Tipografía de Cuerpo (Body Text):**
    * **Fuente:** `Inter`, system-ui, sans-serif
    * **Variable CSS:** `--font-body`
    * **Uso:** Texto de formularios, botones, labels, descripciones, mensajes
    * **Pesos:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
    * **Características:** Sans-serif moderna, altamente legible en tamaños pequeños, optimizada para pantallas

---

## 4. Sistema de Fondo Animado
El fondo de la aplicación está compuesto por cuatro capas apiladas con `position: fixed`, todas con `pointer-events: none` y `z-index: 0`:

1. **Gradient Mesh (`.bg-mesh`):** Gradientes radiales superpuestos en cyan, púrpura y rosa que se desplazan suavemente con la animación `mesh-drift` (20s, infinite alternate).
2. **Starfield (`.bg-stars`):** Puntos de luz estáticos generados con `radial-gradient` que pulsan con `stars-pulse` (6s).
3. **Vignette (`.bg-vignette`):** Gradiente radial que oscurece los bordes del viewport para centrar la atención.
4. **Scan Line (`.scan-line`):** Línea horizontal semitransparente que barre la pantalla verticalmente (8s), aportando un efecto sci-fi sutil.

El contenido de las páginas usa `z-index: 1` para quedar por encima de las capas de fondo.

---

## 5. Elementos Estructurales y Contenedores

* **Tarjeta de Autenticación (`.auth-card`):**
    * **Fondo:** `var(--glass)` con `backdrop-filter: blur(24px)`
    * **Borde:** `1px solid var(--glass-border)` con animación `glow-border` (5s) que pulsa entre borde sutil y borde iluminado
    * **Radio:** `20px` (`--radius-card`)
    * **Sombra:** Triple capa: borde interior blanco, halo neón cyan, sombra profunda
    * **Padding:** `44px 52px 40px`

* **Ventanas Modales (Error Modal):**
    * Misma base que las tarjetas pero con borde y halo en rojo (`rgba(255, 80, 80, ...)`)
    * Overlay: fondo `rgba(4, 12, 30, 0.75)` con `backdrop-filter: blur(4px)`
    * Animación de entrada: `modal-in` (escala 0.92 → 1 + deslizamiento vertical)

---

## 6. Botones y Controles Interactivos

* **Botón Neón (`.btn-neon`):**
    * **Fondo:** Gradiente diagonal `135deg` de cyan (18% opacidad) a púrpura (12% opacidad)
    * **Borde:** `1px solid rgba(0, 229, 255, 0.35)` con `border-radius: 12px`
    * **Sombra:** Halo neón cyan + sombra profunda
    * **Hover:** Elevación `-3px`, escala `1.02`, borde más brillante, efecto shimmer (barrido de luz blanca)
    * **Active:** Escala `0.97`, sombra reducida
    * **Disabled:** `opacity: 0.35`, cursor `not-allowed`

* **Botón Ghost (`.btn-ghost`):**
    * **Fondo:** Transparente
    * **Borde:** `1px solid rgba(168, 85, 247, 0.40)` — acento púrpura
    * **Hover:** Misma mecánica que btn-neon pero con tonos púrpura
    * **Uso:** Acción secundaria (ej. "Crear Cuenta" en Welcome)

* **Botón Submit (`.auth-submit`):**
    * Mismo estilo visual que `.btn-neon` pero con `width: 100%`
    * Animación de entrada: `field-slide-up` con delay de `480ms` para aparecer tras los campos

* **Inputs (`.neon-input`):**
    * **Fondo:** `var(--input-bg)` — `rgba(16, 34, 76, 0.72)`
    * **Borde:** `var(--input-border)` — `rgba(120, 210, 255, 0.22)`
    * **Focus:** Borde cyan brillante + halo triple (ring 3px + glow 25px) + fondo más opaco
    * **Placeholder:** `var(--text-50)`
    * **Radio:** `10px` (`--radius-input`)

---

## 7. Animaciones del Sistema

| Animación | Duración | Uso |
|-----------|----------|-----|
| `breathe-glow` | 4s infinite | Logo hero en pantalla de bienvenida |
| `logo-dramatic` | 1.2s once | Entrada del logo (blur + escala → normal) |
| `text-reveal` | 0.8s once (delay 0.9s) | Tagline bajo el logo |
| `field-slide-up` | 0.4s forwards | Campos de formulario, botones, links |
| `glow-border` | 5s infinite | Borde pulsante de las tarjetas |
| `shimmer` | 0.6s on hover | Barrido de luz en botones |
| `mesh-drift` | 20s alternate | Desplazamiento del gradiente de fondo |
| `stars-pulse` | 6s alternate | Pulso de las estrellas |
| `scan-move` | 8s linear | Línea de escaneo vertical |
| `error-shake` | 0.4s once | Sacudida horizontal en mensajes de error |
| `modal-in` | 0.35s once | Entrada de modales |

**Escalonamiento de campos:** Cada campo de formulario aparece 80ms después del anterior (delays: 200ms, 280ms, 360ms, 440ms). El botón submit aparece a 480ms y los links a 560ms.

---

## 8. Pantalla de Bienvenida (Welcome)

Estructura específica de la pantalla de inicio:

* **Orbe de resplandor (`.welcome-orb`):** Gradiente radial cyan/púrpura centrado detrás del logo, animación `breathe` (6s)
* **Logo hero (`.logo-hero`):** Logo grande (300px height) con `breathe-glow` y `drop-shadow` neón. Entrada con `logo-dramatic`
* **Título:** "¡Bienvenido a Cubo!" con `font-display`, text-shadow neón
* **Tagline:** "El juego de cartas definitivo" — uppercase, `text-reveal` animado
* **Botones:** Columna vertical con `btn-neon` (Iniciar Sesión) y `btn-ghost` (Crear Cuenta), min-width `260px`

---

## 9. Pantallas de Autenticación (Login, Register, ForgotPassword)

Todas comparten la misma estructura base:

* **Link "Volver" (`.auth-back`):** Posición absoluta arriba-izquierda con flecha ← animada
* **Tarjeta (`.auth-card`):** Glassmorphism con borde pulsante
* **Logo (`.auth-logo-img`):** 80px de altura con drop-shadow neón
* **Formulario:** Labels uppercase atenuadas + inputs neón + botón submit
* **Links secundarios (`.auth-links`):** Underline animado que crece desde la izquierda en hover
* **Mensajes de error:** Fondo rosa translúcido, borde rosa, color `#f9a8d4`, animación shake
* **Mensajes de éxito:** Fondo verde translúcido, borde verde, color `#86efac`

---

## 10. Radios de Borde

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-card` | `20px` | Tarjetas de autenticación, modales |
| `--radius-input` | `10px` | Campos de texto, mensajes |
| `--radius-btn` | `12px` | Botones (neon, ghost, submit) |

---

## 11. Easings

| Token | Valor | Uso |
|-------|-------|-----|
| `--spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Animaciones con rebote (botones, campos) |
| `--smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transiciones suaves (inputs, colores) |

---

## 12. Iconografía y "Assets" Gráficos

* **Estilo de Iconos Generales:** Íconos vectoriales lineales (outline) de trazo grueso, iluminados con efecto neón
* **Logo:** Imagen PNG (`Logo.png`) con drop-shadow neón cyan aplicado por CSS
* **Monedas y Estadísticas:** Cubos isométricos 3D cyan, estrellas doradas 3D, trofeos dorados 3D, gamepads azules
* **Avatares:** Ilustraciones tipo line-art con trazos neón

---

## 13. Responsive

* **Breakpoint principal:** `480px` (pantallas pequeñas)
* **Adaptaciones:**
    * `.auth-card`: min-width auto, padding reducido (32px 24px 28px), max-width 95%
    * `.logo-hero`: height reducida a 200px
    * `.welcome-btn`: min-width reducida a 220px
