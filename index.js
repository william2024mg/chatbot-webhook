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
let datosAlumno = { nombre: null, edad: null, celular_apoderado: null };

// === INTERPRETACIÓN DE RESULTADO ===
function interpretarDepresion(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  if (p <= 19) return "moderadamente severa";
  return "severa";
}

// === INICIO_DIAGNOSTICO ===
function inicioDiagnostico(agent) {
  try {
    // Reiniciar todo
    respuestasDepresion = [];
    datosAlumno = { nombre: null, edad: null, celular_apoderado: null };

    // Limpiar contextos anteriores
    agent.clearOutgoingContexts();

    // Crear contexto nuevo para recolectar los datos
    agent.setContext({
      name: 'contexto_datos_alumno',
      lifespan: 5,
      parameters: {}
    });

    agent.add("📝 Iniciemos con tus datos. ¿Cuál es tu *nombre*?");
    console.log("🟢 inicioDiagnostico llamado");
  } catch (error) {
    console.error("❌ Error en inicioDiagnostico:", error);
    agent.add("Ocurrió un problema al iniciar el diagnóstico.");
  }
}

// === RECOLECCIÓN DE DATOS (nombre, edad, celular) ===
function recolectarDatos(agent) {
  const context = agent.getContext('contexto_datos_alumno');
  const input = agent.query;

  if (!context.parameters.nombre) {
    context.parameters.nombre = input;
    agent.setContext({ ...context, lifespan: 5 });
    agent.add("📅 Gracias. Ahora dime, ¿cuántos años tienes?");
    return;
  }

  if (!context.parameters.edad) {
    const edad = parseInt(input);
    if (isNaN(edad)) {
      agent.add("⚠️ Por favor, indica tu edad como número.");
      return;
    }
    context.parameters.edad = edad;
    agent.setContext({ ...context, lifespan: 5 });
    agent.add("📱 Gracias. Finalmente, ¿cuál es el número de celular de tu apoderado?");
    return;
  }

  if (!context.parameters.celular_apoderado) {
    context.parameters.celular_apoderado = input;
    agent.setContext({ ...context, lifespan: 50 });

    const { nombre, edad, celular_apoderado } = context.parameters;
    datosAlumno = { nombre, edad, celular_apoderado };

    agent.add(`✅ Datos registrados:
• Nombre: ${nombre}
• Edad: ${edad}
• Celular apoderado: ${celular_apoderado}`);

    agent.add("¿Deseas iniciar la evaluación de *depresión* (PHQ-9)? (Responde: sí / no)");

    agent.setContext({
      name: 'contexto_depresion_inicio',
      lifespan: 5
    });

    agent.setContext({
      name: 'contexto_pregunta_depresion',
      lifespan: 5,
      parameters: { index: 0 }
    });

    return;
  }

  agent.add("❌ Hubo un error al registrar tus datos. Intenta de nuevo.");
}

// === BLOQUE DEPRESIÓN ===
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
  try {
    const context = agent.getContext('contexto_pregunta_depresion');
    let index = context?.parameters?.index || 0;
    const respuesta = parseInt(agent.query);

    if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
      agent.add("⚠️ Por favor, responde con un número entre 0 y 3.");
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

      agent.add(`🧠 *Pregunta ${index + 1}*:\n${preguntasDepresion[index]}\n\n(0 = Nada en absoluto, 1 = Varios días, 2 = Más de la mitad de los días, 3 = Casi todos los días)`);
    } else {
      const total = respuestasDepresion.reduce((a, b) => a + b, 0);
      const nivel = interpretarDepresion(total);

      const { nombre, edad, celular_apoderado } = datosAlumno;

      agent.add(`✅ *Resultado del test PHQ-9:*
👤 Nombre: ${nombre}
🎂 Edad: ${edad}
📞 Apoderado: ${celular_apoderado}
📊 Puntaje: *${total}*
🧠 Nivel de depresión: *${nivel}*`);

      agent.add("¿Deseas continuar con el siguiente bloque (ansiedad)? (Responde: sí / no)");
    }
  } catch (error) {
    console.error("❌ Error en bloqueDepresion:", error);
    agent.add("Hubo un error durante la evaluación de depresión.");
  }
}

// === MAPEO DE INTENTS ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('📩 Webhook recibido');

  const intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('recolectar_datos_alumno', recolectarDatos);
  intentMap.set('bloque_depresion', bloqueDepresion);

  agent.handleRequest(intentMap);
});

// === INICIAR SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});

















