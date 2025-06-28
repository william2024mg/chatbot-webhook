const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

let respuestasDepresion = [];

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
  respuestasDepresion = [];
  agent.clearOutgoingContexts();

  agent.setContext({ name: 'contexto_datos_alumno_solicitud', lifespan: 5 });
  agent.add("🧠 Bienvenido al diagnóstico de salud mental. Vamos a empezar recolectando algunos datos.");
}

// === INTENT: RECOLECTAR_DATOS_ALUMNO ===
function recolectarDatosAlumno(agent) {
  const input = agent.query.trim();
  const contexto = agent.getContext('contexto_datos_alumno')?.parameters || {};
  let datos = { ...contexto };

  if (!datos.nombre) {
    datos.nombre = input;
    agent.setContext({ name: 'contexto_datos_alumno', lifespan: 50, parameters: datos });
    agent.add("✅ Gracias. Ahora dime tu *edad*:");
    return;
  }

  if (!datos.edad) {
    const edadNum = parseInt(input);
    if (isNaN(edadNum)) {
      agent.add("⚠️ Ingresa una edad válida (número).");
      return;
    }
    datos.edad = edadNum;
    agent.setContext({ name: 'contexto_datos_alumno', lifespan: 50, parameters: datos });
    agent.add("📱 Ahora, ingresa el *celular del apoderado*:");
    return;
  }

  if (!datos.celular_apoderado) {
    if (!/^\d{9}$/.test(input)) {
      agent.add("⚠️ El número debe tener 9 dígitos.");
      return;
    }
    datos.celular_apoderado = input;
    agent.setContext({ name: 'contexto_datos_alumno', lifespan: 50, parameters: datos });

    // Inicializa bloque_depresion
    agent.setContext({
      name: 'contexto_pregunta_depresion',
      lifespan: 10,
      parameters: {
        index: 0,
        respuestas: []
      }
    });

    const pregunta = preguntasDepresion[0];
    agent.add(`✅ Datos guardados:\n👤 ${datos.nombre}\n🎂 ${datos.edad}\n📞 ${datos.celular_apoderado}`);
    agent.add("Iniciamos con la prueba PHQ-9 de depresión.");
    agent.add(`PRIMERA PREGUNTA:\n${pregunta}\n(Responde del 0 al 3)`);
    return;
  }

  agent.add("⚠️ Algo falló. Escribe 'inicio' para comenzar de nuevo.");
}

// === INTENT: BLOQUE_DEPRESION ===
function bloqueDepresion(agent) {
  const context = agent.getContext('contexto_pregunta_depresion');
  let index = context?.parameters?.index || 0;
  const respuesta = parseInt(agent.query);

  if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
    agent.add("⚠️ Por favor responde con un número del 0 al 3.");
    return;
  }

  let respuestas = context?.parameters?.respuestas || [];
  respuestas.push(respuesta);

  if (index < preguntasDepresion.length - 1) {
    index++;
    agent.setContext({
      name: 'contexto_pregunta_depresion',
      lifespan: 10,
      parameters: { index, respuestas }
    });
    agent.add(`${preguntasDepresion[index]}\n(Responde con un número del 0 al 3)`);
  } else {
    const total = respuestas.reduce((a, b) => a + b, 0);
    const nivel = interpretarDepresion(total);
    const alumno = agent.getContext('contexto_datos_alumno')?.parameters || {};

    agent.setContext({
      name: 'contexto_resultado_depresion',
      lifespan: 5,
      parameters: {
        respuestas,
        total,
        nivel
      }
    });

    agent.add(`✅ Finalizamos la evaluación de depresión.\n¿Deseas ver tu resultado? (sí / no)`);
  }
}

// === INTENT: RESULTADO_DEPRESION ===
function resultadoDepresion(agent) {
  const ctx = agent.getContext('contexto_resultado_depresion');
  const alumno = agent.getContext('contexto_datos_alumno')?.parameters || {};
  const total = ctx?.parameters?.total || 0;
  const nivel = ctx?.parameters?.nivel || "desconocido";

  agent.add(`🧠 Resultado PHQ-9:\n👤 Nombre: ${alumno.nombre || 'N/D'}\n🎂 Edad: ${alumno.edad || 'N/D'}\n📞 Apoderado: ${alumno.celular_apoderado || 'N/D'}\n📊 Puntaje: *${total}*\n🔎 Nivel de depresión: *${nivel}*`);
  agent.add("¿Deseas continuar con el bloque de ansiedad?");
}

// === WEBHOOK ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('✅ Webhook recibido');

  const intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('recolectar_datos_alumno', recolectarDatosAlumno);
  intentMap.set('bloque_depresion', bloqueDepresion);
  intentMap.set('resultado_depresion', resultadoDepresion);

  agent.handleRequest(intentMap);
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});




















