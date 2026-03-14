# Documento de Especificación de Estilo UI/UX: Proyecto "Cubo"

## 1. Concepto Visual General
El diseño de la aplicación "Cubo" se basa en una estética **"Neon Digital" o "Sci-Fi de Mesa"**. Se caracteriza por interfaces oscuras que simulan un entorno virtual o de proyección holográfica, donde los elementos interactivos y contenedores están definidos por líneas de luz de neón brillantes. No hay texturas complejas, sino gradientes suaves de fondo y efectos de resplandor (glow) intensos en los bordes.

---

## 2. Paleta de Colores
La paleta se apoya en el alto contraste entre fondos oscuros profundos y acentos luminosos.

* **Fondo Base (Backgrounds):**
    * `Azul Oscuro Profundo`: (Aprox. `#051A3B` a `#0A2E5C`). Se utiliza un gradiente radial sutil, siendo ligeramente más claro en el centro o hacia la parte superior, y más oscuro en los bordes de la pantalla.
* **Acentos Principales (Neon):**
    * `Cian Neón / Azul Eléctrico`: (Aprox. `#00BFFF` a `#4DFFFF`). Es el color dominante para bordes, textos de botones neutrales, iconos de navegación y líneas divisorias. Siempre va acompañado de un efecto *Outer Glow* (resplandor exterior) del mismo tono con menor opacidad.
* **Acentos Secundarios (Destacados y Recompensas):**
    * `Dorado / Amarillo Neón`: Utilizado para resaltar al jugador actual (CuboMaster99) en listas, para la moneda de "Estrellas/XP" y "Trofeos", y para los textos de rango.
* **Colores Semánticos (Acciones):**
    * `Verde Neón`: Acción positiva o confirmación (ej. botón "Aceptar", "Jugar Otra Vez", "Comenzar Partida").
    * `Rojo Neón`: Acción negativa, cancelación o error (ej. botón "Cancelar").
* **Textos:**
    * `Blanco Puro`: Texto principal, valores numéricos, nombres de jugadores.
    * `Cian Claro`: Títulos de secciones secundarias o subtítulos.

---

## 3. Tipografía
Se identifican dos familias tipográficas principales para crear jerarquía:

* **Tipografía de Títulos (Display / Headers):**
    * **Estilo:** Sans-serif, condensada (narrow), en negrita (bold), geométrica.
    * **Uso:** Títulos de ventanas modales ("CREAR PARTIDA", "RANKING GLOBAL"), etiquetas grandes, encabezados de secciones.
    * **Formato:** Siempre en mayúsculas (All-Caps).
    * **Ejemplos de fuentes similares:** *Bebas Neue, Oswald, Anton.*
* **Tipografía de Cuerpo (Body Text):**
    * **Estilo:** Sans-serif, limpia, redonda, legible en tamaños pequeños.
    * **Uso:** Nombres de jugadores, descripciones de reglas, números en botones y listas, subtítulos.
    * **Formato:** Sentence case o Title case (combinación de mayúsculas y minúsculas).
    * **Ejemplos de fuentes similares:** *Roboto, Open Sans, Montserrat.*

---

## 4. Elementos Estructurales y Contenedores

* **Paneles y Tarjetas (Cards/Panels):**
    * **Forma:** Rectángulos con bordes muy redondeados (border-radius alto, aprox. 12px - 16px).
    * **Fondo:** Azul muy oscuro semitransparente, ligeramente más claro que el fondo general de la app para dar sensación de elevación.
    * **Borde:** Línea sólida fina (1px - 2px) de color Cian Neón, acompañada de un *Glow* exterior.
* **Ventanas Modales (Pop-ups):**
    * Siguen la misma regla de los paneles, pero ocupan el centro de la pantalla.
    * Detrás de la ventana modal, el resto de la interfaz se oscurece con un "overlay" negro o azul muy oscuro al 50%-70% de opacidad para focalizar la atención.
* **Listas y Tablas:**
    * Cada fila es un contenedor independiente (rectángulo redondeado) o está separada por líneas de neón horizontales.
    * **Estado Activo/Destacado:** Si la fila corresponde al usuario actual (ej. Ranking o Fin de partida), el borde Cian Neón se reemplaza por un borde y resplandor **Dorado Neón**.

---

## 5. Botones y Controles Interactivos

* **Botones Principales (Acciones):**
    * **Forma:** Forma de píldora (Pill-shaped, bordes completamente redondeados).
    * **Estilo Neutral:** Borde y resplandor Cian Neón. Texto interior en blanco o cian.
    * **Estilo Positivo:** Borde y resplandor Verde Neón. (Ej. "Comenzar Partida", "Aceptar").
    * **Estilo Negativo:** Borde y resplandor Rojo Neón. (Ej. "Cancelar").
    * **Relleno:** Gradiente sutil o color sólido muy oscuro, asegurando que el borde de neón sea el protagonista.
* **Botones Cuadrados (Menú Inferior y Navegación):**
    * **Forma:** Cuadrados con esquinas redondeadas.
    * **Estado Activo/Inactivo:** Líneas conectoras tipo "circuito" o diagrama de flujo unen estos botones entre sí y al contenedor principal, dando una estética tecnológica.
* **Checkboxes (Cajas de selección):**
    * Cuadrados pequeños con esquinas redondeadas. Borde azul apagado cuando están inactivos. Borde Cian Neón y marca de verificación (✓) azul clara cuando están activos.
* **Toggles (Interruptores):**
    * Forma de píldora. El estado activo ilumina el "pulgar" (círculo interior) y el borde exterior con Cian Neón. (Ej. "SALA PÚBLICA / SALA PRIVADA").
* **Inputs (Cajas de texto):**
    * Fondo azul muy oscuro, borde Cian Neón. El texto de *placeholder* (ej. "Código...") aparece en un azul/grisáceo atenuado.

---

## 6. Iconografía y "Assets" Gráficos

* **Estilo de Iconos Generales:** Son íconos vectoriales "Lineal" (outline) de trazo grueso, iluminados con el mismo efecto de neón que los bordes.
* **Monedas y Estadísticas (HUD Superior Derecho):**
    * **Cubos:** Un cubo isométrico 3D de color azul claro/cian. Representa la moneda o puntos del juego.
    * **Estrellas:** Estrella dorada 3D. Representa la experiencia (XP) o puntuación acumulada.
    * **Trofeos:** Copa dorada 3D con detalles oscuros. Representa el rango competitivo.
    * **Mando (Gamepad):** Ícono azul. Representa la cantidad de partidas jugadas.
* **Avatares:**
    * Ilustraciones tipo *line-art* (trazos) de rostros, iluminados en neón (azul para usuarios estándar, rojo/naranja/morado para otros, a veces rellenando los colores si el usuario lo personaliza).
* **Cartas:**
    * Reversos oscuros con bordes azules o diseños especiales (ej. Dragón dorado). Frente de carta estilo clásico pero adaptado al entorno oscuro.

---

## 7. Estructura de Diseño (Layouts recurrentes)

**A. Barra Superior (Top Header):**
* **Izquierda:** Botón de "Atrás" (Flecha hacia la izquierda + texto) con forma de píldora, o el Logo de la aplicación.
* **Centro:** (A veces) Título de la pantalla actual.
* **Derecha:** Indicadores de recursos encapsulados en cajas redondeadas individuales (Cubos, Estrellas, Trofeos) y un botón de Ajustes (Engranaje) cuadrado y separado en la esquina extrema derecha.

**B. Navegación Principal (Home Screen):**
* Centrado en la pantalla inferior, un sistema de nodos conectados por líneas de luz. Contiene botones grandes cuadrados para: Inventario, Tienda, Crear Partida, Unirse a Sala, Perfil.

**C. Layout de Ventana Modal (Pop-up):**
* **Header:** Título grande, centrado, tipografía condensada.
* **Cuerpo (Body):** Elementos de interacción (listas de reglas, selección de barajas con iconos grandes, confirmación de compra).
* **Footer:** Botones de acción (Aceptar/Cancelar, Volver/Comenzar) en forma de píldora, distribuidos horizontalmente.

**D. Layout de Listas (Rankings / Resultados / Salas):**
* Tablas estructuradas en columnas, donde la primera fila actúa como encabezado con los iconos representativos (Trofeo, Avatar, Estrella, Mando).
* El contenido principal scrollea verticalmente con una barra de desplazamiento (scrollbar) estilizada a la derecha: una pastilla vertical con glow cian.