# LEGADO FC — GDD

## Visión y bucle
Simulador web de carrera futbolística de 20–40 minutos. El usuario comienza a los 14 años, se especializa, compite, negocia, representa a su selección y se retira entre los 35 y 42. Bucle: revisar estado → elegir entrenamiento/riesgo → simular año → analizar resultados → decidir contrato → avanzar.

## Sistemas
- Posiciones: POR, LD, LI, DFC, MCD, MC, MP, ED, EI y DC; la media pondera atributos distintos por puesto.
- Atributos: velocidad, físico, resistencia, definición, pase, visión, técnica, defensa, mentalidad, liderazgo y potencial; crecimiento fuerte 15–22, estabilización 23–29 y declive desde 30.
- Personalidades: Ambicioso, Leal, Profesional, Temperamental, Líder y Trabajador; modifican desarrollo, moral, mercado y popularidad.
- Entrenamiento: explosividad, fuerza, finalización, creación, defensa, liderazgo o recuperación. Ninguno mejora todo. Intensidad prudente/equilibrada/máxima altera crecimiento y lesión.
- Temporada: pretemporada, entrenamiento, liga, copas, internacional, invierno, FIFA, verano, premios y descanso.
- Partidos: titularidad, minutos, goles, asistencias, tarjetas y valoración dependen de media, puesto, forma, club, físico y competencia.
- Lesiones: sobrecarga, esguince, muscular, fractura y ligamentos; reducen partidos, ritmo y físico; edad, carga e historial elevan el riesgo.
- Mercado: ofertas por necesidad, prestigio, presupuesto, edad, rendimiento y reputación; renovación, traspaso, rol, salario, duración y comisión del agente.
- Valor: fórmula no aleatoria con media exponencial, curva de edad, potencial, forma, liga/club, selección, producción por puesto, disponibilidad, títulos y ajuste comercial limitado.
- Popularidad separada: crece con hazañas, selección, títulos, premios, personalidad y exposición; influye en patrocinio/noticias, no reemplaza la calidad.
- Selección: convocatorias por forma, media, club y competencia; fechas FIFA y producción internacional.
- Inicio profesional: el jugador comienza a los 14 años como agente libre. El sistema selecciona una oferta juvenil de un club del país elegido; no puede simular una temporada hasta firmar el primer contrato.
- Mundo IA: 266 clubes reales del seed obligatorio, distribuidos en 26 ligas de 13 países, progresan, venden, fichan, generan jóvenes, cambian entrenadores, ascienden y descienden mediante eventos contextuales.
- Noticias: fichajes, lesiones, convocatorias, goles, récords, títulos y premios.
- Registro: partidos, minutos, goles, asistencias, tarjetas, lesiones, clubes, transferencias, títulos, premios, convocatorias, valor, popularidad, salario y ganancias.
- Retiro: voluntario desde 32; probabilidad desde 35; obligatorio a 42. Informe con historia, clubes, selección, títulos, premios, récords, picos, ganancias y categoría final.

## Balance, guardado e interfaz
Tres dificultades modifican crecimiento, riesgo y competencia. RNG sembrado permite coherencia. Límites de 20–99, fatiga y rendimientos decrecientes evitan explotación. Guardado automático en LocalStorage, exportación/importación JSON y snapshot versionado. UI “Terminal de rendimiento”: negro técnico, marfil, cian/naranja, radar, cronología, alta densidad de datos, oscuro/claro, responsive, contraste AA, foco visible y movimiento reducido.
