const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// ========================== DEPRESIÓN - ESCALA DE ZUNG (D.D.) ==========================

const preguntasDepresionZung = [
  "Me siento decaído y triste.",
  "Las mañanas son las peores horas para mí.",
  "Lloro o siento ganas de llorar.",
  "Tengo problemas para dormir durante la noche.",
  "Tengo buen apetito.",
  "Disfruto de las cosas igual que antes.",
  "Me cuesta concentrarme.",
  "Me muevo más despacio que antes.",
  "Estoy preocupado por mi apariencia.",
  "Me siento con ganas de llorar o con tristeza en el pecho.",
  "Me cuesta trabajar y hacer mis actividades.",
  "Duermo bien por las noches.",
  "Me siento útil y necesario.",
  "Me siento con energía.",
  "Me siento desesperanzado respecto al futuro.",
  "Estoy más irritable que antes.",
  "Encuentro fácil tomar decisiones.",
  "Me siento valioso y respetado.",
  "Tengo pensamientos de que sería mejor no estar vivo.",
  "Encuentro placer en las cosas."
];

const indicesInvertidosDepresionZung = [4, 5, 11, 12, 13, 16, 17, 19];

function interpretarDepresionZung(p) {
  if (p < 40) return "mínima o nula";
  if (p < 50) return "leve";
  if (p < 60) return "moderada";
  return "severa";
}

function limpiarHTML(texto) {
  return texto.replace(/<\/?[^>]+(>|$)/g, "");
}


// ========================== ANSIEDAD - ESCALA DE ZUNG (D.A.) ==========================

const preguntasAnsiedadZung = [
  "Me siento más nervioso(a) y tenso(a) de lo habitual.",
  "Tengo miedo sin motivo aparente.",
  "Me siento asustado(a) o en pánico sin razón.",
  "Me siento en tensión o agitado(a).",
  "Me cuesta conciliar el sueño por la preocupación.",
  "Tengo temblores en las manos.",
  "Me siento débil y me canso fácilmente.",
  "Me preocupa sufrir un colapso o desmayo.",
  "Me siento con palpitaciones o aceleración del corazón.",
  "Me pongo sudoroso(a) sin razón.",
  "Me siento inquieto(a) e incapaz de quedarme quieto(a).",
  "Tengo dificultad para respirar sin razón física.",
  "Tengo miedo de que ocurra lo peor.",
  "Me siento mareado(a) o con la cabeza vacía.",
  "Me tiembla todo el cuerpo.",
  "Tengo náuseas o malestar estomacal.",
  "Me siento débil en brazos y piernas.",
  "Me sobresalto fácilmente.",
  "Tengo dificultad para tragar.",
  "Me siento que pierdo el control."
];

function interpretarAnsiedadZung(p) {
  if (p <= 44) return "mínima o nula";
  if (p <= 59) return "leve";
  if (p <= 74) return "moderada";
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

// ========================== AUTOESTIMA (ESCALA DE ROSENBERG) ==========================

const preguntasAutoestima = [
  "Me siento bien conmigo mismo.",
  "Creo que tengo cualidades positivas.",
  "Puedo hacer las cosas tan bien como la mayoría de los demás.",
  "Tengo una actitud positiva hacia mí mismo.",
  "En general, estoy satisfecho conmigo mismo.",
  "A veces siento que no soy bueno para nada.",
  "En ocasiones pienso que no valgo mucho.",
  "Me gustaría tener más respeto por mí mismo.",
  "A veces pienso que soy un fracaso.",
  "No tengo mucho de lo que estar orgulloso."
];

// Índices de preguntas que deben invertirse al puntuar (0-based)
const indicesInvertidosAutoestima = [5, 6, 7, 8, 9];

function interpretarAutoestima(p) {
  if (p >= 30) return "alta";
  if (p >= 26) return "media";
  return "baja";
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
    estado.paso = 'depresion_zung';
    estado.index = 0;
    estado.respuestas = [];
    mensajes.push(`✅ Datos guardados:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}`);
    mensajes.push("🧠 Iniciamos con la *Escala de Depresión de Zung (D.D.)*.");
  mensajes.push(`PRIMERA PREGUNTA:\n${preguntasDepresionZung[0]}\n(Responde con un número del 1 al 4, donde 1 = Rara vez o nunca y 4 = Casi siempre)`);
  }
}

  // === PREGUNTAS DE DEPRESIÓN ===
 else if (estado.paso === 'depresion_zung' && (esGenerico || intent === 'captura_texto_general')) {
  const respuesta = parseInt(textoUsuario);
  if (isNaN(respuesta) || respuesta < 1 || respuesta > 4) {
    mensajes.push("⚠️ Responde solo con un número del 1 al 4 (1 = Rara vez o nunca, 4 = Casi siempre).");
  } else {
    const index = estado.index;
    const puntuacion = indicesInvertidosDepresionZung.includes(index)
      ? 5 - respuesta  // Inversión: 4→1, 3→2, etc.
      : respuesta;

    estado.respuestas.push(puntuacion);
    estado.index++;

    if (estado.index < preguntasDepresionZung.length) {
      mensajes.push(`${preguntasDepresionZung[estado.index]}\n(Responde con un número del 1 al 4)`);
    } else {
      const total = estado.respuestas.reduce((a, b) => a + b, 0);
      const nivel = interpretarDepresionZung(total);
      mensajes.push(`🧠 Resultado de *Depresión* (Escala de Zung):`);
      mensajes.push(`👤 Nombre: ${estado.datos.nombre}`);
      mensajes.push(`🎂 Edad: ${estado.datos.edad}`);
      mensajes.push(`📞 Apoderado: ${estado.datos.celular}`);
      mensajes.push(`📊 Puntaje total: *${total}*`);
      mensajes.push(`🔎 Nivel de depresión: *${nivel}*`);
      mensajes.push("¿Deseas continuar con el bloque de ansiedad? (sí / no)");
      estado.paso = 'fin_depresion_zung';
    }
  }
}

    
// === PREGUNTAS DE ANSIEDAD ZUNG (D.A.) ===
else if (estado.paso === 'ansiedad_zung' && (esGenerico || intent === 'captura_texto_general')) {
  const respuesta = parseInt(textoUsuario);
  if (isNaN(respuesta) || respuesta < 1 || respuesta > 4) {
    mensajes.push("⚠️ Responde solo con un número del 1 al 4 (1 = Rara vez o nunca, 4 = Casi siempre).");
  } else {
    estado.respuestas.push(respuesta);
    estado.index++;

    if (estado.index < preguntasAnsiedadZung.length) {
      mensajes.push(`${preguntasAnsiedadZung[estado.index]}\n(Responde con un número del 1 al 4)`);
    } else {
      const total = estado.respuestas.reduce((a, b) => a + b, 0);
      const nivel = interpretarAnsiedadZung(total);
      mensajes.push(`🧠 Resultado de *Ansiedad* (Escala de Zung):`);
      mensajes.push(`👤 Nombre: ${estado.datos.nombre}`);
      mensajes.push(`🎂 Edad: ${estado.datos.edad}`);
      mensajes.push(`📞 Apoderado: ${estado.datos.celular}`);
      mensajes.push(`📊 Puntaje total: *${total}*`);
      mensajes.push(`🔎 Nivel de ansiedad: *${nivel}*`);
      mensajes.push("¿Deseas continuar con el siguiente bloque? (sí / no)");
      estado.paso = 'fin_ansiedad_zung';
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
    
// === PREGUNTAS DE AUTOESTIMA (ROSENBERG) ===
else if (estado.paso === 'autoestima' && (esGenerico || intent === 'captura_texto_general')) {
  const respuesta = parseInt(textoUsuario);
  if (isNaN(respuesta) || respuesta < 1 || respuesta > 4) {
    mensajes.push("⚠️ Responde solo con un número del 1 al 4 (1 = Totalmente en desacuerdo, 4 = Totalmente de acuerdo).");
  } else {
    // Invertir si es una pregunta negativa
    const indexActual = estado.index;
    const puntuacion = indicesInvertidosAutoestima.includes(indexActual)
      ? 5 - respuesta  // invierte la escala: 4→1, 3→2, 2→3, 1→4
      : respuesta;

    estado.respuestas.push(puntuacion);
    estado.index++;

    if (estado.index < preguntasAutoestima.length) {
      mensajes.push(`${preguntasAutoestima[estado.index]}\n(Responde con un número del 1 al 4)`);
    } else {
      const total = estado.respuestas.reduce((a, b) => a + b, 0);
      const nivel = interpretarAutoestima(total);
      mensajes.push(`💬 Resultado de *Autoestima* (Escala de Rosenberg):`);
      mensajes.push(`👤 Nombre: ${estado.datos.nombre}`);
      mensajes.push(`🎂 Edad: ${estado.datos.edad}`);
      mensajes.push(`📞 Apoderado: ${estado.datos.celular}`);
      mensajes.push(`📊 Puntaje total: *${total}*`);
      mensajes.push(`🔎 Nivel de autoestima: *${nivel}*`);
      mensajes.push("¿Deseas continuar con el siguiente bloque? (sí / no)");
      estado.paso = 'fin_autoestima';
    }
  }
}

  
// === RESPUESTA POR DEFECTO ===

else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_depresion_zung') {
  estado.paso = 'ansiedad_zung';
  estado.index = 0;
  estado.respuestas = [];
  mensajes.push("🧠 Iniciamos con la *Escala de Ansiedad de Zung (D.A.)*.");
  mensajes.push(`PRIMERA PREGUNTA:\n${preguntasAnsiedadZung[0]}\n(Responde con un número del 1 al 4, donde 1 = Rara vez o nunca y 4 = Casi siempre)`);
}


else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_ansiedad') {
  estado.paso = 'estres';
  estado.index = 0;
  estado.respuestas = [];
  mensajes.push("📚 Iniciamos con la prueba de *estrés académico* (Inventario SISCO).");
  mensajes.push(`PRIMERA PREGUNTA:\n${preguntasEstres[0]}\n(Responde con un número del 1 al 5, donde 1 = Nunca, 2 = rara vez, 3 = algunas veces, 4 = casi siempre, 5 = Siempre)`);
}

else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_estres') {
  estado.paso = 'autoestima';
  estado.index = 0;
  estado.respuestas = [];
  mensajes.push("💬 Iniciamos con la prueba de *Autoestima* (Escala de Rosenberg).");
  mensajes.push(`PRIMERA PREGUNTA:\n${preguntasAutoestima[0]}\n(Responde con un número del 1 al 4, donde 1 = Totalmente en desacuerdo y 4 = Totalmente de acuerdo)`);
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































