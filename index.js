const express = require('express');
const bodyParser = require('body-parser');

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// ========================== DEPRESIÓN - ESCALA CDI DE KOVACS ==========================

const preguntasKovacs = [
  "Estoy triste de vez en cuando / Estoy triste muchas veces / Estoy siempre triste",
  "Nunca me saldra Nada bien / No estoy seguro de si las cosas me saldran bien / Las cosas me saldran bien",
  "Hago bien la mayoría de las cosas / Hago mal muchas cosas  / Todo lo hago mal",
  "Me divierten muchas cosas / Me divierten algunas cosas / Nada me divierte",
  "Soy malo siempre / Soy malo muchas veces / Soy malo algunas veces ",
  "A veces pienso que me pueden ocurrir cosas malas / Me preocupa que me ocurran cosas malas / Estoy seguro de que me van a ocurrir cosas terribles ",
  "Me odio  / No me gusta como soy  / Me gusta como soy ",
  "Todas las cosas malas son culpa mía / Muchas cosas malas son culpa mía /Generalmente no tengo la culpa de que ocurran ",
  "No pienso en matarme  / pienso en matarme, pero no lo haría / Quiero matarme",
  "Tengo ganas de llorar todos los días / Tengo ganas de llorar muchos días / Tengo ganas de llorar de cuando en cuando",
  "Las cosas me preocupan siempre / Las cosas me preocupan muchas veces / Las cosas me preocupan de cuando en cuando",
  "Me gusta estar con la gente  / Muy a menudo no me gusta estar con la gente  / No quiero en absoluto estar con la gente",
  "No puedo decidirme / Me cuesta decidirme  / me decido fácilmente ",
  "Tengo buen aspecto / Hay algunas cosas de mi aspecto que no me gustan / Soy feo ",
  "Siempre me cuesta ponerme a hacer los deberes  / Muchas veces me cuesta ponerme a hacer los deberes  / No me cuesta ponerme a hacer los deberes ",
  "Todas las noches me cuesta dormirme  / Muchas noches me cuesta dormirme / Duermo muy bien",
  "Estoy cansado de cuando en cuando  / Estoy cansado muchos días / Estoy cansado siempre",
  "La mayoría de los días no tengo ganas de comer  / Muchos días no tengo ganas de comer / Como muy bien ",
  "No me preocupa el dolor ni la enfermedad / No me divierto nuncaMuchas veces me preocupa el dolor y la enfermedad  / Siempre me preocupa el dolor y la enfermedad",
  "Nunca me siento solo / Me siento solo muchas veces  / Me siento solo siempre ",
  "Nunca me divierto en el colegio / Me divierto en el colegio sólo de vez en cuando / Me divierto en el colegio muchas veces",
  "Tengo muchos amigos  / Tengo muchos amigos pero me gustaría tener más  / No tengo amigos ",
  "Mi trabajo en el colegio es bueno / Mi trabajo en el colegio no es tan bueno como antes / Llevo muy mal las asignaturas que antes llevaba bien",
  "Nunca podré ser tan bueno como otros / Si quiero puedo ser tan bueno como otros niños / Soy tan bueno como otros niños",
  "Nadie me quiere  / No estoy seguro de que alguien me quiera  / Estoy seguro de que alguien me quiere",
  "Generalmente hago lo que me dicen / Muchas veces no hago lo que me dicen / Nunca hago lo que me dicen ",
  "Me llevo bien con la gente  / Me peleo muchas veces / Me peleo siempre"
];
// Índices de preguntas con redacción positiva que deben invertirse (basado en tus preguntas actuales)
const indicesInvertidosKovacs = [
  1, 4, 6, 9, 10, 12, 14, 15, 17, 20, 23, 24
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
  "Siento que no tengo mucho de lo que estar orgulloso/a.",
  "En general, me inclino a pensar que soy un fracasado/a.",
  "Me gustaría poder sentir más respeto por mí mismo.",
  "Hay veces que realmente pienso que soy un inútil.",
  "A veces creo que no soy buena persona."
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
    const indexActual = estado.index;
    // Invertir si la pregunta actual es de las que deben invertirse
    const puntuacion = indicesInvertidosKovacs.includes(indexActual)
      ? 2 - respuesta  // invierte 0⇄2, 1 queda igual
      : respuesta;

    estado.respuestas.push(puntuacion);
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
      estado.datos.depresion = { total, nivel };

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
      estado.datos.ansiedad = { total, nivel };

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
      estado.datos.estres = { total, nivel };

      mensajes.push("¿Deseas continuar con el siguiente bloque? (sí / no)");
      estado.paso = 'fin_estres';
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

// === GENERAR PDF AUTOMÁTICO ===
const nombre = estado.datos.nombre.replace(/\s+/g, '_');
const pdfPath = path.join(__dirname, 'public', `reporte_${nombre}.pdf`);

// Asegurar carpeta /public
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

const doc = new PDFDocument({ margin: 50 });
const stream = fs.createWriteStream(pdfPath);
doc.pipe(stream);

// ================= CABECERA =================
doc
  .fontSize(18)
  .fillColor('#1a237e')
  .text('INSTITUCIÓN EDUCATIVA PRIVADA SAN CRISTÓBAL DE HUAMANGA', { align: 'center' })
  .moveDown(0.5)
  .fontSize(14)
  .fillColor('#004d40')
  .text('🧠 YachayWasiBot — Evaluación de Salud Mental', { align: 'center' })
  .moveDown(1.5);

// ================= DATOS PERSONALES =================
doc
  .fontSize(12)
  .fillColor('#000')
  .text(`👤 Nombre del estudiante: ${estado.datos.nombre}`)
  .text(`🎂 Edad: ${estado.datos.edad}`)
  .text(`📞 Apoderado: ${estado.datos.celular}`)
  .moveDown();

// ================= RESULTADOS =================
const puntajeTotal = estado.respuestas.reduce((a, b) => a + b, 0);
const nivel = interpretarAutoestima(puntajeTotal);

doc
  .fontSize(13)
  .fillColor('#1a237e')
  .text('📊 Resultados del Cuestionario de Autoestima (Rosenberg):')
  .moveDown(0.5);

doc
  .fontSize(12)
  .fillColor('#000')
  .text(`Puntaje total obtenido: ${puntajeTotal}`)
  .text(`Nivel de autoestima: ${nivel}`)
  .moveDown(1.5);

// ================= PIE DE PÁGINA =================
doc
  .fontSize(12)
  .fillColor('#1a237e')
  .text('🩺 Gracias por completar los cuestionarios.', { align: 'center' })
  .moveDown(0.3)
  .fillColor('#000')
  .text(
    'Este reporte será revisado por el especialista en salud mental de la institución.',
    { align: 'center' }
  )
  .moveDown(0.5)
  .fontSize(10)
  .fillColor('#555')
  .text('© 2024 YachayWasiBot — I.E.P. San Cristóbal de Huamanga', { align: 'center' });

doc.end();

// ================= ENLACE DE DESCARGA =================
stream.on('finish', () => {
  const link = `https://chatbot-webhook-chij.onrender.com/reportes/reporte_${nombre}.pdf`;
  mensajes.push(`📄 Tu reporte está listo:\n${link}`);
  res.json({
    fulfillmentMessages: mensajes.map(text => ({ text: { text: [text] } }))
  });
});

return; // Evita enviar respuesta antes de generar PDF



      
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

app.use('/reportes', express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});
