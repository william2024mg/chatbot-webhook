// === DEPENDENCIAS ===
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// === FUNCIONES GENERALES ===
function inicioDiagnostico(agent) {
  const nombre = agent.parameters.nombre;
  const edad = agent.parameters.edad;
  const celular_apoderado = agent.parameters.celular_apoderado;

  agent.context.set({
    name: 'contexto_datos_alumno',
    lifespan: 50,
    parameters: { nombre, edad, celular_apoderado }
  });

  agent.add(`✅ Datos registrados:
• Nombre: ${nombre}
• Edad: ${edad}
• Celular del apoderado: ${celular_apoderado}

Empecemos con la evaluación. 🧠`);
}


function obtenerPuntajeDesdeParametros(agent, parametros) {
  let puntaje = 0;
  for (let i = 0; i < parametros.length; i++) {
    const valor = parseInt(agent.parameters[parametros[i]]);
    if (!isNaN(valor)) {
      puntaje += valor;
    }
  }
  return puntaje;
}

function calcularResultadoBloque(agent, parametros, nombreContexto, nombrePuntaje, interpretacionCallback) {
  const puntaje = obtenerPuntajeDesdeParametros(agent, parametros);

  let nivel = '';
  if (interpretacionCallback) {
    nivel = interpretacionCallback(puntaje);
  }

  agent.context.set({
    name: nombreContexto,
    lifespan: 50,
    parameters: { [nombrePuntaje]: puntaje, [`nivel_${nombrePuntaje}`]: nivel }
  });

  let mensaje = `✅ Puntaje total en ${nombrePuntaje.replace('puntaje_', '').replace('_', ' ')}: ${puntaje}`;
  if (nivel) mensaje += `\n🧠 Nivel identificado: ${nivel}`;

  agent.add(mensaje);
}

// === INTERPRETACIÓN DE NIVELES ===
function interpretarDepresion(puntaje) {
  if (puntaje <= 4) return 'mínima';
  if (puntaje <= 9) return 'leve';
  if (puntaje <= 14) return 'moderada';
  if (puntaje <= 19) return 'moderadamente severa';
  return 'severa';
}

function interpretarAnsiedad(puntaje) {
  if (puntaje <= 4) return 'mínima';
  if (puntaje <= 9) return 'leve';
  if (puntaje <= 14) return 'moderada';
  return 'severa';
}

function interpretarGenerico(puntaje) {
  if (puntaje <= 6) return 'bajo';
  if (puntaje <= 12) return 'moderado';
  return 'alto';
}

// === BLOQUES ===
function resultadoDepresion(agent) {
  return calcularResultadoBloque(agent, [
    'p1_depresion', 'p2_depresion', 'p3_depresion',
    'p4_depresion', 'p5_depresion', 'p6_depresion',
    'p7_depresion', 'p8_depresion', 'p9_depresion'
  ], 'contexto_puntaje_depresion', 'puntaje_depresion', interpretarDepresion);
}

function resultadoAnsiedad(agent) {
  return calcularResultadoBloque(agent, [
    'p1_ansiedad', 'p2_ansiedad', 'p3_ansiedad',
    'p4_ansiedad', 'p5_ansiedad', 'p6_ansiedad', 'p7_ansiedad'
  ], 'contexto_puntaje_ansiedad', 'puntaje_ansiedad', interpretarAnsiedad);
}

function resultadoEstres(agent) {
  return calcularResultadoBloque(agent, [
    'p1_estres', 'p2_estres', 'p3_estres',
    'p4_estres', 'p5_estres', 'p6_estres'
  ], 'contexto_puntaje_estres', 'puntaje_estres', interpretarGenerico);
}

function resultadoAutoestima(agent) {
  return calcularResultadoBloque(agent, [
    'p1_autoestima', 'p2_autoestima', 'p3_autoestima',
    'p4_autoestima', 'p5_autoestima', 'p6_autoestima'
  ], 'contexto_puntaje_autoestima', 'puntaje_autoestima', interpretarGenerico);
}

function resultadoAcoso(agent) {
  return calcularResultadoBloque(agent, [
    'p1_acoso', 'p2_acoso', 'p3_acoso',
    'p4_acoso', 'p5_acoso', 'p6_acoso'
  ], 'contexto_puntaje_acoso', 'puntaje_acoso', interpretarGenerico);
}

// === RESUMEN FINAL ===
function resumenFinal(agent) {

 const alumnoCtx = agent.context.get('contexto_datos_alumno');
  const nombre = alumnoCtx?.parameters?.nombre || 'Desconocido';
  const edad = alumnoCtx?.parameters?.edad || 'No registrado';
  const celular = alumnoCtx?.parameters?.celular_apoderado || alumnoCtx?.parameters?.celular_apoderado || 'No registrado';
  
  const contextos = [
    { ctx: 'contexto_puntaje_depresion', etiqueta: 'Depresión' },
    { ctx: 'contexto_puntaje_ansiedad', etiqueta: 'Ansiedad' },
    { ctx: 'contexto_puntaje_estres', etiqueta: 'Estrés académico' },
    { ctx: 'contexto_puntaje_autoestima', etiqueta: 'Autoestima' },
    { ctx: 'contexto_puntaje_acoso', etiqueta: 'Acoso escolar' }
  ];

  let mensaje = `📝 *Resumen del alumno:*\n• Nombre: ${nombre}\n• Edad: ${edad}\n• Celular apoderado: ${celular_apoderado}\n\n`;
\n`;

  for (const bloque of contextos) {
    const data = agent.context.get(bloque.ctx);
    const puntajeKey = `puntaje_${bloque.etiqueta.toLowerCase().replace(' ', '_')}`;
    const nivelKey = `nivel_${puntajeKey}`;
    const puntaje = data?.parameters?.[puntajeKey] || 'no disponible';
    const nivel = data?.parameters?.[nivelKey] || 'no determinado';
    mensaje += `• ${bloque.etiqueta}: ${puntaje} (Nivel: ${nivel})\n`;
  }

  mensaje += `\n💡 Este informe puede ser evaluado por un especialista.`;

 // ⚠️ Aquí puedes integrar la futura generación de PDF
  // generarPDF(nombre, edad, celular, resultados); // (Ejemplo para implementar luego)

  
  agent.add(mensaje);
}



// === INTENT MAP ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('🧠 Webhook recibido');

  let intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('resultado_depresion', resultadoDepresion);
  intentMap.set('resultado_ansiedad', resultadoAnsiedad);
  intentMap.set('resultado_estres', resultadoEstres);
  intentMap.set('resultado_autoestima', resultadoAutoestima);
  intentMap.set('resultado_acoso', resultadoAcoso);
  intentMap.set('resumen_final_resultados', resumenFinal);

  agent.handleRequest(intentMap);
});

// === INICIO DE SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
});





