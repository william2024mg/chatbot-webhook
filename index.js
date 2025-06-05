const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

if (!fs.existsSync("pdfs")) {
  fs.mkdirSync("pdfs");
}

app.get("/", (req, res) => {
  res.send("✅ Servidor de Chatbot activo");
});

app.post("/webhook", (req, res) => {
  const body = req.body;
  const intentName = body.queryResult.intent.displayName;
  const parameters = body.queryResult.parameters;

  console.log("📥 Webhook recibido:", JSON.stringify(body, null, 2));

  const generarRespuesta = (puntaje, interpretacion, mensajeInicial, contexto) => {
    const respuesta = `${mensajeInicial} *${puntaje}*. Esto indica *${interpretacion}*\n\n¿Deseas continuar? (Responde: Sí / No)`;

    return res.json({
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${body.session}/contexts/${contexto}`,
          lifespanCount: 1
        }
      ]
    });
  };

  if (intentName === "resultado_depresion") {
    const puntaje = parameters["puntaje_depresion"];
    let interpretacion = "";

    if (puntaje <= 4) interpretacion = "sin síntomas de depresión.";
    else if (puntaje <= 9) interpretacion = "síntomas leves de depresión.";
    else if (puntaje <= 14) interpretacion = "síntomas moderados de depresión.";
    else if (puntaje <= 19) interpretacion = "síntomas moderadamente severos de depresión.";
    else interpretacion = "síntomas severos de depresión.";

    return generarRespuesta(puntaje, interpretacion, "🧠 Tu puntaje en el test de depresión fue", "contexto_ansiedad_inicio");

  } else if (intentName === "resultado_ansiedad") {
    const puntaje = parameters["puntaje_ansiedad"];
    let interpretacion = "";

    if (puntaje <= 4) interpretacion = "ansiedad mínima.";
    else if (puntaje <= 9) interpretacion = "ansiedad leve.";
    else if (puntaje <= 14) interpretacion = "ansiedad moderada.";
    else interpretacion = "ansiedad severa.";

    return generarRespuesta(puntaje, interpretacion, "😟 Tu puntaje en el test de ansiedad fue", "contexto_estres_inicio");

  } else if (intentName === "resultado_estres") {
    const puntaje = parameters["puntaje_estres"];
    let interpretacion = "";

    if (puntaje <= 5) interpretacion = "muy bajo estrés académico.";
    else if (puntaje <= 10) interpretacion = "bajo estrés académico.";
    else if (puntaje <= 15) interpretacion = "estrés académico moderado.";
    else interpretacion = "alto nivel de estrés académico.";

    return generarRespuesta(puntaje, interpretacion, "📚 Tu puntaje en estrés académico fue", "contexto_autoestima_inicio");

  } else if (intentName === "resultado_autoestima") {
    const puntaje = parameters["puntaje_autoestima"];
    let interpretacion = "";

    if (puntaje <= 5) interpretacion = "muy baja autoestima.";
    else if (puntaje <= 10) interpretacion = "baja autoestima.";
    else if (puntaje <= 15) interpretacion = "autoestima moderada.";
    else interpretacion = "alta autoestima.";

    return generarRespuesta(puntaje, interpretacion, "💪 Tu puntaje en autoestima fue", "contexto_bullying_inicio");

  } else if (intentName === "resultado_bullying") {
    const puntaje = parameters["puntaje_bullying"];
    let interpretacion = "";

    if (puntaje <= 5) interpretacion = "no presenta indicios de acoso escolar.";
    else if (puntaje <= 10) interpretacion = "posible presencia leve de bullying.";
    else if (puntaje <= 15) interpretacion = "probables síntomas de acoso escolar.";
    else interpretacion = "alto riesgo de acoso escolar.";

    return generarRespuesta(puntaje, interpretacion, "🚨 Tu puntaje en bullying fue", "contexto_resumen_inicio");

  } else if (intentName === "resumen_final_resultados") {
    let nombre = parameters.nombre || 'Estudiante';
    const grado = parameters.grado || 'No especificado';
    const seccion = parameters.seccion || 'No especificado';
    const puntajeDepresion = parameters.puntaje_depresion || 0;
    const puntajeAnsiedad = parameters.puntaje_ansiedad || 0;
    const puntajeEstres = parameters.puntaje_estres || 0;
    const puntajeAutoestima = parameters.puntaje_autoestima || 0;
    const puntajeBullying = parameters.puntaje_bullying || 0;

    const nombreArchivo = nombre.trim().length > 0 ? nombre.trim().replace(/[^a-zA-Z0-9_]/g, '_') : 'Estudiante';
    const filePath = `pdfs/${nombreArchivo}_resultado.pdf`;

    try {
      const doc = new PDFDocument();
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
      doc.text(`Puntaje Acoso Escolar: ${puntajeBullying}`);
      doc.end();

      writeStream.on('finish', () => {
        const dominio = req.headers.host || "localhost:3000";
        const pdfUrl = `http://${dominio}/pdfs/${encodeURIComponent(nombreArchivo)}_resultado.pdf`;

        res.json({
          fulfillmentMessages: [
            {
              text: {
                text: [
                  `📄 Aquí tienes tu informe de salud mental:\n${pdfUrl}`
                ]
              }
            }
          ]
        });
      });
    } catch (error) {
      console.error("❌ Error al generar el PDF:", error);
      res.json({
        fulfillmentText: "⚠️ Ocurrió un error al generar el informe. Intenta nuevamente más tarde."
      });
    }

  } else if (intentName === "reiniciar_diagnostico") {
    res.json({
      fulfillmentText: "🔄 Has reiniciado el diagnóstico. Comencemos nuevamente con el test de depresión.",
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_depresion_inicio`,
          lifespanCount: 1
        }
      ]
    });

  } else {
    res.json({
      fulfillmentText: "⚠️ Lo siento, no entendí tu solicitud."
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});


