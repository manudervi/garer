// app.js - Strutturato e modulare

// Utilities
const Utils = {
  parseDDMMYY(s) {
    const [dd, mm, yy] = s.split('/').map(Number);
    return new Date(2000 + yy, mm - 1, dd);
  },

  extractDriveFileId(url) {
    const match = String(url).match(/\/file\/d\/([^/]+)/);
    return match ? match[1] : null;
  },

  driveToImgSrc(url, width = 1200) {
    const id = this.extractDriveFileId(url);
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}` : url;
  },

  formatEUR(n) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
  },

  getNavHeight() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--navH")) || 92;
  }
};

// Data Manager
class DataManager {
  static async loadJSON(url) {
    const response = await fetch(url);
    return response.json();
  }

  static async renderLastEvents() {
    const data = await this.loadJSON('festini.json');
    const events = Object.entries(data).map(([nome, info]) => ({
      nome,
      dateObj: Utils.parseDDMMYY(info.date),
      link: info.link,
      foto: Array.isArray(info.foto_evidenza) ? info.foto_evidenza : []
    })).sort((a, b) => b.dateObj - a.dateObj).slice(0, 3);

    this.renderEventTitles(events);
    this.renderEventPhotos(events);
  }

  static renderEventTitles(events) {
    const container = document.querySelector('#last3Events');
    if (!container) return;

    container.innerHTML = events.map(event => `
      <a class="card" style="box-shadow:none" href="${event.link}" target="_blank" rel="noopener">
        <div class="card__pad">${event.nome}</div>
      </a>
    `).join('');
  }

  static renderEventPhotos(events) {
    const collage = document.querySelector('.sideCollage');
    if (!collage) return;

    const photos = events.flatMap(event => 
      event.foto.map(url => ({
        imgSrc: Utils.driveToImgSrc(url, 1200),
        eventLink: event.link
      }))
    );

    if (photos.length === 0) {
      collage.innerHTML = '<div style="height:100%; display:flex; align-items:center; justify-content:center; color:var(--muted)">Nessuna foto evidenza</div>';
    } else {
      collage.innerHTML = photos.map(photo => `
        <a href="${photo.eventLink}" target="_blank" rel="noopener" style="display:block">
          <img src="${photo.imgSrc}" alt="">
        </a>
      `).join('');

      this.fixCollageRows(collage);
    }
  }

  static fixCollageRows(collage) {
    const imgs = collage.querySelectorAll('img');
    if (imgs.length === 0) return;

    const cols = 2;
    const rows = Math.ceil(imgs.length / cols);
    const gap = 10;
    const padding = 24;

    const availableHeight = collage.clientHeight - padding - (rows - 1) * gap;
    const rowHeight = availableHeight / rows;

    collage.style.setProperty('--rowH', `${rowHeight}px`);
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

// UI Manager
class UIManager {
  static setNavHeightVar() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    document.documentElement.style.setProperty("--navH", `${nav.offsetHeight}px`);
  }

  static wireDrawer() {
    const burger = document.querySelector(".burger");
    const backdrop = document.querySelector(".backdrop");
    const drawer = document.querySelector("#drawer");

    if (!burger || !backdrop || !drawer) return;

    const openDrawer = () => {
      document.body.classList.add("drawerOpen");
      burger.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
    };

    const closeDrawer = () => {
      document.body.classList.remove("drawerOpen");
      burger.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
    };

    burger.addEventListener("click", () => 
      document.body.classList.contains("drawerOpen") ? closeDrawer() : openDrawer()
    );
    
    backdrop.addEventListener("click", closeDrawer);
    drawer.querySelectorAll("a").forEach(link => link.addEventListener("click", closeDrawer));
  }

  static wireDeckScroll() {
    const deck = document.querySelector("#deck");
    if (!deck) return;

    const slides = Array.from(document.querySelectorAll(".slide"));
    
    const setActiveSlide = () => {
      const y = deck.scrollTop + (window.innerHeight * 0.35);
      const idx = Math.max(0, Math.min(slides.length - 1, Math.floor(y / window.innerHeight)));
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === idx));
    };

    deck.addEventListener("scroll", () => requestAnimationFrame(setActiveSlide));
    window.addEventListener("resize", setActiveSlide);
    setActiveSlide();
  }

  static wireHashScroll() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute("href");
      const target = document.querySelector(hash);
      
      if (target) {
        e.preventDefault();
        this.scrollToTarget(target);
      }
    });
  }

  static scrollToTarget(target) {
    const deck = document.querySelector("#deck");
    if (!deck || !target) return;

    target.scrollTop = 0;
    
    const navH = Utils.getNavHeight();
    const deckRect = deck.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top = (targetRect.top - deckRect.top) + deck.scrollTop - navH - 12;

    deck.scrollTo({ top, behavior: "smooth" });
  }
}

// Initialization
class App {
  static async init() {
    // Set up UI
    UIManager.setNavHeightVar();
    UIManager.wireDrawer();
    UIManager.wireDeckScroll();
    UIManager.wireHashScroll();

    // Load dynamic content
    await Promise.all([
      DataManager.renderLastEvents(),
      DataManager.renderFAQ()
    ]);

    // Event listeners for resize
    ['resize', 'orientationchange'].forEach(event => {
      window.addEventListener(event, () => {
        UIManager.setNavHeightVar();
        const collage = document.querySelector('.sideCollage');
        if (collage) DataManager.fixCollageRows(collage);
      });
    });
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
window.addEventListener('load', () => App.init());
