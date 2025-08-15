// index.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;

// -------- Middlewares base --------
app.use(bodyParser.json());

// IMPORTANTE: no exponemos toda la carpeta 'public' en raíz para evitar bypass.
// Serviremos 'index.html' SOLO tras validar token/credenciales.
// Si necesitas archivos estáticos (css/img), sirve en /static:
app.use('/static', express.static(path.join(__dirname, 'public')));

// =================== CONTROL DE ACCESO ===================
// Opción A: tokens únicos por alumno (URL personal)
const tokensValidos = {
  // token : { alumno, grado }
  'sc-5to-flavio-9f2c3a': { alumno: 'Flavio', grado: '5to' },
  'sc-5to-antony-81be22': { alumno: 'Antony', grado: '5to' },
  // ... agrega más tokens aquí
};

// Opción B (opcional): usuario + contraseña (query params)
const usuariosPermitidos = {
  alumno1: { password: 'pass123', token: 'sc-5to-flavio-9f2c3a' },
  alumno2: { password: 'clave456', token: 'sc-5to-antony-81be22' },
};

// Ruta de acceso con token: https://tu-app/a/:token
app.get('/a/:token', (req, res) => {
  const { token } = req.params;
  if (!token || !tokensValidos[token]) {
    return res.status(403).send('Acceso denegado (token inválido).');
  }
  // Si usas assets locales en index.html, referencia con /static/archivo.css
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Acceso alternativo por usuario+clave (redirecciona a su token)
app.get('/', (req, res) => {
  const user = req.query.user;
  const pass = req.query.pass;
  if (!user || !pass || !usuariosPermitidos[user] || usuariosPermitidos[user].password !== pass) {
    return res
      .status(403)
      .send("Acceso denegado. Usa /a/<token> o bien '/?user=alumno1&pass=pass123'.");
  }
  const token = usuariosPermitidos[user].token;
  return res.redirect(`/a/${token}`);
});

// (Opcional) endpoint para emitir tokens rápidos por consola (desactiva en producción)
app.get('/admin/genera-token', (req, res) => {
  const { nombre = 'alumno', grado = '5to' } = req.query;
  const suf = crypto.randomBytes(3).toString('hex'); // corto y legible
  const token = `sc-${grado.toLowerCase()}-${nombre.toLowerCase()}-${suf}`;
  // En producción deberías persistir este token (archivo .json, DB o variable de entorno).
  return res.json({ token, aviso: 'Agrega este token al objeto tokensValidos del servidor.' });
});

// =================== WEBHOOK DE DIALOGFLOW ===================
// Protegemos el webhook: Dialogflow enviará un header x-shared-secret.
// Configúralo en Dialogflow → Fulfillment → Webhook → Additional headers.
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'SC-2024-CHAT';

app.use('/webhook', (req, res, next) => {
  const header = req.get('x-shared-secret');
  if (header !== WEBHOOK_SECRET) {
    return res.status(403).send('Forbidden (webhook protegido)');
  }
  next();
});

// ======== LÓGICA DEL CUESTIONARIO (tu flujo original, mejor ordenado) ========
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
const indicesInvertidosKovacs = [1, 4, 6, 9, 10, 12, 14, 15, 17, 20, 23, 24];

function interpretarKovacs(p) {
  if (p < 19) return "Depresión leve o ausente";
  if (p < 25) return "Riesgo moderado";
  return "Depresión significativa";
}

function limpiarHTML(t) { return (t || '').replace(/<\/?[^>]+(>|$)/g, ""); }

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
  const queryText = (req.body.queryResult?.queryText || '').toLowerCase();
  const intent = req.body.queryResult?.intent?.displayName || '';
  const textoUsuario = queryText;
  const esGenerico = intent === 'captura_texto_general';

  if (!sesiones[sessionId]) {
    sesiones[sessionId] = { paso: 'inicio', datos: {}, respuestas: [], index: 0 };
  }
  const estado = sesiones[sessionId];
  const mensajes = [];

  // INICIO
  if (textoUsuario === 'inicio' || intent === 'inicio_diagnostico') {
    sesiones[sessionId] = { paso: 'nombre', datos: {}, respuestas: [], index: 0 };
    mensajes.push("🧠 Bienvenido al diagnóstico de salud mental.");
    mensajes.push("Por favor, dime tu *nombre*:");
  }
  // NOMBRE
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
  // EDAD
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
  // CELULAR
  else if (estado.paso === 'celular' && (esGenerico || intent === 'captura_texto_general')) {
    const celular = limpiarHTML(queryText).replace(/\D/g, '');
    if (celular.length !== 9) {
      mensajes.push("⚠️ El número debe tener exactamente 9 dígitos. Intenta otra vez:");
    } else {
      estado.datos.celular = celular;
      estado.paso = 'depresion_kovacs';
      estado.index = 0;
      estado.respuestas = [];
      mensajes.push(`✅ Datos guardados:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}`);
      mensajes.push("🧠 Iniciamos con la *Escala de Depresión Infantil de Kovacs*.");
      mensajes.push(`PRIMERA PREGUNTA:\n${preguntasKovacs[0]}\n(Responde 0 = primera opción, 1 = segunda, 2 = tercera)`);
    }
  }
  // DEPRESIÓN (Kovacs)
  else if (estado.paso === 'depresion_kovacs' && (esGenerico || intent === 'captura_texto_general')) {
    const r = parseInt(textoUsuario);
    if (isNaN(r) || r < 0 || r > 2) {
      mensajes.push("⚠️ Responde 0 (primera), 1 (segunda), o 2 (tercera).");
    } else {
      const i = estado.index;
      const punt = indicesInvertidosKovacs.includes(i) ? (2 - r) : r;
      estado.respuestas.push(punt);
      estado.index++;

      if (estado.index < preguntasKovacs.length) {
        mensajes.push(`${preguntasKovacs[estado.index]}\n(0, 1 o 2)`);
      } else {
        const total = estado.respuestas.reduce((a,b)=>a+b,0);
        const nivel = interpretarKovacs(total);
        mensajes.push(`🧠 Resultado *CDI Kovacs*:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}\n📊 Puntaje: *${total}*\n🔎 Nivel: *${nivel}*`);
        mensajes.push("¿Deseas continuar con *Ansiedad (SCARED)*? (sí / no)");
        estado.paso = 'fin_depresion_kovacs';
      }
    }
  }
  // SIGUIENTE → Ansiedad
  else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_depresion_kovacs') {
    estado.paso = 'ansiedad_scared';
    estado.index = 0;
    estado.respuestas = [];
    mensajes.push("🧠 Iniciamos *Ansiedad Infantil* (SCARED – versión corta).");
    mensajes.push(`PRIMERA PREGUNTA:\n${preguntasAnsiedadSCARED[0]}\n(0 = Nunca, 1 = A veces, 2 = A menudo)`);
  }
  // ANSIEDAD (SCARED)
  else if (estado.paso === 'ansiedad_scared' && (esGenerico || intent === 'captura_texto_general')) {
    const r = parseInt(textoUsuario);
    if (isNaN(r) || r < 0 || r > 2) {
      mensajes.push("⚠️ Responde 0, 1 o 2.");
    } else {
      estado.respuestas.push(r);
      estado.index++;
      if (estado.index < preguntasAnsiedadSCARED.length) {
        mensajes.push(`${preguntasAnsiedadSCARED[estado.index]}\n(0, 1, 2)`);
      } else {
        const total = estado.respuestas.reduce((a,b)=>a+b,0);
        const nivel = interpretarAnsiedadSCARED(total);
        mensajes.push(`🧠 Resultado *Ansiedad (SCARED)*:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}\n📊 Puntaje: *${total}*\n🔎 Nivel: *${nivel}*`);
        mensajes.push("¿Deseas continuar con *Estrés académico (SISCO)*? (sí / no)");
        estado.paso = 'fin_ansiedad_scared';
      }
    }
  }
  // SIGUIENTE → Estrés
  else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_ansiedad_scared') {
    estado.paso = 'inicio_estres';
    estado.index = 0;
    estado.respuestas = [];
    mensajes.push("📚 Iniciamos *Estrés académico* (SISCO).");
    mensajes.push(`${preguntasEstres[0]}\n(1=Nunca, 2=Rara vez, 3=Algunas veces, 4=Casi siempre, 5=Siempre)`);
  }
  // ESTRÉS (SISCO)
  else if (estado.paso === 'inicio_estres' && (esGenerico || intent === 'captura_texto_general')) {
    const r = parseInt(textoUsuario);
    if (isNaN(r) || r < 1 || r > 5) {
      mensajes.push("⚠️ Responde 1 a 5.");
    } else {
      estado.respuestas.push(r);
      estado.index++;
      if (estado.index < preguntasEstres.length) {
        mensajes.push(`${preguntasEstres[estado.index]}\n(1 a 5)`);
      } else {
        const total = estado.respuestas.reduce((a,b)=>a+b,0);
        const nivel = interpretarEstres(total);
        mensajes.push(`📚 Resultado *Estrés académico (SISCO)*:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}\n📊 Puntaje: *${total}*\n🔎 Nivel: *${nivel}*`);
        mensajes.push("¿Deseas continuar con *Autoestima (Rosenberg)*? (sí / no)");
        estado.paso = 'fin_estres';
      }
    }
  }
  // SIGUIENTE → Autoestima
  else if ((textoUsuario === 'sí' || textoUsuario === 'si') && estado.paso === 'fin_estres') {
    estado.paso = 'autoestima';
    estado.index = 0;
    estado.respuestas = [];
    mensajes.push("💬 Iniciamos *Autoestima* (Rosenberg).");
    mensajes.push(`${preguntasAutoestima[0]}\n(1=Totalmente en desacuerdo, 2=En desacuerdo, 3=De acuerdo, 4=Totalmente de acuerdo)`);
  }
  // AUTOESTIMA (Rosenberg)
  else if (estado.paso === 'autoestima' && (esGenerico || intent === 'captura_texto_general')) {
    const r = parseInt(textoUsuario);
    if (isNaN(r) || r < 1 || r > 4) {
      mensajes.push("⚠️ Responde 1 a 4.");
    } else {
      const i = estado.index;
      const punt = indicesInvertidosAutoestima.includes(i) ? (5 - r) : r;
      estado.respuestas.push(punt);
      estado.index++;
      if (estado.index < preguntasAutoestima.length) {
        mensajes.push(`${preguntasAutoestima[estado.index]}\n(1 a 4)`);
      } else {
        const total = estado.respuestas.reduce((a,b)=>a+b,0);
        const nivel = interpretarAutoestima(total);
        mensajes.push(`💬 Resultado *Autoestima (Rosenberg)*:\n👤 ${estado.datos.nombre}\n🎂 ${estado.datos.edad}\n📞 ${estado.datos.celular}\n📊 Puntaje: *${total}*\n🔎 Nivel: *${nivel}*`);
        mensajes.push("📝 Has completado los cuestionarios. Gracias por tu participación.");
        mensajes.push("✅ Escribe *inicio* si deseas volver a empezar.");
        estado.paso = 'completado';
      }
    }
  }
  // DEFAULT
  else {
    mensajes.push("⚠️ No entendí. Escribe 'inicio' para comenzar de nuevo.");
  }

  return res.json({ fulfillmentMessages: mensajes.map(t => ({ text: { text: [t] } })) });
});

// Salud del servicio
app.get('/health', (req, res) => res.json({ ok: true }));

// Levantar servidor (un solo listen)
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
































