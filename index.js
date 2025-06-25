const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
process.env.DEBUG = 'dialogflow:debug';
const port = process.env.PORT || 3000;

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

function inicioDiagnostico(agent) {
  const context = agent.getContext('contexto_datos_alumno');
  const datos = context?.parameters || {};

  const mensaje = agent.query.trim().toLowerCase();

  // Paso 1: Nombre
  if (!datos.nombre) {
    agent.setContext({
      name: 'contexto_datos_alumno',
      lifespan: 50,
      parameters: { nombre: mensaje }
    });
    agent.add("¿Cuál es tu Nombre?");
    return;
  }

  // Paso 2: Edad
  if (!datos.edad) {
    const edad = parseInt(mensaje);
    if (isNaN(edad) || edad < 5 || edad > 100) {
      agent.add("Por favor ingresa una edad válida.");
      return;
    }

    agent.setContext({
      name: 'contexto_datos_alumno',
      lifespan: 50,
      parameters: { ...datos, edad }
    });
    agent.add("¿Cuál es el número de celular de tu apoderado?");
    return;
  }

  // Paso 3: Celular
  if (!datos.celular_apoderado) {
    if (!/^\d{9}$/.test(mensaje)) {
      agent.add("Por favor ingresa un número de celular válido (9 dígitos).");
      return;
    }

    agent.setContext({
      name: 'contexto_datos_alumno',
      lifespan: 50,
      parameters: { ...datos, celular_apoderado: mensaje }
    });

    agent.add(`✅ Datos registrados:
• Nombre: ${datos.nombre}
• Edad: ${datos.edad}
• Celular del apoderado: ${mensaje}
\n¿Deseas comenzar con la evaluación de depresión? (Responde: sí / no)`);
    return;
  }

  // Confirmación
  if (mensaje === 'sí' || mensaje === 'si') {
    respuestasDepresion = [];

    agent.setContext({
      name: 'contexto_pregunta_depresion',
      lifespan: 10,
      parameters: { index: 0 }
    });

    agent.setContext({
      name: 'contexto_depresion_inicio',
      lifespan: 5
    });

    const primera = preguntasDepresion[0];
    agent.add("🧠 *Evaluación de Depresión (PHQ-9)*");
    agent.add(`PRIMERA PREGUNTA:\n${primera}\n(Responde del 0 al 3)\n\n0 = Nada en absoluto\n1 = Varios días\n2 = Más de la mitad de los días\n3 = Casi todos los días`);
  } else {
    agent.add("Está bien. Puedes comenzar la evaluación cuando estés listo diciendo 'inicio'.");
  }
}

function bloqueDepresion(agent) {
  const context = agent.getContext('contexto_pregunta_depresion');
  let index = context?.parameters?.index || 0;
  const respuesta = parseInt(agent.query.trim());

  if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
    agent.add("⚠️ Responde con un número entre 0 y 3.");
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

    const nuevaPregunta = preguntasDepresion[index];
    agent.add(`PREGUNTA ${index + 1}:\n${nuevaPregunta}\n(Responde del 0 al 3)`);
  } else {
    const total = respuestasDepresion.reduce((a, b) => a + b, 0);
    const nivel = interpretarDepresion(total);
    const alumno = agent.getContext('contexto_datos_alumno')?.parameters || {};

    agent.add(`✅ *Resultado del test PHQ-9:*
👤 Nombre: ${alumno.nombre}
🎂 Edad: ${alumno.edad}
📞 Apoderado: ${alumno.celular_apoderado}
📊 Puntaje total: *${total}*
🧠 Nivel de depresión: *${nivel}*`);

    agent.setContext({
      name: 'contexto_depresion',
      lifespan: 10,
      parameters: { total }
    });

    agent.add("¿Deseas continuar con la evaluación de ansiedad? (Responde: sí / no)");
    agent.setContext({
      name: 'contexto_ansiedad_inicio',
      lifespan: 5
    });
  }
}

app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('✅ Webhook recibido');

  const intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('bloque_depresion', bloqueDepresion);

  agent.handleRequest(intentMap);
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});















