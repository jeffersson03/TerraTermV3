# Terraterm
## Definición
Es una plataforma web interactiva de exploración y análisis ambiental que integra datos de observación terrestre, variables geoespaciales y asistencia mediante inteligencia artificial.

Permite consultar las condiciones ambientales de una ubicación, explorar su evolución histórica e identificar factores relevantes para actividades como agricultura, pesca y otros trabajos relacionados con el entorno natural.

La información se presenta mediante un mapa interactivo 3D, paneles de análisis, alertas y un asistente conversacional.

## Fin del proyecto
Facilitar el acceso y la comprensión de información ambiental y geoespacial para apoyar la toma de decisiones informadas.
La plataforma busca:
- Convertir datos científicos en información visual y comprensible.
- Permitir la exploración de condiciones ambientales por ubicación y periodo.
- Identificar cambios, tendencias y posibles riesgos ambientales.
- Relacionar variables ambientales con actividades productivas.
- Acercar recursos científicos al público general mediante una experiencia accesible.

## Alcance
Globo terráqueo 3D e interacción geográfica.
Selección de ubicaciones, variables y periodos históricos.
Visualización de capas ambientales y sus leyendas.
Panel de gráficos, indicadores y comparaciones.
Consulta de datos procedentes de fuentes científicas, especialmente recursos de NASA.
Análisis de tendencias y cambios ambientales.
Alertas basadas en datos, umbrales o eventos definidos.
Asistente de IA para consultas en lenguaje natural.
Interacción entre el asistente y el mapa: ubicación, variables, capas y periodo.
Diseño responsive para escritorio, tablet y móvil.

## Usuarios y casos de uso
Agricultores: consultar temperatura, humedad del suelo, precipitación y vegetación en una zona.
Pescadores: explorar variables oceánicas disponibles y condiciones ambientales de una zona marítima.
Estudiantes y docentes: explorar datos terrestres y comprender cambios ambientales.
Investigadores y público interesado: comparar regiones, variables y periodos.

## Responsabilidades:

| Módulo | Responsabilidad |
|---|---|
| Explorador / mapa 3D | Mostrar el planeta, ubicaciones, capas y resultados geoespaciales. |
| Datos ambientales | Gestionar variables, unidades, fuentes y periodos disponibles. |
| Análisis | Calcular y presentar tendencias, variaciones, comparaciones e incertidumbre. |
| Dashboard | Resumir indicadores, gráficos, consultas y resultados relevantes. |
| Alertas | Mostrar avisos relacionados con condiciones o cambios ambientales. |
| Asistente IA | Interpretar preguntas, consultar datos y explicar resultados con sus fuentes. |
| Historial | Permitir revisar consultas y análisis anteriores, si se habilita persistencia. |

Construir la interfaz con React y JSX.
Utilizar Tailwind CSS para estilos, diseño visual y responsive.
Utilizar Three.js para la visualización 3D del planeta y elementos geoespaciales que correspondan.
Separar páginas, layouts, componentes y funcionalidades.
Mantener componentes reutilizables y responsabilidades acotadas.
Gestionar el estado compartido de mapa, filtros y asistente de forma consistente.
Consumir datos mediante servicios y APIs; no acoplar las llamadas HTTP a los componentes visuales.
Gestionar estados de carga, error, ausencia de datos y datos desactualizados.
Mantener una experiencia usable en escritorio, tablet y móvil.
Evitar exponer credenciales o claves privadas en el cliente.


## Variables
Variables ambientales iniciales
- Temperatura superficial.
- Humedad del suelo.
- Precipitación.
- Vegetación (por ejemplo, índices NDVI/EVI).
- Hielo y cobertura de nieve.

## Flujo y comportamiento
El usuario ingresa a la plataforma directamente
Accede al explorador.
Selecciona una ubicación, variable y periodo.
La plataforma consulta los datos disponibles.
El mapa actualiza sus capas, colores, leyenda y visualizaciones.
El usuario revisa gráficos, indicadores y resultados.
Puede realizar una pregunta al asistente.
El asistente consulta información disponible y, cuando corresponda, solicita al mapa una actualización.
La plataforma presenta la respuesta con fuentes, fechas y limitaciones.

## Principios de desarrollo
Modularidad: cada funcionalidad debe tener una responsabilidad clara.
Escalabilidad: permitir incorporar nuevas variables, fuentes y actividades sin rehacer la aplicación.
Reutilización: evitar duplicar componentes y lógica.
Separación de responsabilidades: distinguir interfaz, estado, servicios y reglas de negocio.
Accesibilidad: navegación clara, contraste adecuado y controles comprensibles.
Responsive: adaptar mapa, paneles, filtros y navegación a diferentes tamaños de pantalla.
Rigor científico: mostrar procedencia, unidades, periodo, resolución y limitaciones de los datos.
Transparencia: diferenciar observaciones, estimaciones, predicciones e interpretaciones generadas por IA.

## Instrucciones
- Cada función con más de 100 líneas de código, colocarla de forma específica. Sino no tan específica, breve.
- Cada función en CamelCase
- Utilizar los principios SOLID
- Cada código que vayas a ejecutar por ejemplo 'npm run dev' u otro script, no lo ejecutes, yo lo haré en otra terminal.
- Las SKILLS de acuerdo a lo que se te pida: Frontend, Diseño, Peticiones, Servicios estarán en /skills.
- Cada vez que necesites un código jsx de un diseño, me lo dices para realizarlo si en caso es algo simple.
- Cada vez que necesites datos reales, me dices para yo investigarlos y darte acceso a la API, u otro resumen de datos importantes.