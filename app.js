// app.js — Tab system, zero scroll-snap

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

// ── TABS ──────────────────────────────────────────────
class TabManager {
  static init() {
    this.panels = document.querySelectorAll('.tab-panel');
    this.navLinks = document.querySelectorAll('[data-tab]');
    this.showTab('home');

    // Click su qualsiasi [data-tab]
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-tab]');
      if (!el) return;
      e.preventDefault();
      const tab = el.dataset.tab;
      this.showTab(tab);
      DrawerManager.close();
    });
  }

  static showTab(name) {
    // Panels
    this.panels.forEach(p => {
      const active = p.dataset.panel === name;
      p.classList.toggle('is-active', active);
      // Scroll to top di ogni panel quando viene mostrato
      if (active) p.scrollTop = 0;
    });

    // Link attivi (nav + drawer)
    this.navLinks.forEach(a => {
      a.classList.toggle('is-active', a.dataset.tab === name);
    });

    this.currentTab = name;
  }
}

// ── DRAWER ────────────────────────────────────────────
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

// ── DATA ──────────────────────────────────────────────
class DataManager {
  static async loadJSON(url) {
    const res = await fetch(url);
    return res.json();
  }

  static async renderLastEvents() {
    const data = await this.loadJSON('festini.json');
    const events = Object.entries(data)
      .map(([nome, info]) => ({
        nome,
        dateObj: Utils.parseDDMMYY(info.date),
        link: info.link,
        foto: Array.isArray(info.foto_evidenza) ? info.foto_evidenza : []
      }))
      .sort((a, b) => b.dateObj - a.dateObj)
      .slice(0, 3);

    // Titoli
    const container = document.querySelector('#last3Events');
    if (container) {
      container.innerHTML = events.map(ev => `
        <a class="card" style="box-shadow:none" href="${ev.link}" target="_blank" rel="noopener">
          <div class="card__pad">${ev.nome}</div>
        </a>
      `).join('');
    }

    // Foto collage
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

  static async renderFAQ() {
    const faqs = await this.loadJSON('faq.json');
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

// ── NAV HEIGHT ────────────────────────────────────────
function setNavHeight() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  document.documentElement.style.setProperty('--navH', `${nav.offsetHeight}px`);
}

// ── INIT ──────────────────────────────────────────────
async function init() {
  setNavHeight();
  DrawerManager.init();
  TabManager.init();

  await Promise.all([
    DataManager.renderLastEvents(),
    DataManager.renderFAQ()
  ]);

  ['resize', 'orientationchange'].forEach(ev =>
    window.addEventListener(ev, () => {
      setNavHeight();
      const c = document.querySelector('.sideCollage');
      if (c) DataManager.fixCollageRows(c);
    })
  );
}

document.addEventListener('DOMContentLoaded', init);
