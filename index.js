const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
const port = process.env.PORT || 10000;
app.use(bodyParser.json());

// Manejo de estado por sesión
let sesiones = {};

// Preguntas PHQ-9
const preguntasDepresion = [
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

function interpretarDepresion(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  if (p <= 19) return "moderadamente severa";
  return "severa";
}

// === INTENT: INICIO_DIAGNOSTICO ===
function inicioDiagnostico(agent) {
  const sessionId = agent.session;
  sesiones[sessionId] = {
    paso: 'nombre',
    datos: {},
    respuestas: [],
    index: 0
  };

  agent.add("🧠 Bienvenido al diagnóstico de salud mental.");
  agent.add("Por favor, dime tu *nombre*:");
}

// === INTENT: CAPTURA_TEXTO_GENERAL ===
function capturaTexto(agent) {
  const sessionId = agent.session;
  const input = agent.query.trim();
  const estado = sesiones[sessionId];

  if (!estado) {
    agent.add("❗ Por favor escribe 'inicio' para comenzar el diagnóstico.");
    return;
  }

  const paso = estado.paso;

  if (paso === 'nombre') {
    estado.datos.nombre = input;
    estado.paso = 'edad';
    agent.add("✅ Gracias. Ahora dime tu *edad*:");
  }

  else if (paso === 'edad') {
    const edadNum = parseInt(input);
    if (isNaN(edadNum)) {
      agent.add("⚠️ Edad no válida. Intenta nuevamente:");
      return;
    }
    estado.datos.edad = edadNum;
    estado.paso = 'celular';
    agent.add("📱 Ingresa el *celular del apoderado* (9 dígitos):");
  }

  else if (paso === 'celular') {
    if (!/^\d{9}$/.test(input)) {
      agent.add("⚠️ Ingresa un número válido de 9 dígitos.");
      return;
    }
    estado.datos.celular = input;
    estado.paso = 'depresion';
    estado.index = 0;
    estado.respuestas = [];

    agent.add(`✅ Datos guardados:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}`);
    agent.add("🧠 Empezamos con el test PHQ-9 de depresión.");
    agent.add(`${preguntasDepresion[0]} (Responde con un número del 0 al 3)`);
  }

  else if (paso === 'depresion') {
    const r = parseInt(input);
    if (isNaN(r) || r < 0 || r > 3) {
      agent.add("⚠️ Responde con un número del 0 al 3.");
      return;
    }

    estado.respuestas.push(r);
    estado.index++;

    if (estado.index < preguntasDepresion.length) {
      agent.add(`${preguntasDepresion[estado.index]} (0 al 3)`);
    } else {
      const total = estado.respuestas.reduce((a, b) => a + b, 0);
      const nivel = interpretarDepresion(total);

      agent.add(`✅ Finalizamos la evaluación PHQ-9:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}`);
      agent.add(`📊 Puntaje: *${total}*\n🔎 Nivel de depresión: *${nivel}*`);
      agent.add("¿Deseas continuar con el bloque de ansiedad?");
      estado.paso = 'fin';
    }
  }

  else {
    agent.add("❗ Para iniciar de nuevo escribe 'inicio'.");
  }
}

// === INTENT MAP ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('✅ Webhook recibido');

  const intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('captura_texto_general', capturaTexto);

  agent.handleRequest(intentMap);
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});




























