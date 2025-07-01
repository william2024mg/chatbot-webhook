const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// Guardar sesión de usuario
let sesiones = {};

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

app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  const queryText = req.body.queryResult.queryText;
  const sessionId = req.body.session;

  console.log('✅ Webhook recibido');
  let mensajes = [];

  // Si el usuario escribe "inicio"
  if (queryText.toLowerCase() === 'inicio') {
    sesiones[sessionId] = {
      paso: 'nombre',
      datos: {},
      respuestas: [],
      index: 0
    };
    mensajes.push("🧠 Bienvenido al diagnóstico de salud mental.");
    mensajes.push("Por favor, dime tu *nombre*:");
  }

  // Si el intent es captura_texto_general
  else if (req.body.queryResult.intent.displayName === 'captura_texto_general') {
    const estado = sesiones[sessionId];

    if (!estado) {
      mensajes.push("❗ Escribe 'inicio' para comenzar el diagnóstico.");
    } else if (estado.paso === 'nombre') {
      estado.datos.nombre = queryText;
      estado.paso = 'edad';
      mensajes.push("✅ Gracias. Ahora dime tu *edad*:");
    } else if (estado.paso === 'edad') {
      const edadNum = parseInt(queryText);
      if (isNaN(edadNum)) {
        mensajes.push("⚠️ Edad no válida. Intenta nuevamente:");
      } else {
        estado.datos.edad = edadNum;
        estado.paso = 'celular';
        mensajes.push("📱 Ingresa el *celular del apoderado* (9 dígitos):");
      }
    } else if (estado.paso === 'celular') {
      if (!/^\d{9}$/.test(queryText)) {
        mensajes.push("⚠️ Ingresa un número válido de 9 dígitos.");
      } else {
        estado.datos.celular = queryText;
        estado.paso = 'depresion';
        estado.index = 0;
        estado.respuestas = [];
        mensajes.push(`✅ Datos guardados:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}`);
        mensajes.push("🧠 Empezamos con el test PHQ-9 de depresión.");
        mensajes.push(`${preguntasDepresion[0]} (Responde con un número del 0 al 3)`);
      }
    } else if (estado.paso === 'depresion') {
      const r = parseInt(queryText);
      if (isNaN(r) || r < 0 || r > 3) {
        mensajes.push("⚠️ Responde con un número del 0 al 3.");
      } else {
        estado.respuestas.push(r);
        estado.index++;
        if (estado.index < preguntasDepresion.length) {
          mensajes.push(`${preguntasDepresion[estado.index]} (0 al 3)`);
        } else {
          const total = estado.respuestas.reduce((a, b) => a + b, 0);
          const nivel = interpretarDepresion(total);
          mensajes.push(`✅ Resultado de la prueba PHQ-9:\n👤 ${estado.datos.nombre}\n🎂 Edad: ${estado.datos.edad}\n📞 Apoderado: ${estado.datos.celular}`);
          mensajes.push(`📊 Puntaje: *${total}*\n🔎 Nivel de depresión: *${nivel}*`);
          mensajes.push("¿Deseas continuar con el bloque de ansiedad? (sí / no)");
          estado.paso = 'fin';
        }
      }
    } else {
      mensajes.push("❗ Escribe 'inicio' para comenzar un nuevo diagnóstico.");
    }
  } else {
    mensajes.push("❓ No entendí. Escribe 'inicio' para empezar.");
  }

  // Devolver los mensajes acumulados
  agent.add(mensajes.join('\n\n'));
  return agent.handleRequest(new Map());
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});


























