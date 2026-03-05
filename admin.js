// admin.js — Admin panel + Firebase Realtime Database

import { db } from './firebase-config.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── CONFIG ───────────────────────────────────────────────
const ADMIN_PASSWORD = "garer2026"; // cambia questa!

const DEFAULT_EVENT = {
  name: "PROSSIMA DATA GARER",
  date: "",
  link: "https://chat.whatsapp.com/JvbMyrgzRMY821vF3Wt4Uu",
  desc: "",
  img: "assets/sample_evento.jpeg"
};

const DEFAULT_GALLERY = {
  "Halloween Night": {
    date: "03/10/25",
    link: "https://drive.google.com/drive/folders/1DKl5iXO1iY7BD2zIvDxZuDovQdhMBJWK",
    foto_evidenza: [
      "https://drive.google.com/file/d/1XZBORvd-imrbRw_xmDc4BovfMx5UoL5F/view",
      "https://drive.google.com/file/d/141uXwAXyfHeBnhm0v2QjhB152XVbNZ0q/view",
      "https://drive.google.com/file/d/1np_f51YLGOMAW8swImX6ZS9MoxvqvRUN/view"
    ]
  },
  "Spring Break": {
    date: "22/01/26",
    link: "https://drive.google.com/drive/folders/XXXXX4",
    foto_evidenza: []
  },
  "21/02/2026": {
    date: "21/02/26",
    link: "https://drive.google.com/drive/folders/1arOXGxCaPtWRlCq_bJL2Hb16YSzcqFqN",
    foto_evidenza: [
      "https://drive.google.com/file/d/13Ckx39ks4U8WWn1TWUfn_wfyuH2OnV9L/view",
      "https://drive.google.com/file/d/1tUXMFn6DTnNqU-Q9izKci104Hy08mohw/view",
      "https://drive.google.com/file/d/1qq-YKMai3iQKqpBWopRlT9j4fnfD77tl/view"
    ]
  }
};

// ── AUTH ─────────────────────────────────────────────────
const loginOverlay  = document.getElementById("loginOverlay");
const adminContent  = document.getElementById("adminContent");
const loginBtn      = document.getElementById("loginBtn");
const logoutBtn     = document.getElementById("logoutBtn");
const adminPwdInput = document.getElementById("adminPwd");
const loginError    = document.getElementById("loginError");

function checkSession() {
  if (sessionStorage.getItem("garerAdmin") === "1") showAdmin();
}

loginBtn.addEventListener("click", () => {
  if (adminPwdInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem("garerAdmin", "1");
    loginError.style.display = "none";
    showAdmin();
  } else {
    loginError.style.display = "block";
    adminPwdInput.value = "";
  }
});

adminPwdInput.addEventListener("keydown", e => { if (e.key === "Enter") loginBtn.click(); });

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("garerAdmin");
  location.reload();
});

async function showAdmin() {
  loginOverlay.style.display = "none";
  adminContent.style.display = "flex";
  await loadEventForm();
  await loadGalleryEditor();
}

checkSession();

// ── NEXT EVENT ───────────────────────────────────────────
async function loadEventForm() {
  let ev = DEFAULT_EVENT;
  try {
    const snap = await get(ref(db, 'nextEvent'));
    if (snap.exists()) ev = snap.val();
  } catch {}

  document.getElementById("evtName").value = ev.name || "";
  document.getElementById("evtDate").value = ev.date || "";
  document.getElementById("evtLink").value = ev.link || "";
  document.getElementById("evtDesc").value = ev.desc || "";
  document.getElementById("evtImg").value  = ev.img  || "";
  updateImgPreview(ev.img);
}

document.getElementById("evtImg").addEventListener("input", e => updateImgPreview(e.target.value));

function updateImgPreview(url) {
  const box = document.getElementById("evtImgPreview");
  box.innerHTML = url ? `<img src="${url}" alt="Preview" onerror="this.style.display='none'" />` : "";
}

document.getElementById("saveEventBtn").addEventListener("click", async () => {
  const ev = {
    name: document.getElementById("evtName").value.trim(),
    date: document.getElementById("evtDate").value.trim(),
    link: document.getElementById("evtLink").value.trim(),
    desc: document.getElementById("evtDesc").value.trim(),
    img:  document.getElementById("evtImg").value.trim()
  };
  try {
    await set(ref(db, 'nextEvent'), ev);
    showMsg("eventSaveMsg");
  } catch {
    alert("Errore nel salvataggio. Controlla la connessione.");
  }
});

document.getElementById("resetEventBtn").addEventListener("click", async () => {
  await set(ref(db, 'nextEvent'), DEFAULT_EVENT);
  await loadEventForm();
});

// ── GALLERY EDITOR ────────────────────────────────────────
async function loadGalleryEditor() {
  let gallery = DEFAULT_GALLERY;
  try {
    const snap = await get(ref(db, 'gallery'));
    if (snap.exists()) {
      gallery = snap.val();
      Object.values(gallery).forEach(ev => {
        if (ev.foto_evidenza && !Array.isArray(ev.foto_evidenza)) {
          ev.foto_evidenza = Object.values(ev.foto_evidenza);
        } else if (!ev.foto_evidenza) {
          ev.foto_evidenza = [];
        }
      });
    }
  } catch {}

  const container = document.getElementById("galleryEditor");
  container.innerHTML = "";
  Object.entries(gallery).forEach(([name, data]) => {
    container.appendChild(buildEventCard(name, data));
  });
}

function buildEventCard(name, data) {
  const card = document.createElement("div");
  card.className = "gallery-event-card";
  card.dataset.key = name;

  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">📅 ${name}</span>
      <button class="btn btn--danger btn--sm" data-action="deleteEvent">🗑 Rimuovi</button>
    </div>
    <div class="fields-grid">
      <div class="field">
        <label>Nome Serata</label>
        <input type="text" data-field="name" value="${name}" />
      </div>
      <div class="field">
        <label>Data (gg/mm/aa)</label>
        <input type="text" data-field="date" value="${data.date || ""}" />
      </div>
      <div class="field full">
        <label>Link Google Drive</label>
        <input type="url" data-field="link" value="${data.link || ""}" />
      </div>
    </div>
    <div class="field full" style="padding:0 0 4px">
      <label>Foto Evidenza (URL)</label>
      <div class="foto-list" data-fotolist>
        ${(data.foto_evidenza || []).map(url => fotoRow(url)).join("")}
      </div>
      <button class="btn btn--sm" data-action="addFoto" style="margin-top:8px; width:fit-content">＋ Aggiungi Foto</button>
    </div>
  `;

  card.querySelector("[data-action='deleteEvent']").addEventListener("click", () => {
    if (confirm(`Rimuovere la serata "${name}"?`)) card.remove();
  });

  card.querySelector("[data-action='addFoto']").addEventListener("click", () => {
    card.querySelector("[data-fotolist]").insertAdjacentHTML("beforeend", fotoRow(""));
    bindFotoRemove(card);
  });

  bindFotoRemove(card);
  return card;
}

function fotoRow(url) {
  return `
    <div class="foto-row">
      <input type="url" placeholder="https://drive.google.com/..." value="${url}" />
      <button class="btn btn--danger btn--sm" data-action="removeFoto">✕</button>
    </div>`;
}

function bindFotoRemove(card) {
  card.querySelectorAll("[data-action='removeFoto']").forEach(btn => {
    btn.onclick = () => btn.closest(".foto-row").remove();
  });
}

document.getElementById("addEventBtn").addEventListener("click", () => {
  const name = prompt("Nome della nuova serata:");
  if (!name || !name.trim()) return;
  document.getElementById("galleryEditor")
    .appendChild(buildEventCard(name.trim(), { date: "", link: "", foto_evidenza: [] }));
});

document.getElementById("saveGalleryBtn").addEventListener("click", async () => {
  const gallery = {};
  document.querySelectorAll(".gallery-event-card").forEach(card => {
    const nameInput = card.querySelector("[data-field='name']");
    const name = nameInput ? nameInput.value.trim() : card.dataset.key;
    if (!name) return;
    gallery[name] = {
      date: card.querySelector("[data-field='date']")?.value.trim() || "",
      link: card.querySelector("[data-field='link']")?.value.trim() || "",
      foto_evidenza: [...card.querySelectorAll("[data-fotolist] input")]
        .map(i => i.value.trim()).filter(Boolean)
    };
  });

  try {
    await set(ref(db, 'gallery'), gallery);
    showMsg("gallerySaveMsg");
  } catch {
    alert("Errore nel salvataggio. Controlla la connessione.");
  }
});

document.getElementById("resetGalleryBtn").addEventListener("click", async () => {
  if (confirm("Ripristinare la gallery ai valori di default?")) {
    await set(ref(db, 'gallery'), DEFAULT_GALLERY);
    await loadGalleryEditor();
  }
});

// ── UTILS ────────────────────────────────────────────────
function showMsg(id) {
  const el = document.getElementById(id);
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 3000);
}
