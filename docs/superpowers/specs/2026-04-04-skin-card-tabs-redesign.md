# Spec: Rediseño de Tarjetas + Tabs + Panel Equipados

**Fecha:** 2026-04-04  
**Alcance:** `SkinCard`, `ShopPage`, `InventoryPage` (TSX + CSS)

---

## Objetivo

Rediseñar las pantallas `/shop` e `/inventory` para que:
1. Las tarjetas tengan la disposición vertical del frontend desktop (imagen → meta → botón de acción)
2. El icono de precio sea el SVG del cubo del juego (no el ◆ diamante)
3. Se navegue por categoría mediante pestañas estilo Chrome
4. Haya controles de ordenado (precio ↑ por defecto, precio ↓, nombre)
5. En inventario, un panel superior muestre los 3 ítems equipados (o ranuras vacías)

---

## Decisiones de diseño

### Tarjeta (SkinCard)

**Nueva estructura vertical** (mismo orden que el desktop):
```
┌─────────────────────────────┐
│  [imagen, aspect-ratio fijo]│  ← overflow hidden, object-fit cover
│  ┌──────────────────────┐   │  ← badge ✓ en esquina si equipado
│  │ badge (precio/estado)│   │
│  │ nombre               │   │
│  │ [botón acción]       │   │  ← full-width, siempre visible
│  └──────────────────────┘   │
└─────────────────────────────┘
```

**Sin overlay de hover** — el botón de acción siempre visible. Más limpio, más mobile-friendly.

**Loading**: spinner overlay sobre toda la card (igual que ahora).

**Icono cubo SVG**: reemplaza ◆. Mismo path que el logo de la app (cubo isométrico con aristas).

**Variantes de botón**:
| Variante | Badge superior | Botón |
|----------|---------------|-------|
| `shop-available` | Precio + cubo | "Comprar" (cyan) |
| `shop-owned` | "Poseída" (verde) | "Equipar" (ghost cyan) |
| `shop-equipped` | "Equipada" (gold) | "Desequipar" (ghost red) |
| `inventory-normal` | — | "Equipar" (cyan) |
| `inventory-equipped` | "Equipada" (gold) | "Desequipar" (ghost red) |

**Badge ✓** (checkmark circular en esquina superior derecha): aparece en `shop-owned`, `shop-equipped`, `inventory-equipped`.

### Pestañas (Chrome-style)

Tres tabs: **Tapetes | Reversos de Carta | Avatares**

Estilo Chrome:
- Tab bar: `border-bottom: 1.5px solid rgba(0,229,255,0.18)`
- Tab inactivo: `background: transparent`, `border: 1px solid transparent`, `border-bottom: none`
- Tab activo: `background: var(--glass)`, `border: 1px solid rgba(0,229,255,0.22)`, `border-bottom: none`, `position: relative; top: 1.5px` (cubre la línea inferior)
- `border-radius: 10px 10px 0 0` (esquinas superiores redondeadas)

El contenedor del grid lleva `background: var(--glass)` + bordes que se conectan visualmente con el tab activo.

### Controles de ordenado

Fila de pills inmediatamente bajo el tab bar:
- "Precio ↑" (defecto activo)
- "Precio ↓"
- "Nombre A–Z"

Estilo: `.sort-btn` / `.sort-btn--active` — glassmorphism + borde cyan cuando activo.

### Panel de equipados (solo Inventario)

Sección superior antes de las tabs, siempre visible:

```
┌────────────────────────────────────────────────────────────┐
│  EQUIPADO ACTUALMENTE                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  [tapete img]│  │ [carta img]  │  │ [avatar img] │     │
│  │  Nombre      │  │  Nombre      │  │  Nombre      │     │
│  │  Tapete      │  │  Carta       │  │  Avatar      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

- 3 columnas de igual ancho
- Cada slot: preview de 90px de alto (`object-fit: contain`) + label categoría + nombre skin
- Estado vacío: borde punteado + texto "Ninguno/a"
- No interactivo (solo visual)

---

## Ficheros afectados

| Fichero | Tipo de cambio |
|---------|---------------|
| `src/components/SkinCard.tsx` | Reescritura completa (nueva estructura JSX) |
| `src/styles/SkinCard.css` | Reescritura completa (nuevo layout card, sin overlay) |
| `src/pages/ShopPage.tsx` | Estado `activeTab`+`sortBy`, filtro+sort, UI tabs+sort |
| `src/styles/ShopPage.css` | Tabs Chrome, sort pills, grid single-type |
| `src/pages/InventoryPage.tsx` | Panel equipados, estado `activeTab`+`sortBy`, UI |
| `src/styles/InventoryPage.css` | Panel equipados, tabs, sort |

---

## No cambia

- `useSkins.ts` — sin cambios
- `ConfirmModal.tsx` / `ConfirmModal.css` — sin cambios
- `skin.service.ts`, `skin.types.ts` — sin cambios
- `GameHeader.tsx` — sin cambios
