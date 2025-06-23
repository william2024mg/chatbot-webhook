// === DEPENDENCIAS ===
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();

const PDFDocument = require('pdfkit');

process.env.DEBUG = 'dialogflow:debug';
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

// === FUNCIONES GENERALES ===
function inicioDiagnostico(agent) {
  const { nombre, edad, celular_apoderado } = agent.parameters;
  agent.context.set({
    name: 'contexto_datos_alumno',
    lifespan: 50,
    parameters: { nombre, edad, celular_apoderado }
  });
  agent.add(`✅ Datos registrados:
• Nombre: ${nombre}
• Edad: ${edad}
• Celular del apoderado: ${celular_apoderado}

Empecemos con la evaluación. 🧠`);
  agent.setContext({
  name: 'contexto_depresion_inicio',
  lifespan: 5
});
}

function calcularPuntajeBloque(agent, claves, variableGlobal) {
  let total = 0;
  for (const clave of claves) {
    const valor = parseInt(agent.parameters[clave] || 0);
    total += valor;
  }
  agent.context.set({
    name: variableGlobal,
    lifespan: 50,
    parameters: { total }
  });
  return total;
}

// === INTERPRETACIONES ===
function interpretarDepresion(p) {
  if (p <= 4) return "mínima o nula";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  if (p <= 19) return "moderadamente severa";
  return "severa";
}

function interpretarAnsiedad(p) {
  if (p <= 4) return "mínima";
  if (p <= 9) return "leve";
  if (p <= 14) return "moderada";
  return "severa";
}

function interpretarEstres(p) {
  if (p <= 5) return "leve";
  if (p <= 10) return "moderado";
  return "alto";
}

function interpretarAutoestima(p) {
  if (p <= 8) return "baja";
  if (p <= 16) return "media";
  return "alta";
}

function interpretarAcoso(p) {
  if (p <= 5) return "mínimo o inexistente";
  if (p <= 10) return "ocasional";
  return "frecuente";
}

// === BLOQUES DE RESULTADOS ===
   function resultadoDepresion(agent) {
  const p1 = parseInt(agent.parameters.p1_depresion || 0);
  const p2 = parseInt(agent.parameters.p2_depresion || 0);
  const p3 = parseInt(agent.parameters.p3_depresion || 0);
  const p4 = parseInt(agent.parameters.p4_depresion || 0);
  const p5 = parseInt(agent.parameters.p5_depresion || 0);
  const p6 = parseInt(agent.parameters.p6_depresion || 0);
  const p7 = parseInt(agent.parameters.p7_depresion || 0);
  const p8 = parseInt(agent.parameters.p8_depresion || 0);
  const p9 = parseInt(agent.parameters.p9_depresion || 0);

  const total = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
  let interpretacion = '';

  if (total <= 4) {
    interpretacion = 'Depresión mínima';
  } else if (total <= 9) {
    interpretacion = 'Depresión leve';
  } else if (total <= 14) {
    interpretacion = 'Depresión moderada';
  } else if (total <= 19) {
    interpretacion = 'Depresión moderadamente severa';
  } else {
    interpretacion = 'Depresión severa';
  }

  agent.add(`✅ Resultado del test PHQ-9:`);
  agent.add(`Puntaje total: ${total}`);
  agent.add(`Nivel de depresión: ${interpretacion}`);
  
// Guardar total de depresión
agent.setContext({
  name: 'contexto_depresion',
  lifespan: 5,
  parameters: { total }
});

// Activar siguiente bloque: ansiedad
     agent.add(`¿Deseas continuar con el siguiente bloque? (Responde: Sí / No)`);
agent.setContext({
  name: 'contexto_ansiedad_inicio',
  lifespan: 5
});
}

function resultadoAnsiedad(agent) {
    const p1 = parseInt(agent.parameters.p1_ansiedad || 0);
    const p2 = parseInt(agent.parameters.p2_ansiedad || 0);
    const p3 = parseInt(agent.parameters.p3_ansiedad || 0);
    const p4 = parseInt(agent.parameters.p4_ansiedad || 0);
    const p5 = parseInt(agent.parameters.p5_ansiedad || 0);
    const p6 = parseInt(agent.parameters.p6_ansiedad || 0);
    const p7 = parseInt(agent.parameters.p7_ansiedad || 0);

    const total = p1 + p2 + p3 + p4 + p5 + p6 + p7;
    let interpretacion = '';

    if (total <= 4) {
      interpretacion = 'Ansiedad mínima';
    } else if (total <= 9) {
      interpretacion = 'Ansiedad leve';
    } else if (total <= 14) {
      interpretacion = 'Ansiedad moderada';
    } else {
      interpretacion = 'Ansiedad severa';
    }

    agent.add(`✅ Resultado del test GAD-7:`);
    agent.add(`Puntaje total: ${total}`);
    agent.add(`Nivel de ansiedad: ${interpretacion}`);
    agent.add(`¿Deseas continuar con el siguiente bloque? (Responde: Sí / No)`);

   // Guardar total de ansiedad
agent.setContext({
  name: 'contexto_ansiedad',
  lifespan: 5,
  parameters: { total }
});

// Activar siguiente bloque: estrés académico
agent.setContext({
  name: 'contexto_estres_inicio',
  lifespan: 5
});
  }

function resultadoEstres(agent) {
  const p1 = parseInt(agent.parameters.p1_estres);
  const p2 = parseInt(agent.parameters.p2_estres);
  const p3 = parseInt(agent.parameters.p3_estres);
  const p4 = parseInt(agent.parameters.p4_estres);
  const p5 = parseInt(agent.parameters.p5_estres);
  const p6 = parseInt(agent.parameters.p6_estres);

  const total = p1 + p2 + p3 + p4 + p5 + p6;

  let nivel = "";
  if (total <= 6) {
    nivel = "Bajo";
  } else if (total <= 12) {
    nivel = "Moderado";
  } else {
    nivel = "Alto";
  }

  agent.add(`📊 Tu puntaje total en estrés académico es: *${total}* puntos.`);
  agent.add(`🔎 Nivel de estrés académico detectado: *${nivel}*.`);
  agent.add(`➡️ Ahora continuaremos con el siguiente bloque: Autoestima.`);

  // Activar contexto de inicio para el siguiente bloque:
  
  agent.setContext({
    name: "contexto_autoestima_inicio",
    lifespan: 5,
  });

 // Guardar total de estrés académico
  agent.setContext({
  name: 'contexto_estres',
  lifespan: 5,
  parameters: { total }
});
}

function resultadoAutoestima(agent) {
  const p1 = parseInt(agent.parameters.p1_autoestima);
  const p2 = parseInt(agent.parameters.p2_autoestima);
  const p3 = parseInt(agent.parameters.p3_autoestima);
  const p4 = parseInt(agent.parameters.p4_autoestima);
  const p5 = parseInt(agent.parameters.p5_autoestima);
  const p6 = parseInt(agent.parameters.p6_autoestima);

  const total = p1 + p2 + p3 + p4 + p5 + p6;

  let interpretacion = "";

  if (total <= 6) {
    interpretacion = "Autoestima muy baja.";
  } else if (total <= 12) {
    interpretacion = "Autoestima baja.";
  } else if (total <= 18) {
    interpretacion = "Autoestima media.";
  } else {
    interpretacion = "Autoestima alta.";
  }

  agent.add(`Tu puntaje total de autoestima es: ${total} puntos. ${interpretacion}`);

  // Opcional: puedes agregar transición al siguiente bloque
  agent.add("Ahora continuaremos con las siguientes preguntas.");
  
  // Guardar total de autoestima
agent.setContext({
  name: 'contexto_autoestima',
  lifespan: 5,
  parameters: { total }
});

// Activar siguiente bloque: acoso escolar
agent.setContext({
  name: 'contexto_acoso_inicio',
  lifespan: 5
});
}

function resultadoAcosoEscolar(agent) {
  const p1 = parseInt(agent.parameters.p1_acosoescolar);
  const p2 = parseInt(agent.parameters.p2_acosoescolar);
  const p3 = parseInt(agent.parameters.p3_acosoescolar);
  const p4 = parseInt(agent.parameters.p4_acosoescolar);
  const p5 = parseInt(agent.parameters.p5_acosoescolar);
  const p6 = parseInt(agent.parameters.p6_acosoescolar);

  const total = p1 + p2 + p3 + p4 + p5 + p6;

  let interpretacion = "";

  if (total <= 4) {
    interpretacion = "un nivel bajo de acoso escolar.";
  } else if (total <= 8) {
    interpretacion = "un nivel moderado de acoso escolar.";
  } else {
    interpretacion = "un nivel alto de acoso escolar.";
  }

  agent.add(`Tu puntaje total de acoso escolar es: ${total} puntos. Esto indica ${interpretacion}`);
  agent.add("Si has experimentado alguna de estas situaciones, recuerda que no estás solo. Habla con un docente, familiar o especialista.");
 
  // Guardar total de acoso escolar
agent.setContext({
  name: 'contexto_acoso',
  lifespan: 5,
  parameters: { total }
});

// Activar bloque final (resumen del diagnóstico)
agent.setContext({
  name: 'contexto_resultado_final',
  lifespan: 5
});
}

// === RESUMEN FINAL ===
function resultadoFinal(agent) {
  const depresion = agent.getContext('contexto_depresion')?.parameters?.total || 0;
  const ansiedad = agent.getContext('contexto_ansiedad')?.parameters?.total || 0;
  const estres = agent.getContext('contexto_estres')?.parameters?.total || 0;
  const autoestima = agent.getContext('contexto_autoestima')?.parameters?.total || 0;
  const acoso = agent.getContext('contexto_acoso')?.parameters?.total || 0;

  const { nombre, edad, celular_apoderado } = agent.getContext('contexto_datos_alumno')?.parameters || {};

  const resumen = `
📝 *Resumen de diagnóstico*:
🔹 Depresión: ${depresion} - Nivel: ${interpretarDepresion(depresion)}
🔹 Ansiedad: ${ansiedad} - Nivel: ${interpretarAnsiedad(ansiedad)}
🔹 Estrés académico: ${estres} - Nivel: ${interpretarEstres(estres)}
🔹 Autoestima: ${autoestima} - Nivel: ${interpretarAutoestima(autoestima)}
🔹 Acoso escolar: ${acoso} - Nivel: ${interpretarAcoso(acoso)}
`;

  agent.add(resumen);
  agent.add("Gracias por completar el diagnóstico. Este resultado puede ser revisado por un especialista.");

  // === PDF ===
  const PDFDocument = require('pdfkit');
  const fs = require('fs');
  const path = require('path');

  const filePath = path.join(__dirname, 'public', 'reporte_diagnostico.pdf');
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(16).text('📝 Informe de Diagnóstico', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Nombre: ${nombre}`);
  doc.text(`Edad: ${edad}`);
  doc.text(`Celular del apoderado: ${celular_apoderado}`);
  doc.moveDown();
  doc.fontSize(14).text('Resultados:');
  doc.fontSize(12).text(`Depresión: ${interpretarDepresion(depresion)} (${depresion})`);
  doc.text(`Ansiedad: ${interpretarAnsiedad(ansiedad)} (${ansiedad})`);
  doc.text(`Estrés académico: ${interpretarEstres(estres)} (${estres})`);
  doc.text(`Autoestima: ${interpretarAutoestima(autoestima)} (${autoestima})`);
  doc.text(`Acoso escolar: ${interpretarAcoso(acoso)} (${acoso})`);
  doc.end();

  // Enlace de descarga
  agent.add('📄 Puedes descargar tu informe completo aquí:');
  agent.add('https://https://chatbot-webhook-chij.onrender.com/public/reporte_diagnostico.pdf');
}

// === INTENT MAP ===
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('🧠 Webhook recibido');

  let intentMap = new Map();
  intentMap.set('inicio_diagnostico', inicioDiagnostico);
  intentMap.set('resultado_depresion', resultadoDepresion);
  intentMap.set('resultado_ansiedad', resultadoAnsiedad);
  intentMap.set('resultado_estres', resultadoEstres);
  intentMap.set('resultado_autoestima', resultadoAutoestima);
  intentMap.set('resultado_acosoescolar', resultadoAcosoEscolar);
  intentMap.set('resultado_final', resultadoFinal);

  agent.handleRequest(intentMap);
});

// === INICIO DE SERVIDOR ===
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
});







