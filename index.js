const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();

process.env.DEBUG = 'dialogflow:debug';
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

let respuestasDepresion = [];

// Preguntas PHQ-9
const preguntasDepresion = [
  "¿Poco interés o placer en hacer cosas?",
  "¿Te has sentido decaído, deprimido o sin esperanza?",
  "¿Dificultad para dormir, o dormir demasiado?",
  "¿Te has sentido cansado o con poca energía?",
  "¿Poca autoestima o te has sentido inútil o fracasado?",
  "¿Dificultad para concentrarte, como al leer o ver TV?",
  "¿Te has movido o hablado muy lento o muy inquieto?",
  "¿Has tenido pensamientos de hacerte daño o morir?",
  "¿Qué tan difícil han sido estos problemas en tu vida diaria?"
];

function interpretarDepresion(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  if (p <= 19) return "moderadamente severa";
  return "severa";
}

// === INICIO DIAGNÓSTICO ===
function inicioDiagnostico(agent) {
  const context = agent.getContext('contexto_datos_alumno') || {};
  const params = context.parameters || {};
  const textoUsuario = agent.query;

  if (!params.nombre) {
    agent.setContext({ name: 'contexto_datos_alumno', lifespan: 50, parameters: { nombre: textoUsuario } });
    agent.add("¿Cuál es tu edad?");
    return;
  }

  if (!params.edad) {
    const edad = parseInt(textoUsuario);
    if (isNaN(edad)) {
      agent.add("Por favor ingresa tu edad con un número válido.");
      return;
    }
    agent.setContext({ name: 'contexto_datos_alumno', lifespan: 50, parameters: { ...params, edad } });
    agent.add("¿Cuál es el celular del apoderado?");
    return;
  }

  if (!params.celular_apoderado) {
    const celular = textoUsuario;
    if (!/^\d{9}$/.test(celular)) {
      agent.add("Por favor ingresa un número de celular válido (9 dígitos).");
      return;
    }
    agent.setContext({
      name: 'contexto_datos_alumno',
      lifespan: 50,
      parameters: { ...params, celular_apoderado: celular }
    });

    agent.add(`✅ Datos registrados:
• Nombre: ${params.nombre}
• Edad: ${params.edad}
• Celular del apoderado: ${celular}

¿Deseas iniciar la evaluación de depresión? (Responde: sí / no)`);

    agent.setContext({
      name: 'contexto_confirmar_depresion',
      lifespan: 5
    });
    return;
  }

  agent.add("Ya hemos registrado tus datos. ¿Deseas iniciar la evaluación de depresión? (sí / no)");
}

// === CONFIRMAR INICIO DEPRESIÓN ===
function confirmarInicioDepresion(agent) {
  const respuesta = agent.query.toLowerCase();
  if (respuesta === 'sí' || respuesta === 'si') {
    respuestasDepresion = [];
    agent.setContext({
      name: 'contexto_pregunta_depresion',
      lifespan: 10,
      parameters: { index: 0 }
    });

    agent.add("🧠 *Evaluación de Depresión (PHQ-9)*");
    agent.add(`PRIMERA PREGUNTA:\n${preguntasDepresion[0]}\n(Responde con un número del 0 al 3)`);
  } else {
    agent.add("✅ Entendido. Puedes iniciar la evaluación cuando estés listo diciendo 'inicio'.");
  }
}

// === BLOQUE DEPRESIÓN ===
function bloqueDepresion(agent) {
  const context = agent.getContext('contexto_pregunta_depresion');
  let index = context?.parameters?.index || 0;
  const respuesta = parseInt(agent.query);

  if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
    agent.add("⚠️ Por favor responde con un número entre 0 y 3.");
    return;
  }

  respuestasDepresion.push(respuesta);

  if (index < preguntasDepresion.length - 1) {
    index += 1;
    agent.setContext({
      name: 'contexto_pregunta_depresion',
      lifespan: 10,
      parameters: { index }
    });

    agent.add(`${preguntasDepresion[index]}\n(0 = Nada en absoluto, 1 = Varios días, 2 = Más de la mitad de los días, 3 = Casi todos los días)`);
  } else {
    const total = respuestasDepresion.reduce((a, b) => a + b, 0);
    const nivel = interpretarDepresion(total);

    const alumno = agent.getContext('contexto_datos_alumno')?.parameters || {};

    agent.add(`✅ *Resultado del test PHQ-9:*
👤 Nombre: ${alumno.nombre || "Alumno"}
🎂 Edad: ${alumno.edad || "N/D"}
📞 Apoderado: ${alumno.celular_apoderado || "N/D"}
📊 Puntaje total: ${total}
🧠 Nivel de depresión: *${nivel}*`);

    agent.add("¿Deseas continuar con el siguiente bloque (ansiedad)? (Responde: sí / no)");
    agent.setContext({ name: 'contexto_ansiedad_inicio', lifespan: 5 });
  }
}

// === INTENT MAP ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('✅ Webhook recibido');

  const intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('confirmar_inicio_depresion', confirmarInicioDepresion);
  intentMap.set('bloque_depresion', bloqueDepresion);

  agent.handleRequest(intentMap);
});

// === INICIAR SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});
















