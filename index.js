// === DEPENDENCIAS ===
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();

process.env.DEBUG = 'dialogflow:debug';
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

// === INTENT DE PRUEBA SIMPLE ===
function pruebaWebhook(agent) {
  console.log("✅ Webhook está funcionando correctamente.");
  agent.add("👋 Hola desde el webhook. Todo está bien.");
}

// === MAPEO DE INTENTS ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('✅ Webhook recibido desde Dialogflow');

  const intentMap = new Map();
  intentMap.set('prueba_webhook', pruebaWebhook); // Este intent lo crearás tú

  agent.handleRequest(intentMap);
});

// === INICIO DEL SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});













