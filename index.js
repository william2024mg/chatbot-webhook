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

  res.json({
    fulfillmentText: "Respuesta desde webhook de William 💬"
  });
});

app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});
