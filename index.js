const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// ========================== DEPRESIÓN - ESCALA CDI DE KOVACS ==========================

const preguntasKovacs = [
  "Estoy triste de vez en cuando / Estoy triste muchas veces / Estoy siempre triste",
  "No lloro más que de costumbre / Lloro más ahora que antes / Lloro todo el tiempo",
  "A veces me cuesta hacer cosas / Me cuesta hacer muchas cosas / Me cuesta hacer todo",
  "Duermo igual que siempre / Duermo más que antes / Duermo menos que antes",
  "Tengo buen apetito / Mi apetito es menor / No tengo apetito",
  "Me gusta jugar con mis amigos / Me gusta menos jugar / No me gusta jugar con nadie",
  "Creo que soy bueno / Soy como los demás / Me siento inútil",
  "Me siento querido / A veces me siento solo / Me siento solo todo el tiempo",
  "Me enojo de vez en cuando / Me enojo frecuentemente / Estoy siempre enojado",
  "Soy feliz la mayor parte del tiempo / Soy feliz a veces / Nunca soy feliz",
  "Creo que las cosas mejorarán / No sé si mejorarán / Nada mejorará",
  "Hago bien las cosas / Me equivoco a veces / Siempre me equivoco",
  "Tengo energía para hacer cosas / A veces estoy cansado / Siempre estoy cansado",
  "Quiero estar con mi familia / A veces quiero estar solo / Siempre quiero estar solo",
  "Me esfuerzo en la escuela / A veces no me esfuerzo / No me esfuerzo nada",
  "Me concentro bien / Me distraigo fácilmente / No puedo concentrarme",
  "Me siento bien conmigo mismo / A veces no me gusto / Me siento mal conmigo mismo",
  "Me porto bien / A veces me porto mal / Siempre me porto mal",
  "Creo que la gente me quiere / A veces pienso que no / Creo que nadie me quiere",
  "Me divierto a veces / No me divierto nunca / Me aburro siempre",
  "Me preocupo de vez en cuando / Me preocupo mucho / Me preocupo todo el tiempo",
  "Quiero seguir viviendo / A veces no quiero vivir / No quiero vivir",
  "Tengo miedo a veces / Me da miedo todo / Tengo miedo constante",
  "Creo que soy inteligente / Soy como los demás / Soy tonto",
  "Puedo hablar de mis sentimientos / A veces no puedo / Nunca puedo",
  "Me siento aceptado / Me siento inseguro / Me siento rechazado",
  "Hago amigos con facilidad / Me cuesta hacer amigos / No tengo amigos"
];

function interpretarKovacs(puntaje) {
  if (puntaje < 19) return "Depresión leve o ausente";
  if (puntaje < 25) return "Riesgo moderado";
  return "Depresión significativa";
}


function limpiarHTML(texto) {
  return texto.replace(/<\/?[^>]+(>|$)/g, "");
}


// ========================== ANSIEDAD INFANTIL (SCARED - Versión corta 10preguntas) ==========================

const preguntasAnsiedadSCARED = [
  "Me preocupa que algo malo le pase a alguien de mi familia.",
  "Tengo miedo de dormir solo.",
  "Me da miedo estar solo en casa.",
  "Me preocupo mucho por cosas malas que podrían pasar.",
  "Me asusto fácilmente.",
  "Tengo miedo de ir a la escuela.",
  "Me preocupo cuando me separo de mis padres.",
  "Me siento tenso o nervioso.",
  "Me preocupa que algo malo me pase a mí.",
  "Me da miedo cuando tengo que hacer algo frente a los demás."
];

function interpretarAnsiedadSCARED(p) {
  if (p <= 7) return "mínima o nula";
  if (p <= 12) return "leve";
  if (p <= 16) return "moderada";
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
    estado.paso = 'depresion_kovacs';
estado.index = 0;
estado.respuestas = [];
mensajes.push(`✅ Datos guardados:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}`);
mensajes.push("🧠 Iniciamos con la *Escala de Depresión Infantil de Kovacs*.");
mensajes.push(`PRIMERA PREGUNTA:\n${preguntasKovacs[0]}\n(Responde con un número: 0 = primera opción, 
1 = segunda opción, 2 = tercera opción)`);
}
}
  // === PREGUNTAS DE DEPRESIÓN ===
 else if (estado.paso === 'depresion_kovacs' && (esGenerico || intent === 'captura_texto_general')) {
  const respuesta = parseInt(textoUsuario);
  if (isNaN(respuesta) || respuesta < 0 || respuesta > 2) {
    mensajes.push("⚠️ Responde con 0 (primera opción), 1 (segunda), o 2 (tercera).");
  } else {
    estado.respuestas.push(respuesta);
    estado.index++;

    if (estado.index < preguntasKovacs.length) {
      mensajes.push(`${preguntasKovacs[estado.index]}\n(0 = primera opción, 1 = segunda, 2 = tercera)`);
    } else {
      const total = estado.respuestas.reduce((a, b) => a + b, 0);
      const nivel = interpretarKovacs(total);
      mensajes.push(`🧠 Resultado de *Depresión Infantil (CDI Kovacs)*:`);
      mensajes.push(`👤 Nombre: ${estado.datos.nombre}`);
      mensajes.push(`🎂 Edad: ${estado.datos.edad}`);
      mensajes.push(`📞 Apoderado: ${estado.datos.celular}`);
      mensajes.push(`📊 Puntaje total: *${total}*`);
      mensajes.push(`🔎 Nivel de depresión: *${nivel}*`);
      mensajes.push("¿Deseas continuar con el bloque de ansiedad? (sí / no)");
      estado.paso = 'fin_depresion_kovacs';
    }
  }
}


    
// === PREGUNTAS DE ANSIEDAD INFANTIL (SCARED  - Version corta) ===
else if (estado.paso === 'ansiedad_scared' && (esGenerico || intent === 'captura_texto_general')) {
  const respuesta = parseInt(textoUsuario);
  if (isNaN(respuesta) || respuesta < 0 || respuesta > 2) {
    mensajes.push("⚠️ Responde con un número del 0 al 2 (0 = Nunca, 1 = A veces, 2 = A menudo).");
  } else {
    estado.respuestas.push(respuesta);
    estado.index++;

    if (estado.index < preguntasAnsiedadSCARED.length) {
      mensajes.push(`${preguntasAnsiedadSCARED[estado.index]}\n(0 = Nunca, 1 = A veces, 2 = A menudo)`);
    } else {
      const total = estado.respuestas.reduce((a, b) => a + b, 0);
      const nivel = interpretarAnsiedadSCARED(total);
      mensajes.push(`🧠 Resultado de *Ansiedad Infantil* (Test SCARED – versión corta):`);
      mensajes.push(`👤 Nombre: ${estado.datos.nombre}`);
      mensajes.push(`🎂 Edad: ${estado.datos.edad}`);
      mensajes.push(`📞 Apoderado: ${estado.datos.celular}`);
      mensajes.push(`📊 Puntaje total: *${total}*`);
      mensajes.push(`🔎 Nivel de ansiedad: *${nivel}*`);
      mensajes.push("¿Deseas continuar con el siguiente bloque? (sí / no)");
      estado.paso = 'fin_ansiedad_scared';
    }
  }
}



// === PREGUNTAS DE ESTRESORES ACADÉMICOS ===
else if (estado.paso === 'inicio_estres' && (esGenerico || intent === 'captura_texto_general')) {
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
      estado.paso = 'fin_inicio_estres';
    }
  }
}
    
// === PREGUNTAS DE AUTOESTIMA (ROSENBERG) ===
else if (estado.paso === 'autoestima' && (esGenerico || intent === 'captura_texto_general')) {
  const respuesta = parseInt(textoUsuario);
  if (isNaN(respuesta) || respuesta < 1 || respuesta > 4) {
    mensajes.push("⚠️ Responde solo con un número del 1 al 4 (1 = Totalmente en desacuerdo, 2= en desacuerdo, 3= de acuerdo, 4 = Totalmente de acuerdo).");
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
      mensajes.push("📝 Has completado los 4 cuestionarios. Gracias por tu participación.");
mensajes.push("📄 Se está generando tu reporte de salud mental para ser revisado por el especialista.");
mensajes.push("✅ Puedes cerrar la conversación o escribir *inicio* si deseas volver a empezar.");
estado.paso = 'completado';

    }
  }
}

  
// === RESPUESTA POR DEFECTO ===

else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_depresion_kovacs') {
  estado.paso = 'ansiedad_scared';
  estado.index = 0;
  estado.respuestas = [];
   mensajes.push("🧠 Iniciamos con la prueba de *Ansiedad Infantil* (SCARED – versión corta).");
  mensajes.push(`PRIMERA PREGUNTA:\n${preguntasAnsiedadSCARED[0]}\n(0 = Nunca, 1 = A veces, 2 = A menudo)`);
}


else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_ansiedad_scared') {
  estado.paso = 'inicio_estres';
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































