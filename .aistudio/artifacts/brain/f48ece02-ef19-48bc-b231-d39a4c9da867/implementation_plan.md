# El Bauti: Corrección Definitiva del Cartel LIDL (Fondo Amarillo con Letras 3D Azul Marino)

Plan para resolver el bug visual del cartel de LIDL sustituyendo el plano texturizado por una estructura física 3D real: un panel amarillo limpio con letras en bloque 3D azul marino extruidas en relieve real, eliminando cualquier problema de superposición o culling de texturas.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones confirmadas basadas en tu captura y respuesta:

- **Cartel Limpio Amarillo con Letras 3D**:
  - Se elimina el antiguo plano texturizado (que causaba el glitch de caras superpuestas rojo/azul visible en la captura).
  - Se crea un **panel de madera maciza amarillo brillante** (`#FFD200`).
  - Las letras **L · I · D · L** se construyen como **geometría física 3D real en bloque (azul marino sólido `#002868`)**:
    - Letras extruidas con volumen propio (barras verticales y horizontales de profundidad 3D).
    - Proyectan sombra real sobre el fondo amarillo y se leen perfectamente desde cualquier ángulo y distancia sin depender de planos ni transparencias.
    - Presentes tanto en la cara frontal como trasera con `side: THREE.DoubleSide` para garantizar visibilidad al 100%.

---

## 1. Overview & Architecture

### Diagrama de la Nueva Geometría del Cartel LIDL
```
┌─────────────────────────────────────────────────────────────┐
│                    VIGA METÁLICA SUPERIOR                   │
│                       [ ⛓️ ]       [ ⛓️ ]                   │
│                                                             │
│       ┌─────────────────────────────────────────────┐       │
│       │               FONDO AMARILLO                │       │
│       │                                             │       │
│       │      █       ██████      ██████      █      │       │
│       │      █         ██        █    ██     █      │       │
│       │      █         ██        █     █     █      │       │
│       │      █████   ██████      ██████      █████  │       │
│       │                                             │       │
│       │          [ LETRAS 3D AZUL MARINO ]          │       │
│       └─────────────────────────────────────────────┘       │
│                                                             │
│                 ⬇️ (RODAR POR DEBAJO) ⬇️                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Plan de Ejecución Paso a Paso

1. **Reemplazo Completo de `createLidlSignObstacle` (`street.ts`)**:
   - Eliminar el plano de textura 2D y la superposición de planos azul/rojo.
   - Crear un panel base amarillo sólido con `BoxGeometry(1.85, 1.35, 0.12)` y material amarillo brillante mate (`color: 0xFFD200, roughness: 0.6`).
   - Construir cada letra como un subgrupo de cajas 3D extruidas en azul marino (`color: 0x002868, roughness: 0.5, metalness: 0.1`):
     - **L**: Barra vertical ($0.13\text{m} \times 0.65\text{m}$) + base horizontal ($0.34\text{m} \times 0.13\text{m}$).
     - **I**: Barra vertical sólida ($0.13\text{m} \times 0.65\text{m}$).
     - **D**: Columna izquierda + arcos superior e inferior + cierre lateral.
     - **L**: Barra vertical + base horizontal.
   - Montar las letras sobre la cara delantera que mira al jugador con un offset de $Z = +0.07\text{m}$ (relieve físico real hacia la cámara).

2. **Validación de la Hitbox de Colisión**:
   - Mantener la altura del cartel a $Y = 1.62\text{m}$ con hitbox `minY: 0.85, maxY: 2.15`.
   - Bauti choca si va corriendo de pie ($Y \approx 1.85\text{m}$), pero pasa limpiamente por debajo al rodar por el suelo (*slide*, $Y \le 0.75\text{m}$).

3. **Verificación y Compilación**:
   - Ejecutar `compile_applet` y `lint_applet`.
   - Reiniciar dev server y verificar que el cartel se ve brillante, limpio y sin glitches.
