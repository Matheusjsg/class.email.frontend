const apiBase = "https://classemailbackend-production.up.railway.app"; 

// ----------------------------
// Upload Drag & Drop
// ----------------------------
const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("emailFile");

dropArea.addEventListener("click", () => fileInput.click());

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragging");
});
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragging");
});
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragging");
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    handleFileUpload(fileInput.files[0]);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    handleFileUpload(fileInput.files[0]);
  }
});

// ----------------------------
// Envio de texto
// ----------------------------
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const text = document.getElementById("emailText").value.trim();
  if (!text) return alert("Digite ou cole o email primeiro!");

  const response = await fetch(`${apiBase}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await response.json();
  showResults(data, text);
});

// ----------------------------
// Função upload de arquivo
// ----------------------------
async function handleFileUpload(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBase}/upload`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  showResults(data, "Arquivo enviado: " + file.name);
}

// ----------------------------
// Exibir resultados
// ----------------------------
function showResults(data, emailText = "") {
  const resultBox = document.getElementById("resultBox");
  resultBox.style.display = "block";

  document.getElementById("resultCategory").className =
    `tag ${data.grupo.toLowerCase()}`;
  document.getElementById("resultCategory").textContent = data.grupo;
  document.getElementById("resultConfidence").textContent =
    `Confiança: ${data.confianca || "80"}%`;
  document.getElementById("respostaEditada").value = data.resposta;

  // --- botão copiar ---
  const copyBtn = document.getElementById("copyBtn");
  const copyMsg = document.getElementById("copyMsg");
  copyBtn.onclick = () => {
    const resposta = document.getElementById("respostaEditada").value;
    navigator.clipboard.writeText(resposta).then(() => {
      copyMsg.style.display = "inline";
      setTimeout(() => (copyMsg.style.display = "none"), 2000);
    });
  };

  // --- feedback ---
  const feedbackDiv = document.getElementById("feedback");
  feedbackDiv.style.display = "block";
  document.getElementById("correctBtn").onclick = () => sendFeedback(true, data, emailText);
  document.getElementById("incorrectBtn").onclick = () => sendFeedback(false, data, emailText);

  // --- histórico ---
  addToHistory(data);
}

// ----------------------------
// Envio do feedback para o backend
// ----------------------------
async function sendFeedback(correto, data, emailText) {
  const respostaEditada = document.getElementById("respostaEditada").value;

  const formData = new FormData();
  formData.append("email_text", emailText);
  formData.append("grupo", data.grupo);
  formData.append("categoria", data.categoria);
  formData.append("resposta", respostaEditada);
  formData.append("correto", correto);

  await fetch(`${apiBase}/feedback`, {
    method: "POST",
    body: formData
  });

  alert("✅ Obrigado pelo feedback!");
  document.getElementById("feedback").style.display = "none";
}

// ----------------------------
// Histórico + estatísticas
// ----------------------------
let totalProd = 0, totalImp = 0, somaConf = 0, totalEmails = 0;

function addToHistory(data) {
  const historyList = document.getElementById("historyList");

  totalEmails++;
  somaConf += parseInt(data.confianca || 80);
  if (data.grupo.toLowerCase() === "produtivo") totalProd++;
  else totalImp++;

  document.getElementById("countProd").textContent = totalProd;
  document.getElementById("countImp").textContent = totalImp;
  document.getElementById("avgConf").textContent =
    `${Math.round(somaConf / totalEmails)}%`;

  const entry = document.createElement("div");
  entry.classList.add("entry");
  entry.innerHTML = `
    <span class="tag ${data.grupo.toLowerCase()}">${data.grupo}</span>
    <span class="tag">${data.categoria}</span>
    <p><strong>Resposta:</strong><br>${data.resposta}</p>
    <small>Confiança: ${data.confianca || "80"}%</small>
  `;
  historyList.prepend(entry);
}
