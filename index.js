const express = require("express");
const bodyParser = require("body-parser");
const { WebhookClient } = require("dialogflow-fulfillment");
const functions = require("firebase-functions");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  let intentMap = new Map();
  intentMap.set("resultado_depresion", resultadoDepresion);
  intentMap.set("resultado_ansiedad", resultadoAnsiedad);
  intentMap.set("resultado_estres", resultadoEstres);
  intentMap.set("resultado_autoestima", resultadoAutoestima);
  intentMap.set("resultado_habilidades", resultadoHabilidades);
  intentMap.set("resultado_sueno", resultadoSueno);
  intentMap.set("resultado_acoso", resultadoAcoso);
  intentMap.set("resumen_final_resultados", resumenFinal);

  agent.handleRequest(intentMap);
});

app.listen(PORT, () => {
  console.log(`Servidor webhook escuchando en el puerto ${PORT}`);
});

// === FUNCIONES GENERALES ===

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
  agent.context.set({
    name: "contexto_" + nombrePuntaje,
    lifespan: 50,
    parameters: { [nombrePuntaje]: puntaje },
  });
  agent.add(`Tu puntaje en este módulo es: ${puntaje}`);
  return agent;
}

// === INTENTS INDIVIDUALES ===

function resultadoDepresion(agent) {
  return calcularResultado(agent, [
    "p1_depresion",
    "p2_depresion",
    "p3_depresion",
    "p4_depresion",
    "p5_depresion",
    "p6_depresion",
    "p7_depresion",
    "p8_depresion",
    "p9_depresion",
  ], "puntaje_depresion");
}

function resultadoAnsiedad(agent) {
  const context = agent.context.get("contexto_respuestas_ansiedad");

  const p1 = context?.parameters?.p1_ansiedad || 0;
  const p2 = context?.parameters?.p2_ansiedad || 0;
  const p3 = context?.parameters?.p3_ansiedad || 0;
  const p4 = context?.parameters?.p4_ansiedad || 0;
  const p5 = context?.parameters?.p5_ansiedad || 0;
  const p6 = context?.parameters?.p6_ansiedad || 0;
  const p7 = context?.parameters?.p7_ansiedad || 0;

  const puntaje = p1 + p2 + p3 + p4 + p5 + p6 + p7;

  let nivel = "";
  if (puntaje <= 4) nivel = "mínimo";
  else if (puntaje <= 9) nivel = "leve";
  else if (puntaje <= 14) nivel = "moderado";
  else nivel = "severo";

  agent.context.set({
    name: "contexto_puntaje_ansiedad",
    lifespan: 50,
    parameters: { puntaje_ansiedad: puntaje },
  });

  const mensaje = `Tu puntaje total de ansiedad (GAD-7) es ${puntaje}. Nivel de ansiedad: ${nivel}. Esto indica que tu nivel de ansiedad es ${nivel}.`;
  agent.add(mensaje);
}

// Resto de las funciones (resultadoEstres, resultadoAutoestima, etc.) sin cambios

// === CONFIGURACIÓN PARA FIREBASE FUNCTIONS ===

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  let intentMap = new Map();
  intentMap.set("resultado_depresion", resultadoDepresion);
  intentMap.set("resultado_ansiedad", resultadoAnsiedad);
  intentMap.set("resultado_estres", resultadoEstres);
  intentMap.set("resultado_autoestima", resultadoAutoestima);
  intentMap.set("resultado_habilidades", resultadoHabilidades);
  intentMap.set("resultado_sueno", resultadoSueno);
  intentMap.set("resultado_acoso", resultadoAcoso);
  intentMap.set("resumen_final_resultados", resumenFinal);

  agent.handleRequest(intentMap);
});

app.listen(port, () => {
  console.log(`Servidor webhook escuchando en el puerto ${port}`);
});




