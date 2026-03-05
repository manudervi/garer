// app.js — Tab system + Firebase Realtime Database

import { db } from './firebase-config.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── DEFAULT FALLBACK ─────────────────────────────────────
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

// ── FIREBASE HELPERS ─────────────────────────────────────
const FirebaseData = {
  async getNextEvent() {
    try {
      const snap = await get(ref(db, 'nextEvent'));
      return snap.exists() ? snap.val() : null;
    } catch { return null; }
  },

  async getGallery() {
    try {
      const snap = await get(ref(db, 'gallery'));
      if (!snap.exists()) return null;
      // Converti foto_evidenza da oggetto Firebase a array
      const raw = snap.val();
      Object.values(raw).forEach(ev => {
        if (ev.foto_evidenza && !Array.isArray(ev.foto_evidenza)) {
          ev.foto_evidenza = Object.values(ev.foto_evidenza);
        } else if (!ev.foto_evidenza) {
          ev.foto_evidenza = [];
        }
      });
      return raw;
    } catch { return null; }
  }
};

// ── UTILS ────────────────────────────────────────────────
const Utils = {
  parseDDMMYY(s) {
    const [dd, mm, yy] = s.split('/').map(Number);
    return new Date(2000 + yy, mm - 1, dd);
  },
  extractDriveFileId(url) {
    const m = String(url).match(/\/file\/d\/([^/]+)/);
    return m ? m[1] : null;
  },
  driveToImgSrc(url, width = 1200) {
    const id = this.extractDriveFileId(url);
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}` : url;
  }
};

// ── TABS ─────────────────────────────────────────────────
class TabManager {
  static init() {
    this.panels   = document.querySelectorAll('.tab-panel');
    this.navLinks = document.querySelectorAll('[data-tab]');
    this.showTab('home');

    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-tab]');
      if (!el) return;
      e.preventDefault();
      this.showTab(el.dataset.tab);
      DrawerManager.close();
    });
  }

  static showTab(name) {
    this.panels.forEach(p => {
      const active = p.dataset.panel === name;
      p.classList.toggle('is-active', active);
      if (active) p.scrollTop = 0;
    });
    this.navLinks.forEach(a =>
      a.classList.toggle('is-active', a.dataset.tab === name)
    );
    this.currentTab = name;
  }
}

// ── DRAWER ───────────────────────────────────────────────
class DrawerManager {
  static init() {
    this.burger   = document.querySelector('.burger');
    this.drawer   = document.querySelector('#drawer');
    this.backdrop = document.querySelector('.backdrop');
    if (!this.burger) return;
    this.burger.addEventListener('click', () => this.toggle());
    this.backdrop.addEventListener('click', () => this.close());
  }

  static toggle() {
    document.body.classList.contains('drawerOpen') ? this.close() : this.open();
  }

  static open() {
    document.body.classList.add('drawerOpen');
    this.burger.setAttribute('aria-expanded', 'true');
    this.drawer.setAttribute('aria-hidden', 'false');
  }

  static close() {
    document.body.classList.remove('drawerOpen');
    this.burger.setAttribute('aria-expanded', 'false');
    this.drawer.setAttribute('aria-hidden', 'true');
  }
}

// ── DATA ─────────────────────────────────────────────────
class DataManager {

  static applyNextEvent(ev) {
    if (!ev) return;

    const label = document.getElementById('nextEventLabel');
    if (label) label.textContent = ev.name + (ev.date ? ' — ' + ev.date : '');

    const desc = document.getElementById('nextEventDesc');
    if (desc) {
      if (ev.desc && ev.desc.trim()) {
        desc.innerHTML = ev.desc.replace(/\n/g, "<br>");
        desc.style.display = 'block';
      } else {
        desc.style.display = 'none';
      }
    }

    if (ev.img) {
      const poster = document.querySelector('.poster img');
      if (poster) poster.src = ev.img;
    }

    if (ev.link) {
      document.querySelectorAll('a[href*="whatsapp"]')
        .forEach(a => a.href = ev.link);
    }
  }

  static renderLastEvents(data) {
    const events = Object.entries(data)
      .map(([nome, info]) => ({
        nome,
        dateObj: Utils.parseDDMMYY(info.date),
        link: info.link,
        foto: Array.isArray(info.foto_evidenza) ? info.foto_evidenza : []
      }))
      .sort((a, b) => b.dateObj - a.dateObj)
      .slice(0, 3);

    const container = document.querySelector('#last3Events');
    if (container) {
      container.innerHTML = events.map(ev => `
        <a class="card" style="box-shadow:none" href="${ev.link}" target="_blank" rel="noopener">
          <div class="card__pad">${ev.nome}</div>
        </a>
      `).join('');
    }

    const collage = document.querySelector('.sideCollage');
    if (collage) {
      const photos = events.flatMap(ev =>
        ev.foto.map(url => ({ src: Utils.driveToImgSrc(url), link: ev.link }))
      );

      if (photos.length === 0) {
        collage.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted)">Nessuna foto</div>`;
      } else {
        collage.innerHTML = photos.map(p => `
          <a href="${p.link}" target="_blank" rel="noopener">
            <img src="${p.src}" alt="" loading="lazy">
          </a>
        `).join('');
        this.fixCollageRows(collage);
      }
    }
  }

  static fixCollageRows(collage) {
    const items = collage.querySelectorAll('a');
    if (!items.length) return;
    const rows = Math.ceil(items.length / 2);
    const gap = 10, padding = 24;
    const rowH = (collage.clientHeight - padding - (rows - 1) * gap) / rows;
    collage.style.setProperty('--rowH', `${rowH}px`);
  }

  static renderFAQ() {
    const faqs = [
      { q: "Come funziona l'ingresso?",  a: "Di solito l'ingresso è su lista. Scrivici su Instagram/WhatsApp e ti confermiamo disponibilità e dettagli." },
      { q: "Età minima e documenti?",    a: "Età minima 18+. Porta un documento valido: all'ingresso potrebbero chiederlo." },
      { q: "Dress code?",               a: "Dark / club vibe consigliato. Evita outfit troppo casual se vuoi entrare easy." },
      { q: "Posso portare amici?",       a: "Sì, ma segnala i nomi prima: i posti sono limitati e la lista chiude a un certo orario." },
      { q: "Foto e privacy?",           a: "In serata possono esserci foto/video. Se non vuoi comparire, dillo allo staff: ci organizziamo." },
      { q: "Rimborsi / disdette?",      a: "Dipende dalla serata. Contattaci appena puoi e ti diciamo cosa è possibile fare." }
    ];

    const container = document.querySelector('#faqBox');
    if (!container) return;
    container.innerHTML = faqs.map(item => `
      <details name="faq">
        <summary>${item.q}</summary>
        <div class="faq__a">${item.a}</div>
      </details>
    `).join('');
  }
}

// ── NAV HEIGHT ───────────────────────────────────────────
function setNavHeight() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  document.documentElement.style.setProperty('--navH', `${nav.offsetHeight}px`);
}

// ── INIT ─────────────────────────────────────────────────
async function init() {
  setNavHeight();
  DrawerManager.init();
  TabManager.init();
  DataManager.renderFAQ();

  // Carica dati Firebase in parallelo
  const [evData, galleryData] = await Promise.all([
    FirebaseData.getNextEvent(),
    FirebaseData.getGallery()
  ]);

  DataManager.applyNextEvent(evData);
  DataManager.renderLastEvents(galleryData || DEFAULT_GALLERY);

  ['resize', 'orientationchange'].forEach(ev =>
    window.addEventListener(ev, () => {
      setNavHeight();
      const c = document.querySelector('.sideCollage');
      if (c) DataManager.fixCollageRows(c);
    })
  );
}

document.addEventListener('DOMContentLoaded', init);
