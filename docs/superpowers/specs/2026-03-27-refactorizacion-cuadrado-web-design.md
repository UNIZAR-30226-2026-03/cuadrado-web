# Spec: Refactorización cuadrado-web
**Fecha:** 2026-03-27
**Alcance:** Toda la carpeta `cuadrado-web/cuadrado-web/src/`

---

## 1. Objetivos

- Eliminar código duplicado y código muerto
- Dividir ficheros grandes en módulos con responsabilidad única
- Establecer un estilo de comentarios uniforme usando solo caracteres ASCII
- Mantener la funcionalidad intacta (refactoring puro, sin nuevas features)

---

## 2. Decisiones de arquitectura

### CSS: de monolítico a por-componente

Estrategia **C**: cada componente/página importa su propio fichero CSS.
Esto es el patrón estándar en proyectos Vite + React.

```
Antes:
  main.tsx  -> index.css  (variables, reset, keyframes)
  App.tsx   -> App.css    (TODO: 1.581 líneas con estilos de todos los componentes)

Después:
  main.tsx         -> index.css              (sin cambios)
  App.tsx          -> App.css                (solo estilos globales + bg layers, ~80 líneas)
  WelcomePage.tsx  -> styles/WelcomePage.css
  LoginPage.tsx    -> styles/auth.css        (compartido por las 5 páginas auth)
  RegisterPage.tsx -> styles/auth.css
  ForgotPasswordPage.tsx -> styles/auth.css
  VerifyCodePage.tsx     -> styles/auth.css
  ResetPasswordPage.tsx  -> styles/auth.css
  HomePage.tsx     -> styles/HomePage.css
  ErrorModal.tsx   -> styles/ErrorModal.css
  GameHeader.tsx   -> styles/GameHeader.css
  GameTable.tsx    -> styles/GameTable.css
  GameNavBar.tsx   -> styles/GameNavBar.css
```

`auth.css` se importa en las 5 páginas de auth (importar el mismo CSS múltiples veces en Vite
es seguro — el bundler lo deduplica). Contiene las clases compartidas: `.auth-card`,
`.neon-input`, `.btn-neon`, `.btn-ghost`, `.auth-links`, `.auth-back`, `.auth-submit`.

### CSS: deduplicación de botones

Los tres selectores `.btn-neon`, `.btn-ghost` y `.auth-submit` son ~90% idénticos.
Se crean clases base y se sobreescriben solo las variables de color:

```css
/* Clase base compartida */
.btn {
  /* estilos comunes: padding, border-radius, font, transiciones, shimmer... */
}

/* Variantes por color */
.btn-neon  { --btn-color: var(--neon-cyan);   --btn-glow: var(--glow-cyan); }
.btn-ghost { --btn-color: var(--neon-purple); --btn-glow: var(--glow-purple); }
```

Ahorro estimado: ~80 líneas CSS.

### TypeScript: extracción de `useAuthForm`

Las 5 páginas de autenticación repiten exactamente el mismo patrón:

```ts
// ANTES — repetido en cada página:
const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
const [showNetworkError, setShowNetworkError] = useState(false);
const clearFieldError = (field: string) => setFieldErrors(prev => { ... });
// + try/catch idéntico con setShowNetworkError(true) en el catch
```

Se extrae a `src/hooks/useAuthForm.ts`:

```ts
function useAuthForm<T extends string>(): {
  fieldErrors: Partial<Record<T, string>>;
  showNetworkError: boolean;
  setFieldErrors: (errors: Partial<Record<T, string>>) => void;
  clearFieldError: (field: T) => void;
  withSubmit: (fn: () => Promise<void>) => Promise<void>;
  dismissNetworkError: () => void;
}
```

`withSubmit` encapsula el try/catch + `setShowNetworkError(true)` en el `catch`.
Ahorro estimado: ~200 líneas TypeScript (40 por página × 5).

### GameTable: constantes y estado consolidado

- Extraer todos los valores de timing a `const TIMING = { DRAW: 500, PEEK: 1400, ... }`
- Consolidar los 8 `useState` independientes en 2 objetos de estado:
  - `cardState`: posición y tipo de cartas en juego
  - `layoutState`: viewport, player count, dimensions
- Los setTimeout anidados se mantienen (son correctos funcionalmente; un state machine
  sería sobreingeniería para la animación actual). Se añaden comentarios explicando la secuencia.
- Extraer la lógica del SVG geométrico a sub-función `renderGeometry()` para reducir el JSX raíz.

---

## 3. Estilo de comentarios (estándar del proyecto)

### TypeScript / TSX
```ts
// FileName.tsx - Descripción breve de una línea del propósito del fichero

/** Descripción del componente o función exportada (JSDoc) */

// --- Nombre de sección ---  (para agrupar bloques lógicos dentro del fichero)

// Comentario inline solo para lógica no evidente
```

### CSS
```css
/* FileName.css - Descripción breve de una línea */

/* === Nombre de sección === */

/* comentario inline para regla no evidente */
```

**Regla clave:** cero caracteres fuera del teclado estándar (no ═, no ─, no ▸, etc.)

---

## 4. Código muerto a eliminar

| Fichero | Líneas | Descripción |
|---------|--------|-------------|
| App.css | 589-602 | `.iso-grid { display: none !important }` + pseudo-elementos. El grid ya se renderiza condicionalmente en React. |
| App.css | Cualquier regla que solo aplique a clases nunca usadas en JSX | A confirmar en auditoría |

---

## 5. Ficheros nuevos a crear

| Fichero | Contenido |
|---------|-----------|
| `src/hooks/useAuthForm.ts` | Hook de estado de formularios de auth |
| `src/styles/auth.css` | Estilos compartidos de páginas de auth |
| `src/styles/WelcomePage.css` | Estilos de WelcomePage |
| `src/styles/HomePage.css` | Estilos de HomePage (lobby, cubos, overlay) |
| `src/styles/ErrorModal.css` | Estilos del modal de error |
| `src/styles/GameHeader.css` | Estilos del header del lobby |
| `src/styles/GameTable.css` | Estilos de la mesa de juego (mesa, cartas, manos, pilas) |
| `src/styles/GameNavBar.css` | Estilos de la barra de navegación |

---

## 6. Ficheros modificados

| Fichero | Cambio principal |
|---------|-----------------|
| `src/App.css` | Reducir a ~80 líneas: solo `.page`, bg layers, variables de layout global |
| `src/index.css` | Estandarizar comentarios. Sin cambios estructurales. |
| `src/App.tsx` | Estandarizar comentarios |
| `src/main.tsx` | Estandarizar comentarios |
| `src/pages/LoginPage.tsx` | Usar `useAuthForm`, importar auth.css |
| `src/pages/RegisterPage.tsx` | Usar `useAuthForm`, importar auth.css |
| `src/pages/ForgotPasswordPage.tsx` | Usar `useAuthForm`, importar auth.css |
| `src/pages/VerifyCodePage.tsx` | Usar `useAuthForm`, importar auth.css |
| `src/pages/ResetPasswordPage.tsx` | Usar `useAuthForm`, importar auth.css |
| `src/pages/WelcomePage.tsx` | Importar WelcomePage.css, estandarizar comentarios |
| `src/pages/HomePage.tsx` | Importar HomePage.css, estandarizar comentarios |
| `src/components/ErrorModal.tsx` | Importar ErrorModal.css, estandarizar comentarios |
| `src/components/GameHeader.tsx` | Importar GameHeader.css, estandarizar comentarios |
| `src/components/GameNavBar.tsx` | Importar GameNavBar.css, estandarizar comentarios |
| `src/components/GameTable.tsx` | Extraer TIMING, consolidar state, importar GameTable.css |
| `src/context/AuthContext.tsx` | Estandarizar comentarios |
| `src/services/auth.service.ts` | Estandarizar comentarios |
| `src/services/user.service.ts` | Estandarizar comentarios |
| `src/types/auth.types.ts` | Estandarizar comentarios |
| `src/types/user.types.ts` | Estandarizar comentarios |
| `cuadrado-web-project-map.md` | Actualizar estructura de ficheros |

---

## 7. Restricciones y no-objetivos

- **No** cambiar la lógica de negocio ni el comportamiento visible
- **No** añadir nuevas features ni componentes de layout wrapper (YAGNI)
- **No** migrar a CSS Modules ni a CSS-in-JS
- **No** cambiar el sistema de diseño (variables CSS, clases existentes)
- **No** implementar token refresh (fuera del alcance de este refactoring)

---

## 8. Criterio de éxito

- `App.css` reducido de 1.581 a ≤ 100 líneas
- Ningún fichero supera las 400 líneas
- Los 5 ficheros de páginas de auth usan `useAuthForm`
- Cero caracteres Unicode no-ASCII en comentarios
- El proyecto compila sin errores (`npm run build`)
- El linter pasa sin errores (`npm run lint`)
