// === DEPENDENCIAS ===
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();

process.env.DEBUG = 'dialogflow:debug';
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

// === VARIABLES GLOBALES ===
let respuestasDepresion = [];

// === INTERPRETACIÓN ===
function interpretarDepresion(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  if (p <= 19) return "moderadamente severa";
  return "severa";
}

// === INICIO DIAGNÓSTICO ===
function inicioDiagnostico(agent) {
  try {
    // Limpiar todo al iniciar
    respuestasDepresion = [];

    // Limpiar contextos antiguos
    agent.clearOutgoingContexts();

    agent.setContext({
      name: 'contexto_datos_alumno_solicitud',
      lifespan: 5
    });

    agent.add("Vamos a iniciar el diagnóstico. Primero necesito algunos datos.");
    agent.add("¿Cuál es tu nombre?");
  } catch (error) {
    console.error("❌ Error en inicioDiagnostico:", error);
    agent.add("Ocurrió un error al iniciar. Intenta nuevamente.");
  }
}

// === RECOLECTAR DATOS ALUMNO ===
function recolectarDatosAlumno(agent) {
  try {
    const { nombre, edad, celular_apoderado } = agent.parameters || {};

    agent.setContext({
      name: 'contexto_datos_alumno',
      lifespan: 50,
      parameters: { nombre, edad, celular_apoderado }
    });

    // Iniciar índice de preguntas
    respuestasDepresion = [];
    agent.setContext({
      name: 'contexto_pregunta_depresion',
      lifespan: 10,
      parameters: { index: 0 }
    });

    // Activar bloque_depresion
    agent.setContext({
      name: 'contexto_depresion_inicio',
      lifespan: 5
    });

    agent.add(`✅ Datos registrados:
• Nombre: ${nombre}
• Edad: ${edad}
• Celular del apoderado: ${celular_apoderado}

Iniciemos con la evaluación de depresión.`);

    agent.add("🧠 *Evaluación de Depresión (PHQ-9)*\n\nPRIMERA PREGUNTA:\n¿Poco interés o placer en hacer cosas?\n(Responde con un número del 0 al 3)\n\n0 = Nada en absoluto\n1 = Varios días\n2 = Más de la mitad de los días\n3 = Casi todos los días");
  } catch (error) {
    console.error("❌ Error en recolectarDatosAlumno:", error);
    agent.add("Ocurrió un error al registrar tus datos. Intenta nuevamente.");
  }
}

// === PREGUNTAS PHQ-9 ===
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

// === BLOQUE DEPRESIÓN ===
function bloqueDepresion(agent) {
  try {
    const context = agent.getContext('contexto_pregunta_depresion');
    let index = context?.parameters?.index || 0;
    const respuesta = parseInt(agent.query);

    if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
      agent.add("⚠️ Por favor, responde con un número del 0 al 3.");
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
      agent.add(`\n${nuevaPregunta}\n(Responde con un número del 0 al 3)`);
    } else {
      const total = respuestasDepresion.reduce((a, b) => a + b, 0);
      const nivel = interpretarDepresion(total);

      const alumno = agent.getContext('contexto_datos_alumno')?.parameters || {};
      const nombre = alumno.nombre || 'Alumno';
      const edad = alumno.edad || 'N/D';
      const celular = alumno.celular_apoderado || 'N/D';

      agent.add(`✅ *Resultado del test PHQ-9:*\n👤 Nombre: ${nombre}\n🎂 Edad: ${edad}\n📞 Apoderado: ${celular}\n📊 Puntaje: *${total}*\n🧠 Nivel de depresión: *${nivel}*`);

      agent.setContext({
        name: 'contexto_depresion',
        lifespan: 10,
        parameters: { total }
      });

      agent.add("¿Deseas continuar con el siguiente bloque (ansiedad)? (Responde: sí / no)");
      agent.setContext({
        name: 'contexto_ansiedad_inicio',
        lifespan: 5
      });
    }
  } catch (error) {
    console.error("❌ Error en bloqueDepresion:", error);
    agent.add("Ocurrió un error durante la evaluación. Intenta nuevamente.");
  }
}

// === INTENT MAP ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('✅ Webhook recibido');

  if (!agent.requestSource) {
    agent.requestSource = 'PLATFORM_UNSPECIFIED';
  }

  const intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('recolectar_datos_alumno', recolectarDatosAlumno);
  intentMap.set('bloque_depresion', bloqueDepresion);

  agent.handleRequest(intentMap);
});

// === INICIO SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});

















