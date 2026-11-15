# Análisis histórico de Ica y Pisco

El módulo del explorador selecciona variable, lugar y periodo, agrega meses a años completos y muestra la pendiente por década, IC 95 %, Mann–Kendall y veredicto. Rangos de referencia: temperatura de 1981 a 2025, precipitación comparable de 2003 a 2024 y contraste mensual en junio de 2025.

## Datos

`src/features/analysis/data/ica-pisco.json` conserva las series mensuales verificadas. Sus copias permiten reproducir la demo sin conexión. Los enlaces de la ficha permiten revisar los productos originales.

- [NASA POWER, Ica](https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M%2CTS%2CPRECTOTCORR&community=RE&longitude=-75.73&latitude=-14.07&start=1981&end=2025&format=JSON). `T2M` y `TS` son °C. `PRECTOTCORR` es mm/día. La agregación de temperatura pondera por días del mes. Para la lluvia se multiplica la tasa por los días y se suman los meses del año.
- [NASA POWER, mar frente a Pisco](https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=TS&community=RE&longitude=-77&latitude=-14&start=1981&end=2025&format=JSON). Se compara `TS` con el mismo producto y años completos comunes.
- [GPM IMERG de NASA, extracto de USF](https://erddap.marine.usf.edu/erddap/griddap/IMERG_monthly_global_precip.html). Se ponderan 42 píxeles de 0,1° por su área de intersección con la celda POWER de Ica (oeste −75,9375°, sur −14,25°, este −75,3125°, norte −13,75°) y se guardan los mm acumulados por mes. El extracto llega a septiembre de 2025. La versión y corrida exactas quedan sin confirmar.

El IC usa Newey–West, núcleo de Bartlett, dos rezagos, ajuste n/(n−2) y cuantiles t con n−2 grados de libertad. Mann–Kendall bilateral corrige empates y continuidad. Su versión ordinaria es sensible a autocorrelación. El veredicto usa valores sin redondear y exige que el IC excluya cero y p sea menor que 0,05 para indicar evidencia. El aviso de nivel es exploratorio y se presenta junto al veredicto. Con menos de 20 años completos se añade el aviso «Periodo corto» junto al veredicto. El cálculo y el veredicto se conservan.

## Consulta en vivo

La opción «Otro lugar (consulta en vivo)» pide latitud y longitud y consulta la API mensual de NASA POWER desde el navegador. La API es pública: no requiere clave ni cuenta. `src/services/nasa/powerService.js` arma la URL, aplica un límite de 30 s, convierte la respuesta al mismo formato de las copias guardadas (12 valores por año, sin la clave `AAAA13` y con el relleno −999 como dato ausente) y guarda en memoria cada consulta exacta ya respondida. Antes de aceptar una respuesta comprueba que trae las tres variables y coordenadas válidas; si falta algo, la interfaz muestra el aviso de formato. El motor de `trend.js` es el mismo para datos guardados y en vivo. Cobertura: `T2M`, `TS` y `PRECTOTCORR`, de 1981 a 2025, para cualquier coordenada. El contraste con IMERG existe solo para Ica. Si la consulta falla, la interfaz lo explica y los ejemplos guardados siguen disponibles.

## Verificación

Ejecutar `npm test` para comprobar las referencias y `npm run build` para compilar.

- **Aire en Ica.** Cambiar a 2003–2025. Deben verse 23 puntos, +0,37 °C/década, IC de +0,17 a +0,58 y p = 0,0031.
- **Tierra y mar.** Elegir temperatura superficial y el par Ica–Pisco. Al cambiar de 1981–2025 a 2003–2025, cada serie pasa de 45 a 23 años y de «Evidencia de tendencia» a «Evidencia insuficiente».
- **Lluvia de Ica.** Ver ambos productos, el aviso de posible cambio de nivel de POWER hacia 2015 y el contraste de junio de 2025 (122,4 frente a 1,30 mm). Los totales de 2025 quedan fuera del gráfico anual comparativo por cobertura.
- **Consulta en vivo.** Elegir «Otro lugar», escribir −14.07 y −75.73 y consultar. Con temperatura del aire en 2003–2025 deben repetirse las cifras de Ica (+0,37 °C/década, IC de +0,17 a +0,58).
- Repetir la selección de variable, gráfico, resultado y ficha de procedencia desde un celular en el sitio publicado.
