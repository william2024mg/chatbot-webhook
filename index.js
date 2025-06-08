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

    if (parametroFinal === 'puntaje_social') {
      if (total <= 6) nivel = "Deficiente";
      else if (total <= 12) nivel = "Adecuado";
      else nivel = "Óptimo";
      mensaje = `Nivel de habilidades sociales: *${nivel}* (Puntaje: ${total})`;
    }

    if (parametroFinal === 'puntaje_sueno') {
      if (total <= 6) nivel = "Normal";
      else if (total <= 12) nivel = "Problemas moderados";
      else nivel = "Problemas severos";
      mensaje = `Nivel de trastornos del sueño: *${nivel}* (Puntaje: ${total})`;
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

  function resultadoHabilidades(agent) {
    return calcularResultado(agent, [
      'p1_social', 'p2_social', 'p3_social',
      'p4_social', 'p5_social', 'p6_social'
    ], 'puntaje_social');
  }

  function resultadoSueno(agent) {
    return calcularResultado(agent, [
      'p1_sueno', 'p2_sueno', 'p3_sueno',
      'p4_sueno', 'p5_sueno', 'p6_sueno'
    ], 'puntaje_sueno');
  }

  // Función final que resume los resultados de todos los ítems
  function resumenFinal(agent) {
    const ctx = agent.contexts;

    const d = ctx.find(c => c.name.endsWith('puntaje_depresion_contexto'))?.parameters?.puntaje_depresion ?? 0;
    const a = ctx.find(c => c.name.endsWith('puntaje_ansiedad_contexto'))?.parameters?.puntaje_ansiedad ?? 0;
    const e = ctx.find(c => c.name.endsWith('puntaje_estres_contexto'))?.parameters?.puntaje_estres ?? 0;
    const au = ctx.find(c => c.name.endsWith('puntaje_autoestima_contexto'))?.parameters?.puntaje_autoestima ?? 0;
    const ac = ctx.find(c => c.name.endsWith('puntaje_acoso_contexto'))?.parameters?.puntaje_acoso ?? 0;
    const h = ctx.find(c => c.name.endsWith('puntaje_social_contexto'))?.parameters?.puntaje_social ?? 0;
    const s = ctx.find(c => c.name.endsWith('puntaje_sueno_contexto'))?.parameters?.puntaje_sueno ?? 0;

    agent.add("📊 *Resumen de resultados de salud mental:*\n");
    agent.add(`- Depresión: ${d}\n- Ansiedad: ${a}\n- Estrés académico: ${e}`);
    agent.add(`- Autoestima: ${au}\n- Acoso escolar: ${ac}\n- Habilidades sociales: ${h}\n- Trastornos del sueño: ${s}`);
    agent.add("\nPuedes mostrar este resultado a tu psicólogo para evaluación más profunda. ¿Deseas un PDF con tu resultado?");
  }

  // Mapeo de todos los intents
  let intentMap = new Map();
  intentMap.set('resultado_depresion', resultadoDepresion);
  intentMap.set('resultado_ansiedad', resultadoAnsiedad);
  intentMap.set('resultado_estres_academico', resultadoEstres);
  intentMap.set('resultado_autoestima', resultadoAutoestima);
  intentMap.set('resultado_acoso', resultadoAcoso);
  intentMap.set('resultado_habilidades_sociales', resultadoHabilidades);
  intentMap.set('resultado_trastorno_sueno', resultadoSueno);
  intentMap.set('resumen_final_resultados', resumenFinal);

  agent.handleRequest(intentMap);
});
