const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// ========================== DEPRESION ==========================
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
function limpiarHTML(texto) {
  return texto.replace(/<\/?[^>]+(>|$)/g, "");
}

// ========================== ANSIEDAD (GAD-7) ==========================

const preguntasAnsiedad = [
  "¿Te has sentido nervioso, ansioso o al borde?",
  "¿No has podido parar o controlar tu preocupación?",
  "¿Te has preocupado demasiado por diferentes cosas?",
  "¿Has tenido dificultad para relajarte?",
  "¿Te has sentido tan inquieto que te cuesta estar quieto?",
  "¿Te has irritado fácilmente o te has molestado con frecuencia?",
  "¿Has sentido miedo como si algo terrible pudiera pasar?"
];

function interpretarAnsiedad(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  return "severa";
}

// ========================== ESTRESORES ACADÉMICOS (SISCO) ==========================

const preguntasEstres = [
  "¿Tienes muchos trabajos escolares al mismo tiempo?",
  "¿Los exámenes te generan mucha presión?",
  "¿Los profesores te dejan demasiadas tareas?",
  "¿Tienes poco tiempo para cumplir con tus obligaciones académicas?",
  "¿Te estresas por no entender algunos temas?",
  "¿Te sientes presionado por obtener buenas calificaciones?",
  "¿Los trabajos en grupo te generan estrés?",
  "¿Tienes dificultades para organizar tus tiempos de estudio?",
  "¿Sientes que la carga académica supera tu capacidad?"
];

function interpretarEstres(p) {
  if (p <= 17) return "bajo";
  if (p <= 26) return "medio";
  if (p <= 35) return "alto";
  return "muy alto";
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
  const texto = limpiarHTML(queryText);
  if (/^\d+$/.test(texto)) {
    mensajes.push("⚠️ Por favor, ingresa tu *nombre*, no un número.");
  } else {
    estado.datos.nombre = texto;
    estado.paso = 'edad';
    mensajes.push("✅ Gracias. Ahora dime tu *edad*:");
  }
}

  // === EDAD ===
else if (estado.paso === 'edad' && (esGenerico || intent === 'captura_texto_general')) {
  const edadNum = parseInt(limpiarHTML(queryText));
  if (isNaN(edadNum) || edadNum < 6 || edadNum > 22) {
    mensajes.push("⚠️ Por favor, ingresa una edad válida entre 6 y 22 años.");
  } else {
    estado.datos.edad = edadNum;
    estado.paso = 'celular';
    mensajes.push("📱 Ahora, ingresa el *celular del apoderado* (9 dígitos):");
  }
}

// === CELULAR ===
else if (estado.paso === 'celular' && (esGenerico || intent === 'captura_texto_general')) {
  const celular = limpiarHTML(queryText).replace(/\D/g, ''); // solo números
  if (celular.length !== 9) {
    mensajes.push("⚠️ El número debe tener exactamente 9 dígitos. Intenta otra vez:");
  } else {
    estado.datos.celular = celular;
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
    
 // === PREGUNTAS DE ANSIEDAD ===
    else if (estado.paso === 'ansiedad' && (esGenerico || intent === 'captura_texto_general')) {
  const respuesta = parseInt(textoUsuario);
  if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
    mensajes.push("⚠️ Responde solo con un número del 0 al 3.");
  } else {
    estado.respuestas.push(respuesta);
    estado.index++;

    if (estado.index < preguntasAnsiedad.length) {
      mensajes.push(`${preguntasAnsiedad[estado.index]}\n(Responde con un número del 0 al 3)`);
    } else {
      const total = estado.respuestas.reduce((a, b) => a + b, 0);
      const nivel = interpretarAnsiedad(total);
      mensajes.push(`🧠 Resultado GAD-7:\n👤 Nombre: ${estado.datos.nombre}\n🎂 Edad: ${estado.datos.edad}\n📞 Apoderado: ${estado.datos.celular}`);
      mensajes.push(`📊 Puntaje total: *${total}*`);
      mensajes.push(`🔎 Nivel de ansiedad: *${nivel}*`);
      mensajes.push("¿Deseas continuar con el bloque de estrés académico? (sí / no)");
      estado.paso = 'fin_ansiedad';
    }
  }
}

// === PREGUNTAS DE ESTRESORES ACADÉMICOS ===
else if (estado.paso === 'estres' && (esGenerico || intent === 'captura_texto_general')) {
  const respuesta = parseInt(textoUsuario);
  if (isNaN(respuesta) || respuesta < 1 || respuesta > 5) {
    mensajes.push("⚠️ Responde solo con un número del 1 al 5 (1 = Nunca, 2 = rara vez, 3 = algunas veces, 4 = casi siempre, 5 = Siempre).");
  } else {
    estado.respuestas.push(respuesta);
    estado.index++;

    if (estado.index < preguntasEstres.length) {
      mensajes.push(`${preguntasEstres[estado.index]}\n(Responde con un número del 1 al 5)`);
    } else {
      const total = estado.respuestas.reduce((a, b) => a + b, 0);
      const nivel = interpretarEstres(total);
      mensajes.push(`📚 Resultado de *Estresores Académicos* (Inventario SISCO):`);
      mensajes.push(`👤 Nombre: ${estado.datos.nombre}`);
      mensajes.push(`🎂 Edad: ${estado.datos.edad}`);
      mensajes.push(`📞 Apoderado: ${estado.datos.celular}`);
      mensajes.push(`📊 Puntaje total: *${total}*`);
      mensajes.push(`🔎 Nivel de estrés académico: *${nivel}*`);
      mensajes.push("¿Deseas continuar con el siguiente bloque? (sí / no)");
      estado.paso = 'fin_estres';
    }
  }
}
    

// === RESPUESTA POR DEFECTO ===

else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin') {
  estado.paso = 'ansiedad';
  estado.index = 0;
  estado.respuestas = [];
  mensajes.push("🧠 Iniciamos con la prueba GAD-7 de ansiedad.");
  mensajes.push(`PRIMERA PREGUNTA:\n${preguntasAnsiedad[0]}\n(Responde con un número del 0 al 3)`);
}

else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_ansiedad') {
  estado.paso = 'estres';
  estado.index = 0;
  estado.respuestas = [];
  mensajes.push("📚 Iniciamos con la prueba de *estrés académico* (Inventario SISCO).");
  mensajes.push(`PRIMERA PREGUNTA:\n${preguntasEstres[0]}\n(Responde con un número del 1 al 5, donde 1 = Nunca, 2 = rara vez, 3 = algunas veces, 4 = casi siempre, 5 = Siempre)`);
}


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































