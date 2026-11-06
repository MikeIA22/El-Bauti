# El Bauti: Actualización de Controles, Tabernas Realistas de Calle Laurel y Modo Móvil

Plan detallado para corregir la inversión de controles de dirección, sustituir los muros genéricos por auténticas fachadas de tabernas de la Calle Laurel (con toldos de madera, entradas a bares y terrazas), rediseñar los obstáculos para que sean inmediatamente reconocibles como barricas de vino y mesas altas de terraza con taburetes, y optimizar la experiencia para teléfonos móviles en formato vertical con controles para el pulgar.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones confirmadas basadas en tus respuestas:

- **Corrección de Controles Invertidos**: Corrección matemática del sistema de coordenadas de la cámara 3D en Three.js. Al mirar hacia $+Z$, la pantalla tiene $+X$ a la izquierda y $-X$ a la derecha. Ajustaremos la asignación de carriles para que el botón de la izquierda mueva a Bauti a la izquierda visual de la pantalla y el botón de la derecha a la derecha, tanto con botones como con deslizamientos táctiles (*swipes*) y teclado (`A`/`D`/Flechas).
- **Tabernas Tradicionales de Calle Laurel**: Sustitución de los muros por fachadas detalladas de bares riojanos:
  - Entradas abiertas de bares con interiores iluminados y estanterías de botellas de vino.
  - Toldos de madera y tela sobre las puertas con letreros auténticos (*Bar Soriano, Bar Jubera, Bar Lorenzo, Taberna Laurel*).
  - Barricas y taburetes colocados en las aceras junto a las puertas de los bares.
  - Azulejos cerámicos tradicionales en la parte inferior de las fachadas y faroles de taberna.
- **Obstáculos Realistas y Claros**:
  - 🍷 **Barrica de Roble de Rioja**: Barrica de madera curvada con aros de acero oscuro, remaches, espita de madera y sello de vino tinto de Rioja (se puede saltar o esquivar).
  - 🪑 **Mesa Alta con Taburetes de Terraza**: Mesa redonda de madera de bar con 2 taburetes altos de taberna, botella de vino y plato de tapa (se esquiva a izquierda/derecha).
  - 🪵 **Toldo y Cartel Bajo de Madera**: Viga y toldo de bar con letrero colgante para deslizarse por debajo (*slide*).
  - 📦 **Doble Barrica de Reserva**: Dos barricas apiladas que bloquean carril.
- **Optimización para Móviles (Modo Vertical Estricto)**:
  - Ajuste dinámico del campo de visión (FOV) de la cámara en pantallas verticales para que los 3 carriles se vean completos sin recortes laterales.
  - Controles ergonómicos en la parte inferior para los pulgares (botones táctiles de Izquierda, Derecha, Salto y Rodar) más gestos de deslizamiento en toda la pantalla.
  - Bloqueo de scroll, zoom y rebotes táctiles (`touch-action: none`).

---

## 1. Overview & Architecture

### Diagrama de Flujo y Componentes
```
┌─────────────────────────────────────────────────────────────┐
│                       App.tsx                               │
│  - Detección de orientación vertical móvil                  │
│  - Swipes táctiles + Teclado con coordenadas corregidas      │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
     ┌───────────────────┐           ┌───────────────────┐
     │  GameEngine.ts    │           │    GameUI.tsx     │
     │ - Coord X fix     │           │ - HUD vertical    │
     │ - FOV móvil       │           │ - Botones pulgar  │
     │ - Colisiones AABB │           │ - Menús táctiles  │
     └─────────┬─────────┘           └───────────────────┘
               │
      ┌────────┴──────────────────────────┐
      ▼                                   ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│     street.ts           │     │      character.ts       │
│ - Bares de Calle Laurel │     │ - Bauti 3D Rig          │
│ - Barricas realistas    │     │ - Animación correr/     │
│ - Mesas altas & stools  │     │   saltar/rodar          │
│ - Toldos y letreros     │     │ - Textura de la foto    │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 2. Plan de Ejecución Paso a Paso

1. **Corrección de Ejes y Controles (Inversión Izquierda/Derecha)**:
   - Configurar `LANES = [2.3, 0, -2.3]`:
     - Carril 0 (Izquierda visual en pantalla) = $+2.3$ en $X$.
     - Carril 1 (Centro) = $0$.
     - Carril 2 (Derecha visual en pantalla) = $-2.3$ en $X$.
   - Verificar que pulsar `moveLeft()` cambie a carril inferior (hacia la izquierda de la pantalla) y `moveRight()` hacia la derecha.
   - Sincronizar botones táctiles, gestos de deslizamiento (*swipes*) y teclas `A` / `D` / Flechas para una respuesta 100% intuitiva.

2. **Rediseño de Fachadas de Bares de Calle Laurel (`street.ts`)**:
   - Crear módulos de tabernas reales con:
     - Marcos de madera y puertas abiertas a tabernas con iluminación cálida interior.
     - Zócalos de azulejos riojanos tradicionales y ladrillo rústico.
     - Toldos de madera y lona a rayas sobre cada bar con nombres emblemáticos (*Bar Soriano*, *Bar Jubera*, *Bar Lorenzo*, *El Laurel*).
     - Farolillos de forja en las paredes de los bares que proyectan luz ámbar sobre la acera y las barricas.
     - Barricas decorativas y pizarras de tapas (*"Champiñón a la plancha"*, *"Zapatilla de jamón"*, *"Crianza del año"*).

3. **Modelado de Obstáculos Realistas y Reconocibles**:
   - **Barrica de Roble**: Geometría cilíndrica curvada con textura de madera de duelas oscuras, aros dobles de hierro forjado con remaches y una espita de madera.
   - **Mesa Alta con Taburetes**: Mesa redonda de madera de roble con pata central y base metálica, rodeada por 2 taburetes altos de taberna con reposapiés y asiento redondo, con una botella de vino tinto con cápsula roja y copa.
   - **Toldo Bajo de Bar**: Estructura de toldo de taberna con faldón y letrero de madera para rodar por debajo.

4. **Adaptabilidad Móvil (Pantalla Vertical & Controles de Pulgar)**:
   - Ajustar el aspect ratio y FOV de la cámara en `GameEngine`: cuando el ancho de pantalla sea menor que el alto (móviles verticales), ampliar el FOV vertical a $72^\circ$ para que los 3 carriles y las tabernas laterales sean perfectamente visibles.
   - Diseñar una barra de controles inferior ergonómica para el pulgar izquierdo (Izquierda / Derecha) y pulgar derecho (Salto / Rodar) con retroalimentación visual al pulsar.
   - Mantener el control por deslizamiento de dedo (*swipe*) en cualquier zona de la pantalla.
   - Asegurar `touch-action: none` y prevención de arrastre accidental de página.

5. **Verificación y Compilación**:
   - Ejecutar `compile_applet` y `lint_applet`.
   - Reiniciar dev server y verificar en previsualización.
