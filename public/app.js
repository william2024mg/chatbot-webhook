// public/app.js
const $ = (id) => document.getElementById(id);
const msgs = $("msgs");
const q = $("q");
const send = $("send");
const statusEl = $("status");

// Helpers UI
function addMsg(text, who = "bot") {
  const div = document.createElement("div");
  div.className = "msg " + (who === "me" ? "me" : "bot");
  div.innerText = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
function setStatus(t) { statusEl.innerText = t; }

// Comprobar sesión (JWT por cookie) — usa tu middleware autorizarWebhook
async function checkMe() {
  try {
    const r = await fetch("/auth/me", { method: "GET" });
    if (!r.ok) throw 0;
    const d = await r.json();
    if (d.ok && d.user) {
      setStatus(`Sesión ok: ${d.user.alumno} (${d.user.grado})`);
    } else {
      setStatus("Sin sesión");
    }
  } catch {
    setStatus("Sin sesión");
  }
}

// Enviar texto al mismo webhook que usa Dialogflow (tu servidor adapta el formato).
async function sendText(text) {
  addMsg(text, "me");
  try {
    const r = await fetch("/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // El servidor detecta si NO viene de Dialogflow y transforma al formato interno.
      body: JSON.stringify({ queryText: text })
    });
    const data = await r.json();
    const out = data.fulfillmentText || (data.fulfillmentMessages || [])
      .map(m => (m.text && m.text.text && m.text.text[0]) || "")
      .join("\n");
    addMsg(out || "Sin respuesta");
  } catch (e) {
    addMsg("Error al conectar con el servidor.");
  }
}

// Eventos
send.onclick = () => { if (q.value.trim()) { sendText(q.value.trim()); q.value = ""; q.focus(); } };
q.addEventListener("keydown", (e) => { if (e.key === "Enter") send.onclick(); });
$("bInicio").onclick = () => sendText("inicio");
$("bSi").onclick = () => sendText("sí");

// Ir con token (redirige a /a/<token>, el servidor pone cookie JWT y devuelve index.html)
$("goToken").onclick = () => {
  const t = $("tokenInput").value.trim();
  if (!t) return;
  window.location.href = `/a/${encodeURIComponent(t)}`;
};

// Login usuario/clave
$("loginBtn").onclick = async () => {
  const user = $("user").value.trim();
  const pass = $("pass").value.trim();
  if (!user || !pass) return addMsg("Completa usuario y contraseña.");
  try {
    const r = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass })
    });
    const d = await r.json();
    if (!r.ok || !d.ok) return addMsg("Credenciales inválidas.");
    addMsg(`Bienvenido, ${d.alumno} (${d.grado}). Ya puedes escribir "inicio".`);
    checkMe();
  } catch {
    addMsg("No se pudo iniciar sesión.");
  }
};

// Al cargar
checkMe();
addMsg("👋 Hola, escribe “inicio” para comenzar.");
