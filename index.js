// === DEPENDENCIAS ===
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

process.env.DEBUG = 'dialogflow:debug';
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

let respuestasDepresion = [];

// === FUNCIONES GENERALES ===
function inicioDiagnostico(agent) {
  const { nombre, edad, celular_apoderado } = agent.parameters;
  agent.context.set({
    name: 'contexto_datos_alumno',
    lifespan: 50,
    parameters: { nombre, edad, celular_apoderado }
  });
  agent.add(`✅ Datos registrados:\n• Nombre: ${nombre}\n• Edad: ${edad}\n• Celular del apoderado: ${celular_apoderado}\n\nEmpecemos con la evaluación. 🧠`);
  agent.setContext({ name: 'contexto_depresion_inicio', lifespan: 5 });
}

function interpretarDepresion(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  if (p <= 19) return "moderadamente severa";
  return "severa";
}

function bloqueDepresion(agent) {
  if (!agent.context.get('conteo_preguntas_depresion')) {
    agent.context.set({
      name: 'conteo_preguntas_depresion',
      lifespan: 10,
      parameters: { index: 0 }
    });
    respuestasDepresion = [];
    agent.add("🧠 *Evaluación de Depresión (PHQ-9)*\n\nPRIMERA PREGUNTA:\n¿Poco interés o placer en hacer cosas?\n(Responde con un número del 0 al 3)\n\n0 = Nada en absoluto\n1 = Varios días\n2 = Más de la mitad de los días\n3 = Casi todos los días");
    return;
  }

  const index = agent.context.get('conteo_preguntas_depresion').parameters.index;
  const respuesta = parseInt(agent.query);

  if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
    agent.add("Por favor responde con un número entre 0 y 3.");
    return;
  }

  respuestasDepresion.push(respuesta);

  const preguntas = [
    "¿Poco interés o placer en hacer cosas?",
    "¿Te has sentido decaído, deprimido o sin esperanza?",
    "¿Dificultad para quedarte dormido, o dormir demasiado?",
    "¿Te has sentido cansado o con poca energía?",
    "¿Poca autoestima, o te has sentido inútil o fracasado?",
    "¿Dificultad para concentrarte en cosas como leer o ver televisión?",
    "¿Te has movido o hablado tan lento que otras personas lo notaron?",
    "¿Has tenido pensamientos de que estarías mejor muerto o de hacerte daño?",
    "¿Qué tan difícil han hecho estos problemas tu vida diaria?"
  ];

  if (index < preguntas.length - 1) {
    const nuevaPregunta = preguntas[index + 1];
    agent.context.set({
      name: 'conteo_preguntas_depresion',
      lifespan: 10,
      parameters: { index: index + 1 }
    });
    agent.add(`SIGUIENTE PREGUNTA:\n${nuevaPregunta}\n(Responde del 0 al 3)`);
  } else {
    const total = respuestasDepresion.reduce((a, b) => a + b, 0);
    const nivel = interpretarDepresion(total);

    const datosAlumno = agent.context.get('contexto_datos_alumno')?.parameters || {};
    const nombre = datosAlumno.nombre || "Alumno";
    const edad = datosAlumno.edad || "N/D";
    const celular = datosAlumno.celular_apoderado || "N/D";

    agent.add(`✅ *Diagnóstico de Depresión (PHQ-9)*\n\n👤 Nombre: ${nombre}\n🎂 Edad: ${edad}\n📞 Celular apoderado: ${celular}\n📊 Puntaje total: ${total}\n🧠 Nivel: *${nivel}*`);

    agent.setContext({
      name: 'contexto_depresion',
      lifespan: 5,
      parameters: { total }
    });

    agent.setContext({
      name: 'contexto_ansiedad_inicio',
      lifespan: 5
    });
  }
}

// === INTENT MAP ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('🧠 Webhook recibido');

  let intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('bloque_depresion', bloqueDepresion);

  agent.handleRequest(intentMap);
});

// === INICIO DE SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
});








