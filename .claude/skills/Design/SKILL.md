# Diseño
# Sistema de Diseño: NASA Earth & Ocean Telemetry (MVP Temperatura)

## 1. Identidad Visual & Estética ("Aerospace Radar")
* **Concepto:** Centro de control aeroespacial moderno (estilo *NASA Worldview* / *SpaceX Dragon HUD*).
* **Atmósfera:** Modo oscuro profundo (*Deep Space Dark Mode*) con alto contraste, retículas de precisión, líneas de barrido tipo radar y tipografía monoespaciada para datos telemétricos.
* **Geometría:** Esquinas rectas o chaflanes técnicos (`border-radius: 2px` a `4px`), bordes finos de `1px` con opacidad baja y micro-marcas de mira (`+` o escuadras en las esquinas de los paneles).

---

## 2. Sistema de Color (Tokens Base)

### Fondos y Superficies (Comunes a ambas vistas)
| Token | Hex | Uso |
| :--- | :--- | :--- |
| `--bg-void` | `#05080F` | Fondo principal del lienzo / espacio exterior |
| `--bg-panel` | `#0B111E` | Contenedores HUD, sidebars y tarjetas de telemetría |
| `--bg-elevated` | `#121B2E` | Modales, tooltips y estados hover |
| `--border-grid` | `rgba(148, 163, 184, 0.15)` | Líneas de retícula, divisores y marcos |
| `--border-active` | `rgba(56, 189, 248, 0.5)` | Borde activo al seleccionar un sensor o zona |

### Tipografía
| Token | Hex | Uso |
| :--- | :--- | :--- |
| `--text-primary` | `#F1F5F9` | Valores numéricos principales y títulos |
| `--text-secondary` | `#94A3B8` | Etiquetas de metadatos y unidades (`°C`, `K`, `LAT/LON`) |
| `--text-muted` | `#475569` | Coordenadas de fondo y marcas de tiempo inactivas |

### Escala Térmica Científica (Paleta "Thermal Inferno / Viridis")
Para representar temperatura de forma rigurosa (evitando el verde-rojo básico):
* **Frío Extremo (-40°C a 0°C):** `#1E3A8A` → `#0284C7` → `#38BDF8` (Azul cobalto a cian glacial)
* **Templado (1°C a 22°C):** `#2DD4BF` → `#FACC15` (Turquesa neutro a amarillo solar)
* **Cálido / Anomalía (23°C a 45°C+):** `#FB923C` → `#EF4444` → `#991B1B` (Naranja térmico a carmesí crítico)

---

## 3. Tipografía y Datos
* **Títulos y UI (`Inter` o `Space Grotesk`):** Pesos `500` y `600`, `letter-spacing: 0.08em`, texto en mayúsculas (`UPPERCASE`) para encabezados de panel.
* **Telemetría y Coordenadas (`JetBrains Mono` o `Fira Code`):** Obligatorio usar `font-variant-numeric: tabular-nums` para que los números no "salten" al actualizarse en tiempo real.

---

## 4. Vista 1: Monitoreo Terrestre (`TERRA // LST - Land Surface Temperature`)

<Image src="image_agent_tag_15136376634737805776" alt="Mapa global de anomalías de temperatura terrestre de la NASA" caption="Referencia térmica terrestre NASA GISTEMP" />

### Enfoque Visual
* **Acento Primario de Interfaz:** Ámbar Aeroespacial (`#F59E0B`) para cursores, anillos de radar y vectores de selección.
* **Mapa Base:** Topografía oscura desaturada con relieve sombreado (*Hillshade*), fronteras políticas sutiles y curvas de nivel topográfico.

### Elementos de Radar y HUD Terrestre
1. **Barrido de Radar Radial / Orbital:** Animación sutil que simula el paso de un satélite de órbita polar (ej. *Landsat / MODIS*) escaneando franjas de terreno.
2. **Capa Heatmap Térmico:** Opacidad al `65%` con modo de fusión `screen` o `lighten` para no ocultar el relieve montañoso.
3. **Widgets Específicos:**
   * **Estaciones / Puntos de Calor:** Marcadores circulares concéntricos con pulso lento en zonas de anomalía térmica (islas de calor urbanas o incendios).
   * **Perfil Altitudinal vs. Temperatura:** Mini gráfico lineal en el panel inferior que cruza elevación (`m.s.n.m.`) con temperatura superficial (`LST`).
   * **Selector de Espectro:** Toggle rápido entre `Temperatura Superficial (°C)` y `Anomalía Histórica (±Δ°C)`.

---

## 5. Vista 2: Monitoreo Oceánico (`AQUA // SST - Sea Surface Temperature`)

<Image src="image_agent_tag_15136376634737806271" alt="Visualización de temperatura superficial del mar de la NASA" caption="Referencia de corrientes y temperatura oceánica NASA" />

### Enfoque Visual
* **Acento Primario de Interfaz:** Cian Sonar (`#06B6D4`) para retículas, ondas de pulso y líneas de flujo.
* **Mapa Base:** Continentes en negro mate sólido (`#070B12`) con borde costero brillante (`1px solid #1E293B`) para que toda la atención visual recaiga en el océano. Batimetría sutil en el fondo marino.

### Elementos de Radar / Sonar y HUD Marítimo
1. **Líneas de Flujo de Corrientes (Streamlines):** Partículas animadas muy finas que muestran el desplazamiento de corrientes cálidas y frías (ej. *Corriente de Humboldt* o *El Niño*).
2. **Isolíneas Térmicas (Isotermas):** Líneas vectoriales delgadas que delimitan bloques de temperatura exacta cada `2°C`, similares a cartas náuticas digitales.
3. **Widgets Específicos:**
   * **Radar de Boyas / Satélite:** Ping concéntrico estilo sonar al hacer clic en cualquier coordenada oceánica, desplegando latitud, longitud y profundidad de muestreo.
   * **Indicador de Anomalía Oceánica (ONI / ENSO):** Barra horizontal de desviación térmica respecto al promedio estacional (`-3.0°C` a `+3.0°C`).
   * **Gradiente Costero:** Lectura comparativa entre temperatura en mar abierto vs. plataforma continental.

---

## 6. Reglas de Interacción y Movimiento
* **Transición entre Vistas (`TERRA` ↔ `AQUA`):** Al cambiar de pestaña, el mapa mantiene las coordenadas y el nivel de zoom; solo se invierte la máscara (océano oscuro en Terra / tierra oscura en Aqua) y muta el color de acento (`#F59E0B` ↔ `#06B6D4`) con una transición de `300ms ease-out`.
* **Crosshair Global:** Al mover el cursor sobre el mapa, dos líneas finas (`1px dashed`) cruzan toda la pantalla mostrando latitud y longitud exactas en los bordes del visor.