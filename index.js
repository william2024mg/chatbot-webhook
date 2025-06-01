/ index.js
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("✅ Servidor de Chatbot activo");
});

// Webhook principal
app.post("/webhook", (req, res) => {
  const body = req.body;
  console.log("📥 Webhook recibido:", JSON.stringify(body, null, 2));

  const intentName = body.queryResult.intent.displayName;

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
  } else if (intentName === "resumen_final_resultados") {
    const pDepresion = body.queryResult.parameters["puntaje_depresion"];
    const pAnsiedad = body.queryResult.parameters["puntaje_ansiedad"];
    const pEstres = body.queryResult.parameters["puntaje_estres"];
    const pAutoestima = body.queryResult.parameters["puntaje_autoestima"];
    const pHabilidades = body.queryResult.parameters["puntaje_habilidades"];
    const pSueno = body.queryResult.parameters["puntaje_sueno"];
    const pBullying = body.queryResult.parameters["puntaje_bullying"];

    const resumen = `
📊 *Resumen Final de Salud Mental del Estudiante*:

1️⃣ *Depresión:* ${pDepresion} puntos  
2️⃣ *Ansiedad:* ${pAnsiedad} puntos  
3️⃣ *Estrés Académico:* ${pEstres} puntos  
4️⃣ *Autoestima:* ${pAutoestima} puntos  
5️⃣ *Habilidades Sociales:* ${pHabilidades} puntos  
6️⃣ *Trastornos del Sueño:* ${pSueno} puntos  
7️⃣ *Acoso Escolar:* ${pBullying} puntos  

🔍 Este resumen puede ser revisado por el psicólogo o especialista encargado. Gracias por completar el cuestionario. 🧠✨
`;

    res.json({
      fulfillmentText: resumen,
      outputContexts: [
        {
          name: `${body.session}/contexts/contexto_finalizado`,
          lifespanCount: 1
        }
      ]
    });
  // fallback / respuesta general
  } else {
    res.json({
      fulfillmentText: "Respuesta desde webhook de William 💬"
    });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});
