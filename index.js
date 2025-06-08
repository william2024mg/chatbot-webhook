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
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Payload } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function obtenerPuntaje(agent, parametros) {
    let puntaje = 0;
    for (let i = 0; i < parametros.length; i++) {
      const valor = parseInt(agent.parameters[parametros[i]]);
      if (!isNaN(valor)) {
        puntaje += valor;
      }
    }
    return puntaje;
  }

  function calcularResultado(agent, parametros, nombrePuntaje) {
    const puntaje = obtenerPuntaje(agent, parametros);
    agent.context.set({ name: 'contexto_' + nombrePuntaje, lifespan: 50, parameters: { [nombrePuntaje]: puntaje } });
    agent.add(`Tu puntaje en este módulo es: ${puntaje}`);
    return agent;
  }

  function resultadoDepresion(agent) {
    return calcularResultado(agent, [
      'p1_depresion', 'p2_depresion', 'p3_depresion',
      'p4_depresion', 'p5_depresion', 'p6_depresion',
      'p7_depresion', 'p8_depresion', 'p9_depresion'
    ], 'puntaje_depresion');
  }

  function resultadoAnsiedad(agent) {
    return calcularResultado(agent, [
      'p1_ansiedad', 'p2_ansiedad', 'p3_ansiedad',
      'p4_ansiedad', 'p5_ansiedad', 'p6_ansiedad',
      'p7_ansiedad'
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

  function resultadoHabilidades(agent) {
    return calcularResultado(agent, [
      'p1_habilidades', 'p2_habilidades', 'p3_habilidades',
      'p4_habilidades', 'p5_habilidades', 'p6_habilidades'
    ], 'puntaje_habilidades');
  }

  function resultadoSueno(agent) {
    return calcularResultado(agent, [
      'p1_sueno', 'p2_sueno', 'p3_sueno',
      'p4_sueno', 'p5_sueno', 'p6_sueno'
    ], 'puntaje_sueno');
  }

  function resultadoAcoso(agent) {
    return calcularResultado(agent, [
      'p1_acoso', 'p2_acoso', 'p3_acoso',
      'p4_acoso', 'p5_acoso', 'p6_acoso'
    ], 'puntaje_acoso');
  }

  function resumenFinal(agent) {
    const contextos = [
      'contexto_puntaje_depresion',
      'contexto_puntaje_ansiedad',
      'contexto_puntaje_estres',
      'contexto_puntaje_autoestima',
      'contexto_puntaje_habilidades',
      'contexto_puntaje_sueno',
      'contexto_puntaje_acoso'
    ];

    const resultados = {};
    for (const contexto of contextos) {
      const ctx = agent.context.get(contexto);
      if (ctx && ctx.parameters) {
        const nombrePuntaje = Object.keys(ctx.parameters)[0];
        resultados[nombrePuntaje] = ctx.parameters[nombrePuntaje];
      }
    }

    let mensaje = '**Resumen de resultados:**\n';
    for (const clave in resultados) {
      mensaje += `- ${clave.replace('puntaje_', '')}: ${resultados[clave]}\n`;
    }

    agent.add(mensaje);
  }

  let intentMap = new Map();
  intentMap.set('resultado_depresion', resultadoDepresion);
  intentMap.set('resultado_ansiedad', resultadoAnsiedad);
  intentMap.set('resultado_estres', resultadoEstres);
  intentMap.set('resultado_autoestima', resultadoAutoestima);
  intentMap.set('resultado_habilidades', resultadoHabilidades);
  intentMap.set('resultado_sueno', resultadoSueno);
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

