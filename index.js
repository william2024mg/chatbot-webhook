/ index.js
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');

const app = express();
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Carpeta pública para archivos PDF
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));

// Asegura que exista la carpeta
if (!fs.existsSync("pdfs")) {
  fs.mkdirSync("pdfs");
}

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("✅ Servidor de Chatbot activo");
});

// Webhook principal
app.post("/webhook", (req, res) => {
  const body = req.body;
  console.log("📥 Webhook recibido:", JSON.stringify(body, null, 2));

  const intentName = body.queryResult.intent.displayName;

 // inicio_diagnostico
  agent.setContext({
  name: 'contexto_depresion_inicio',
  lifespan: 5
    agent.add(`Gracias por brindar tus datos, ${nombre}. ¿Deseas comenzar ahora con el diagnóstico de salud mental? (Responde: Sí / No)`);
}); 
  
  
  
  
  // resultado_depresion
  if (intentName === "resultado_depresion") {
    const puntaje = body.queryResult.parameters["puntaje_depresion"];
    let interpretacion = "";

    if (puntaje <= 4) {
      interpretacion = "sin síntomas de depresión.";
    } else if (puntaje <= 9) {
      interpretacion = "síntomas leves de depresión.";
    } else if (puntaje <= 14) {
      interpretacion = "síntomas moderados de depresión.";
    } else if (puntaje <= 19) {
      interpretacion = "síntomas moderadamente severos de depresión.";
    } else {
      interpretacion = "síntomas severos de depresión.";
    }

    const respuesta = `🧠 Tu puntaje en el test de depresión fue *${puntaje}*. Esto indica *${interpretacion}*`;

    res.json({
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_ansiedad_inicio`,
          lifespanCount: 1
        }
      ]
    });

  // resultado_ansiedad
  } else if (intentName === "resultado_ansiedad") {
    const puntaje = body.queryResult.parameters["puntaje_ansiedad"];
    let interpretacion = "";

    if (puntaje <= 4) {
      interpretacion = "ansiedad mínima.";
    } else if (puntaje <= 9) {
      interpretacion = "ansiedad leve.";
    } else if (puntaje <= 14) {
      interpretacion = "ansiedad moderada.";
    } else {
      interpretacion = "ansiedad severa.";
    }

    const respuesta = `😟 Tu puntaje en el test de ansiedad fue *${puntaje}*. Esto indica *${interpretacion}*`;

    res.json({
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_estres_inicio`,
          lifespanCount: 1
        }
      ]
    });

  // resultado_estres
  } else if (intentName === "resultado_estres") {
    const puntaje = body.queryResult.parameters["puntaje_estres"];
    let interpretacion = "";

    if (puntaje <= 5) {
      interpretacion = "muy bajo estrés académico.";
    } else if (puntaje <= 10) {
      interpretacion = "bajo estrés académico.";
    } else if (puntaje <= 15) {
      interpretacion = "estrés académico moderado.";
    } else {
      interpretacion = "alto nivel de estrés académico.";
    }

    const respuesta = `📚 Tu puntaje en estrés académico fue *${puntaje}*. Esto indica *${interpretacion}*`;

    res.json({
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_autoestima_inicio`,
          lifespanCount: 1
        }
      ]
    });

  // resultado_autoestima
  } else if (intentName === "resultado_autoestima") {
    const puntaje = body.queryResult.parameters["puntaje_autoestima"];
    let interpretacion = "";

    if (puntaje <= 5) {
      interpretacion = "muy baja autoestima.";
    } else if (puntaje <= 10) {
      interpretacion = "baja autoestima.";
    } else if (puntaje <= 15) {
      interpretacion = "autoestima moderada.";
    } else {
      interpretacion = "alta autoestima.";
    }

    const respuesta = `💪 Tu puntaje en autoestima fue *${puntaje}*. Esto indica *${interpretacion}*`;

    res.json({
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_habilidades_inicio`,
          lifespanCount: 1
        }
      ]
    });

  // resultado_habilidades
  } else if (intentName === "resultado_habilidades") {
    const puntaje = body.queryResult.parameters["puntaje_habilidades"];
    let interpretacion = "";

    if (puntaje <= 5) {
      interpretacion = "dificultades severas en habilidades sociales.";
    } else if (puntaje <= 10) {
      interpretacion = "habilidades sociales bajas.";
    } else if (puntaje <= 15) {
      interpretacion = "habilidades sociales adecuadas.";
    } else {
      interpretacion = "excelentes habilidades sociales.";
    }

    const respuesta = `🤝 Tu puntaje en habilidades sociales fue *${puntaje}*. Esto indica *${interpretacion}*`;

    res.json({
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_sueno_inicio`,
          lifespanCount: 1
        }
      ]
    });

  // resultado_sueno
  } else if (intentName === "resultado_sueno") {
    const puntaje = body.queryResult.parameters["puntaje_sueno"];
    let interpretacion = "";

    if (puntaje <= 5) {
      interpretacion = "excelente calidad del sueño.";
    } else if (puntaje <= 10) {
      interpretacion = "calidad del sueño aceptable.";
    } else if (puntaje <= 15) {
      interpretacion = "trastornos leves del sueño.";
    } else {
      interpretacion = "trastornos severos del sueño.";
    }

    const respuesta = `😴 Tu puntaje en trastornos del sueño fue *${puntaje}*. Esto indica *${interpretacion}*`;

    res.json({
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_bullying_inicio`,
          lifespanCount: 1
        }
      ]
    });

  // resultado_bullying
  } else if (intentName === "resultado_bullying") {
    const puntaje = body.queryResult.parameters["puntaje_bullying"];
    let interpretacion = "";

    if (puntaje <= 5) {
      interpretacion = "no presenta indicios de acoso escolar.";
    } else if (puntaje <= 10) {
      interpretacion = "posible presencia leve de bullying.";
    } else if (puntaje <= 15) {
      interpretacion = "probables síntomas de acoso escolar.";
    } else {
      interpretacion = "alto riesgo de acoso escolar.";
    }

    const respuesta = `🚨 Tu puntaje en bullying fue *${puntaje}*. Esto indica *${interpretacion}*`;

    res.json({
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_resumen_inicio`,
          lifespanCount: 1
        }
      ]
    });

  // resumen_final_resultados
  } else if (intent === 'resumen_final_resultados') {
    const nombre = parameters.nombre || 'Estudiante';
    const grado = parameters.grado || 'No especificado';
    const seccion = parameters.seccion || 'No especificado';
    const puntajeDepresion = parameters.puntaje_depresion || 0;
    const puntajeAnsiedad = parameters.puntaje_ansiedad || 0;
    const puntajeEstres = parameters.puntaje_estres || 0;
    const puntajeAutoestima = parameters.puntaje_autoestima || 0;
    const puntajeHabilidades = parameters.puntaje_habilidades || 0;
    const puntajeSueno = parameters.puntaje_sueno || 0;
    const puntajeBullying = parameters.puntaje_bullying || 0;

    const doc = new PDFDocument();
    const filePath = `pdfs/${nombre.replace(/ /g, '_')}_resultado.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(18).text('Informe de Evaluación de Salud Mental', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Nombre: ${nombre}`);
    doc.text(`Grado: ${grado}`);
    doc.text(`Sección: ${seccion}`);
    doc.moveDown();
    doc.text(`Puntaje Depresión: ${puntajeDepresion}`);
    doc.text(`Puntaje Ansiedad: ${puntajeAnsiedad}`);
    doc.text(`Puntaje Estrés Académico: ${puntajeEstres}`);
    doc.text(`Puntaje Autoestima: ${puntajeAutoestima}`);
    doc.text(`Puntaje Habilidades Sociales: ${puntajeHabilidades}`);
    doc.text(`Puntaje Trastornos del Sueño: ${puntajeSueno}`);
    doc.text(`Puntaje Acoso Escolar: ${puntajeBullying}`);
    doc.end();

    writeStream.on('finish', () => {
      const pdfUrl = `https://TUDOMINIO.com/pdfs/${encodeURIComponent(nombre.replace(/ /g, '_'))}_resultado.pdf`;

      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `Gracias por completar la evaluación, ${nombre}.`,
                `Aquí tienes un resumen de tus resultados:`,
                `• Depresión: ${puntajeDepresion}`,
                `• Ansiedad: ${puntajeAnsiedad}`,
                `• Estrés Académico: ${puntajeEstres}`,
                `• Autoestima: ${puntajeAutoestima}`,
                `• Habilidades Sociales: ${puntajeHabilidades}`,
                `• Trastornos del Sueño: ${puntajeSueno}`,
                `• Acoso Escolar: ${puntajeBullying}`,
                ``,
                `Puedes descargar tu informe completo aquí: ${pdfUrl}`
              ]
            }
          }
        ]
      });
    });

    writeStream.on('error', (err) => {
      console.error('Error al generar PDF:', err);
      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: ['Ocurrió un error al generar tu informe. Intenta nuevamente más tarde.']
            }
          }
        ]
      });
    });
  }

app.listen(port, () => {
  console.log(`🚀 Servidor funcionando en http://localhost:${port}`);
});
  
console.log("Datos recibidos:");
console.log("Nombre:", nombre_completo);
console.log("Edad:", edad);
console.log("Puntaje Depresión:", puntaje_depresion);
console.log("Puntaje Ansiedad:", puntaje_ansiedad);
console.log("Puntaje Estrés:", puntaje_estres);
console.log("Puntaje Autoestima:", puntaje_autoestima);
console.log("Puntaje Habilidades Sociales:", puntaje_habilidades);
console.log("Puntaje Sueño:", puntaje_sueno);
console.log("Puntaje Acoso Escolar:", puntaje_acoso);
