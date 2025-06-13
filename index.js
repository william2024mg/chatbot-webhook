// === DEPENDENCIAS ===
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();

process.env.DEBUG = 'dialogflow:debug';
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

// === FUNCIONES GENERALES ===
function inicioDiagnostico(agent) {
  const { nombre, edad, celular_apoderado } = agent.parameters;
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

function calcularPuntajeBloque(agent, claves, variableGlobal) {
  let total = 0;
  for (const clave of claves) {
    const valor = parseInt(agent.parameters[clave] || 0);
    total += valor;
  }
  agent.context.set({
    name: variableGlobal,
    lifespan: 50,
    parameters: { total }
  });
  return total;
}

// === INTERPRETACIONES ===
function interpretarDepresion(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  if (p <= 19) return "moderadamente severa";
  return "severa";
}

function interpretarAnsiedad(p) {
  if (p <= 4) return "mínima";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  return "severa";
}

function interpretarEstres(p) {
  if (p <= 5) return "leve";
  if (p <= 10) return "moderado";
  return "alto";
}

function interpretarAutoestima(p) {
  if (p <= 8) return "baja";
  if (p <= 16) return "media";
  return "alta";
}

function interpretarAcoso(p) {
  if (p <= 5) return "mínimo o inexistente";
  if (p <= 10) return "ocasional";
  return "frecuente";
}

// === BLOQUES DE RESULTADOS ===
function resultadoDepresion(agent) {
  const p1 = parseInt(agent.parameters.p1_depresion || 0);
  const p2 = parseInt(agent.parameters.p2_depresion || 0);
  const p3 = parseInt(agent.parameters.p3_depresion || 0);
  const p4 = parseInt(agent.parameters.p4_depresion || 0);
  const p5 = parseInt(agent.parameters.p5_depresion || 0);
  const p6 = parseInt(agent.parameters.p6_depresion || 0);
  const p7 = parseInt(agent.parameters.p7_depresion || 0);
  const p8 = parseInt(agent.parameters.p8_depresion || 0);
  const p9 = parseInt(agent.parameters.p9_depresion || 0);

  const total = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
  let nivel = '';

  if (total <= 4) {
    nivel = 'Depresión mínima o nula';
  } else if (total <= 9) {
    nivel = 'Depresión leve';
  } else if (total <= 14) {
    nivel = 'Depresión moderada';
  } else if (total <= 19) {
    nivel = 'Depresión moderadamente severa';
  } else {
    nivel = 'Depresión severa';
  }

  // Guarda el total en el contexto para usarlo después
  agent.context.set({
    name: 'contexto_depresion',
    lifespan: 50,
    parameters: { total }
  });

  agent.add(`✅ Resultado del test de depresión (PHQ-9):\n\n🔢 Puntaje total: ${total}\n📊 Nivel: ${nivel}`);
}

function resultadoAnsiedad(agent) {
  const total = calcularPuntajeBloque(agent, [
    'p1_ansiedad','p2_ansiedad','p3_ansiedad',
    'p4_ansiedad','p5_ansiedad','p6_ansiedad','p7_ansiedad'
  ], 'contexto_ansiedad');
  agent.add(`Puntaje en ansiedad: ${total} - Nivel: ${interpretarAnsiedad(total)}.`);
}

function resultadoEstres(agent) {
  const total = calcularPuntajeBloque(agent, [
    'p1_estres','p2_estres','p3_estres',
    'p4_estres','p5_estres','p6_estres'
  ], 'contexto_estres');
  agent.add(`Puntaje en estrés académico: ${total} - Nivel: ${interpretarEstres(total)}.`);
}

function resultadoAutoestima(agent) {
  const total = calcularPuntajeBloque(agent, [
    'p1_autoestima','p2_autoestima','p3_autoestima',
    'p4_autoestima','p5_autoestima','p6_autoestima'
  ], 'contexto_autoestima');
  agent.add(`Puntaje en autoestima: ${total} - Nivel: ${interpretarAutoestima(total)}.`);
}

function resultadoAcoso(agent) {
  const total = calcularPuntajeBloque(agent, [
    'p1_acoso','p2_acoso','p3_acoso',
    'p4_acoso','p5_acoso','p6_acoso'
  ], 'contexto_acoso');
  agent.add(`Puntaje en acoso escolar: ${total} - Nivel: ${interpretarAcoso(total)}.`);
}

// === RESUMEN FINAL ===
function resultadoFinal(agent) {
  const depresion = agent.getContext('contexto_depresion')?.parameters?.total || 0;
  const ansiedad = agent.getContext('contexto_ansiedad')?.parameters?.total || 0;
  const estres = agent.getContext('contexto_estres')?.parameters?.total || 0;
  const autoestima = agent.getContext('contexto_autoestima')?.parameters?.total || 0;
  const acoso = agent.getContext('contexto_acoso')?.parameters?.total || 0;

  const resumen = `
📝 *Resumen de diagnóstico*:
🔹 Depresión: ${depresion} - Nivel: ${interpretarDepresion(depresion)}
🔹 Ansiedad: ${ansiedad} - Nivel: ${interpretarAnsiedad(ansiedad)}
🔹 Estrés académico: ${estres} - Nivel: ${interpretarEstres(estres)}
🔹 Autoestima: ${autoestima} - Nivel: ${interpretarAutoestima(autoestima)}
🔹 Acoso escolar: ${acoso} - Nivel: ${interpretarAcoso(acoso)}
`;

  agent.add(resumen);
  agent.add("Gracias por completar el diagnóstico. Este resultado puede ser revisado por un especialista.");
}

// === INTENT MAP ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('🧠 Webhook recibido');

  let intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('resultado_depresión', resultadoDepresion);
  intentMap.set('resultado_ansiedad', resultadoAnsiedad);
  intentMap.set('resultado_estres', resultadoEstres);
  intentMap.set('resultado_autoestima', resultadoAutoestima);
  intentMap.set('resultado_acoso', resultadoAcoso);
  intentMap.set('resultado_final', resultadoFinal);

  agent.handleRequest(intentMap);
});

// === INICIO DE SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
});







