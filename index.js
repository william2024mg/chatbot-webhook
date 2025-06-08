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

  // --- INTENTS DE RESULTADOS INTERMEDIOS ---
const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  // Función genérica para calcular resultados por ítem
  function calcularResultado(agent, preguntas, parametroFinal) {
    let total = 0;
    preguntas.forEach(p => {
      const valor = parseInt(agent.parameters[p]);
      if (!isNaN(valor)) total += valor;
    });

    let nivel = "No evaluado";
    let mensaje = "";

    if (parametroFinal === 'puntaje_depresion') {
      if (total <= 4) nivel = "Mínima";
      else if (total <= 9) nivel = "Leve";
      else if (total <= 14) nivel = "Moderada";
      else if (total <= 19) nivel = "Moderadamente Severa";
      else nivel = "Severa";
      mensaje = `Nivel de depresión: *${nivel}* (Puntaje: ${total})`;
    }

    if (parametroFinal === 'puntaje_ansiedad') {
      if (total <= 4) nivel = "Mínima";
      else if (total <= 9) nivel = "Leve";
      else if (total <= 14) nivel = "Moderada";
      else nivel = "Grave";
      mensaje = `Nivel de ansiedad: *${nivel}* (Puntaje: ${total})`;
    }

    if (parametroFinal === 'puntaje_estres') {
      if (total <= 6) nivel = "Bajo";
      else if (total <= 12) nivel = "Moderado";
      else nivel = "Alto";
      mensaje = `Nivel de estrés académico: *${nivel}* (Puntaje: ${total})`;
    }

    if (parametroFinal === 'puntaje_autoestima') {
      if (total <= 6) nivel = "Baja";
      else if (total <= 12) nivel = "Media";
      else nivel = "Alta";
      mensaje = `Nivel de autoestima: *${nivel}* (Puntaje: ${total})`;
    }

    if (parametroFinal === 'puntaje_acoso') {
      if (total <= 6) nivel = "Bajo";
      else if (total <= 12) nivel = "Medio";
      else nivel = "Alto";
      mensaje = `Nivel de acoso escolar: *${nivel}* (Puntaje: ${total})`;
    }

    agent.context.set({
      name: parametroFinal + '_contexto',
      lifespan: 20,
      parameters: { [parametroFinal]: total }
    });

    agent.add(mensaje);
  }

  // Funciones individuales por cada ítem evaluado
  function resultadoDepresion(agent) {
    return calcularResultado(agent, [
      'p1_depresion', 'p2_depresion', 'p3_depresion', 'p4_depresion',
      'p5_depresion', 'p6_depresion', 'p7_depresion', 'p8_depresion', 'p9_depresion'
    ], 'puntaje_depresion');
  }

  function resultadoAnsiedad(agent) {
    return calcularResultado(agent, [
      'p1_ansiedad', 'p2_ansiedad', 'p3_ansiedad', 'p4_ansiedad',
      'p5_ansiedad', 'p6_ansiedad', 'p7_ansiedad'
    ], 'puntaje_ansiedad');
  }

  function resultadoEstres(agent) {
    return calcularResultado(agent, [
      'p1_estres', 'p2_estres', 'p3_estres',
      'p4_estres', 'p5_estres', 'p6_estres'
    ], 'puntaje_estres');
  }

  function resultadoAutoestima(agent) {
    return calcularResultado(agent, [
      'p1_autoestima', 'p2_autoestima', 'p3_autoestima',
      'p4_autoestima', 'p5_autoestima', 'p6_autoestima'
    ], 'puntaje_autoestima');
  }

  function resultadoAcoso(agent) {
    return calcularResultado(agent, [
      'p1_acoso', 'p2_acoso', 'p3_acoso',
      'p4_acoso', 'p5_acoso', 'p6_acoso'
    ], 'puntaje_acoso');
  }

  // Función final que resume los resultados de los 5 ítems activos
  function resumenFinal(agent) {
    const ctx = agent.contexts;

    const d = ctx.find(c => c.name.endsWith('puntaje_depresion_contexto'))?.parameters?.puntaje_depresion ?? 0;
    const a = ctx.find(c => c.name.endsWith('puntaje_ansiedad_contexto'))?.parameters?.puntaje_ansiedad ?? 0;
    const e = ctx.find(c => c.name.endsWith('puntaje_estres_contexto'))?.parameters?.puntaje_estres ?? 0;
    const au = ctx.find(c => c.name.endsWith('puntaje_autoestima_contexto'))?.parameters?.puntaje_autoestima ?? 0;
    const ac = ctx.find(c => c.name.endsWith('puntaje_acoso_contexto'))?.parameters?.puntaje_acoso ?? 0;

    agent.add("📊 *Resumen de resultados de salud mental:*\n");
    agent.add(`- Depresión: ${d}\n- Ansiedad: ${a}\n- Estrés académico: ${e}`);
    agent.add(`- Autoestima: ${au}\n- Acoso escolar: ${ac}`);
    agent.add("\nPuedes mostrar este resultado a tu psicólogo para evaluación más profunda. ¿Deseas un PDF con tu resultado?");
  }

  // Mapeo de intents
  let intentMap = new Map();
  intentMap.set('resultado_depresion', resultadoDepresion);
  intentMap.set('resultado_ansiedad', resultadoAnsiedad);
  intentMap.set('resultado_estres_academico', resultadoEstres);
  intentMap.set('resultado_autoestima', resultadoAutoestima);
  intentMap.set('resultado_acoso', resultadoAcoso);
  intentMap.set('resumen_final_resultados', resumenFinal);

  agent.handleRequest(intentMap);
});
  

    try {
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.fontSize(18).text('Informe de Evaluación de Salud Mental', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Nombre: ${nombre}`);
      doc.text(`Edad: ${edad}`);
      doc.text(`Celular del apoderado: ${celular}`);
      doc.moveDown();

      doc.text(`🧠 Depresión: ${puntajeDepresion} puntos – ${interpretar.depresion(puntajeDepresion)}`);
      doc.text(`😟 Ansiedad: ${puntajeAnsiedad} puntos – ${interpretar.ansiedad(puntajeAnsiedad)}`);
      doc.text(`📚 Estrés Académico: ${puntajeEstres} puntos – ${interpretar.estres(puntajeEstres)}`);
      doc.text(`💪 Autoestima: ${puntajeAutoestima} puntos – ${interpretar.autoestima(puntajeAutoestima)}`);
      doc.text(`🚨 Acoso Escolar: ${puntajeBullying} puntos – ${interpretar.bullying(puntajeBullying)}`);

      doc.moveDown();
      doc.font("Helvetica-Bold").text("📝 Diagnóstico general:", { underline: true });
      doc.font("Helvetica").text(diagnosticoGeneral);
      doc.moveDown();

      doc.text("Este informe ha sido generado automáticamente por el sistema de evaluación de salud mental. Se recomienda revisar los resultados con un especialista.");
      doc.end();

      writeStream.on("finish", () => {
        const dominio = req.headers.host || "localhost:3000";
        const pdfUrl = `http://${dominio}/pdfs/${encodeURIComponent(nombreArchivo)}_resultado.pdf`;

        res.json({
          fulfillmentMessages: [
            {
              text: { text: [`📄 Tu informe está listo. Puedes descargarlo desde aquí: ${pdfUrl}`] }
            },
            {
              text: { text: [`📌 Diagnóstico general: ${diagnosticoGeneral}`] }
            },
            {
              text: { text: [`✨ Gracias por completar el test. Recuerda que estos resultados son orientativos. Si lo necesitas, no dudes en buscar ayuda profesional. ¡Cuida tu salud mental! 💚`] }
            }
          ]
        });
      });
    } catch (error) {
      console.error("❌ Error al generar el PDF:", error);
      res.json({ fulfillmentText: "⚠️ Ocurrió un error al generar el informe. Intenta nuevamente más tarde." });
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
    res.json({ fulfillmentText: "❓ No entendí tu solicitud. ¿Puedes repetirla?" });
  }
});

// 🟢 INICIO DEL SERVIDOR
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});

