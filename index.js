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
function resultadoDepresion(agent) {
  const context = agent.getContext('contexto_resultado_depresion');

  // Extraer todos los valores desde los contextos acumulados
  const p1 = parseInt(context?.parameters?.p1_depresion || 0);
  const p2 = parseInt(context?.parameters?.p2_depresion || 0);
  const p3 = parseInt(context?.parameters?.p3_depresion || 0);
  const p4 = parseInt(context?.parameters?.p4_depresion || 0);
  const p5 = parseInt(context?.parameters?.p5_depresion || 0);
  const p6 = parseInt(context?.parameters?.p6_depresion || 0);
  const p7 = parseInt(context?.parameters?.p7_depresion || 0);
  const p8 = parseInt(context?.parameters?.p8_depresion || 0);
  const p9 = parseInt(context?.parameters?.p9_depresion || 0);
agent.add("Gracias por tus respuestas. Ahora voy a calcular tus resultados. Un momento por favor...");
agent.setContext({
  name: 'contexto_resultado_depresion',
  lifespan: 1,
  parameters: {
    p1_depresion: agent.context.get('contexto_pregunta1_depresion')?.parameters?.p1_depresion || 0,
    p2_depresion: agent.context.get('contexto_pregunta2_depresion')?.parameters?.p2_depresion || 0,
    p3_depresion: agent.context.get('contexto_pregunta3_depresion')?.parameters?.p3_depresion || 0,
    p4_depresion: agent.context.get('contexto_pregunta4_depresion')?.parameters?.p4_depresion || 0,
    p5_depresion: agent.context.get('contexto_pregunta5_depresion')?.parameters?.p5_depresion || 0,
    p6_depresion: agent.context.get('contexto_pregunta6_depresion')?.parameters?.p6_depresion || 0,
    p7_depresion: agent.context.get('contexto_pregunta7_depresion')?.parameters?.p7_depresion || 0,
    p8_depresion: agent.context.get('contexto_pregunta8_depresion')?.parameters?.p8_depresion || 0,
    p9_depresion: agent.parameters.p9_depresion || 0
  }
});
  const total = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;

  let interpretacion = '';
  if (total <= 4) interpretacion = 'Depresión mínima';
  else if (total <= 9) interpretacion = 'Depresión leve';
  else if (total <= 14) interpretacion = 'Depresión moderada';
  else if (total <= 19) interpretacion = 'Depresión moderadamente severa';
  else interpretacion = 'Depresión severa';

  agent.add(`✅ *Resultado del test PHQ-9 (Depresión)*`);
  agent.add(`Puntaje total: *${total}*`);
  agent.add(`Nivel: *${interpretacion}*`);

  // Guardar total en contexto para resumen final
  agent.setContext({
    name: 'contexto_depresion',
    lifespan: 10,
    parameters: { total }
  });

  // Activar siguiente bloque: ansiedad
  agent.add(`¿Deseas continuar con el siguiente bloque sobre *ansiedad*? (Responde: sí / no)`);
  agent.setContext({
    name: 'contexto_ansiedad_inicio',
    lifespan: 5
  });
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








