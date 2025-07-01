const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

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

const sesiones = {};

app.post('/webhook', (req, res) => {
  console.log("✅ Webhook recibido");

  const sessionId = req.body.session;
  const queryText = req.body.queryResult.queryText?.toLowerCase();
  const intent = req.body.queryResult.intent.displayName;

// Si el intent es 'captura_texto_general', ignoramos su nombre y dejamos pasar el texto del usuario según el flujo
const textoUsuario = req.body.queryResult.queryText?.toLowerCase();
const esGenerico = intent === 'captura_texto_general';

  if (!sesiones[sessionId]) {
    sesiones[sessionId] = {
      paso: 'inicio',
      datos: {},
      respuestas: [],
      index: 0
    };
  }

  const estado = sesiones[sessionId];
  const mensajes = [];

  // === INICIO ===
  if (textoUsuario === 'inicio' || intent === 'inicio_diagnostico') {
    sesiones[sessionId] = {
      paso: 'nombre',
      datos: {},
      respuestas: [],
      index: 0
    };
    mensajes.push("🧠 Bienvenido al diagnóstico de salud mental.");
    mensajes.push("Por favor, dime tu *nombre*:");
  }

  // === NOMBRE ===
  else if (estado.paso === 'nombre' && (esGenerico || intent === 'captura_texto_general')) {
    estado.datos.nombre = queryText;
    estado.paso = 'edad';
    mensajes.push("✅ Gracias. Ahora dime tu *edad*:");
  }

  // === EDAD ===
 else if (estado.paso === 'edad' && (esGenerico || intent === 'captura_texto_general')) {
    const edadNum = parseInt(queryText);
    if (isNaN(edadNum)) {
      mensajes.push("⚠️ Por favor, escribe una edad válida.");
    } else {
      estado.datos.edad = edadNum;
      estado.paso = 'celular';
      mensajes.push("📱 Ahora, ingresa el *celular del apoderado* (9 dígitos):");
    }
  }

  // === CELULAR ===
  else if (estado.paso === 'celular' && (esGenerico || intent === 'captura_texto_general')) {
    if (!/^\d{9}$/.test(queryText)) {
      mensajes.push("⚠️ El número debe tener 9 dígitos. Intenta otra vez:");
    } else {
      estado.datos.celular = queryText;
      estado.paso = 'depresion';
      estado.index = 0;
      estado.respuestas = [];
      mensajes.push(`✅ Datos guardados:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}`);
      mensajes.push("🧠 Iniciamos con la prueba PHQ-9 de depresión.");
      mensajes.push(`PRIMERA PREGUNTA:\n${preguntasDepresion[0]}\n(Responde con un número del 0 al 3)`);
    }
  }

  // === PREGUNTAS DE DEPRESIÓN ===
  else if (estado.paso === 'depresion' && (esGenerico || intent === 'captura_texto_general')) {
    const respuesta = parseInt(queryText);
    if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
      mensajes.push("⚠️ Responde solo con un número del 0 al 3.");
    } else {
      estado.respuestas.push(respuesta);
      estado.index++;

      if (estado.index < preguntasDepresion.length) {
        mensajes.push(`${preguntasDepresion[estado.index]}\n(Responde con un número del 0 al 3)`);
      } else {
        const total = estado.respuestas.reduce((a, b) => a + b, 0);
        const nivel = interpretarDepresion(total);
        mensajes.push(`🧠 Resultado PHQ-9:\n👤 Nombre: ${estado.datos.nombre}\n🎂 Edad: ${estado.datos.edad}\n📞 Apoderado: ${estado.datos.celular}`);
        mensajes.push(`📊 Puntaje total: *${total}*`);
        mensajes.push(`🔎 Nivel de depresión: *${nivel}*`);
        mensajes.push("¿Deseas continuar con el bloque de ansiedad? (sí / no)");
        estado.paso = 'fin';
      }
    }
  }

  // === RESPUESTA POR DEFECTO ===
  else {
    mensajes.push("⚠️ No entendí. Escribe 'inicio' para comenzar de nuevo.");
  }

  // Enviar respuesta a Dialogflow
  res.json({
    fulfillmentMessages: mensajes.map(text => ({ text: { text: [text] } }))
  });
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});































