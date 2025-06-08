const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(req.body));

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

app.listen(port, () => {
  console.log(`Servidor webhook escuchando en el puerto ${port}`);
});

