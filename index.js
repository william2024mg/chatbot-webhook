// === DEPENDENCIAS ===
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
const port = process.env.PORT || 3000;
process.env.DEBUG = 'dialogflow:debug';

app.use(bodyParser.json());

// === VARIABLES GLOBALES POR SESIÓN ===
let sesiones = {}; // Objeto para almacenar info por sesión

// === INTERPRETACIÓN DE PUNTAJE DE DEPRESIÓN ===
function interpretarDepresion(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  if (p <= 19) return "moderadamente severa";
  return "severa";
}

// === INICIO DEL DIAGNÓSTICO ===
function inicioDiagnostico(agent) {
  const sessionId = agent.session.split('/').pop();

  // Limpiar toda la información previa
  sesiones[sessionId] = {
    respuestasDepresion: [],
    datosAlumno: {
      nombre: null,
      edad: null,
      celular_apoderado: null
    },
    index: 0
  };

  agent.setContext({
    name: 'contexto_datos_alumno_solicitud',
    lifespan: 5
  });

  agent.add("👋 Hola, empecemos con el diagnóstico.\n\nPor favor, dime tu *nombre*:");
}

// === RECOLECTAR DATOS DEL ALUMNO ===
function recolectarDatosAlumno(agent) {
  const sessionId = agent.session.split('/').pop();
  const input = agent.query;
  const sesion = sesiones[sessionId];

  if (!sesion) {
    agent.add("❌ No se pudo continuar. Por favor escribe 'inicio' para empezar nuevamente.");
    return;
  }

  const datos = sesion.datosAlumno;

  if (!datos.nombre) {
    datos.nombre = input;
    agent.add("✅ Gracias. Ahora dime tu *edad*:");
    return;
  }

  if (!datos.edad) {
    const edadNum = parseInt(input);
    if (isNaN(edadNum) || edadNum < 5 || edadNum > 120) {
      agent.add("⚠️ Por favor ingresa una edad válida:");
      return;
    }
    datos.edad = edadNum;
    agent.add("Perfecto. Ahora ingresa el *celular del apoderado*:");
    return;
  }

  if (!datos.celular_apoderado) {
    if (!/^\d{9}$/.test(input)) {
      agent.add("⚠️ Por favor, ingresa un número válido de 9 dígitos:");
      return;
    }
    datos.celular_apoderado = input;

    agent.add(`✅ *Datos registrados:*
• Nombre: ${datos.nombre}
• Edad: ${datos.edad}
• Celular Apoderado: ${datos.celular_apoderado}`);

    agent.add("\n¿Deseas comenzar con la evaluación de depresión? (Responde: *sí* o *no*)");

    agent.setContext({
      name: 'contexto_confirmar_depresion',
      lifespan: 5
    });

    return;
  }
}

// === BLOQUE DE DEPRESIÓN ===
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

function bloqueDepresion(agent) {
  const sessionId = agent.session.split('/').pop();
  const sesion = sesiones[sessionId];

  if (!sesion) {
    agent.add("❌ No se encontró tu sesión. Escribe 'inicio' para comenzar.");
    return;
  }

  const respuesta = parseInt(agent.query);
  if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
    agent.add("⚠️ Por favor responde con un número del 0 al 3.");
    return;
  }

  sesion.respuestasDepresion.push(respuesta);
  sesion.index++;

  if (sesion.index < preguntasDepresion.length) {
    const pregunta = preguntasDepresion[sesion.index];
    agent.add(`📍 *Pregunta ${sesion.index + 1}*:\n${pregunta}\n\n(Responde del 0 al 3)`);
  } else {
    const total = sesion.respuestasDepresion.reduce((a, b) => a + b, 0);
    const nivel = interpretarDepresion(total);
    const alumno = sesion.datosAlumno;

    agent.add(`✅ *Resultado PHQ-9:*
👤 Nombre: ${alumno.nombre}
🎂 Edad: ${alumno.edad}
📞 Apoderado: ${alumno.celular_apoderado}
📊 Puntaje: *${total}*
🧠 Nivel de depresión: *${nivel}*`);

    agent.add("¿Deseas continuar con el siguiente bloque (ansiedad)? (sí / no)");
  }
}

// === CONFIGURAR INTENTS ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log("✅ Webhook recibido");

  const intentMap = new Map();
  intentMap.set("inicio_diagnostico", inicioDiagnostico);
  intentMap.set("recolectar_datos_alumno", recolectarDatosAlumno);
  intentMap.set("bloque_depresion", bloqueDepresion);

  agent.handleRequest(intentMap);
});

// === INICIAR SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});


















