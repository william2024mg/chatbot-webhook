// index.js
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000; // Usamos el puerto asignado por Render

app.use(bodyParser.json());

// Ruta para probar si el servidor está activo
app.get("/", (req, res) => {
  res.send("✅ Servidor de Chatbot activo");
});

// Ruta del webhook para Dialogflow
app.post("/webhook", (req, res) => {
  const body = req.body;
  console.log("📥 Webhook recibido:", JSON.stringify(body, null, 2));

  const intentName = body.queryResult.intent.displayName;

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
          lifespanCount: 1,
          parameters: {}
        }
      ]
    });
  } else {
    // Respuesta por defecto para otros intents
    res.json({
      fulfillmentText: "Respuesta desde webhook de William 💬"
    });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});
