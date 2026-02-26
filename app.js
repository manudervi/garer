const formatEUR = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const events = [
  {
    id: "garer-lean-gasa-01",
    title: "GARER: Lean Gasa Night",
    city: "Modena",
    venue: "Location da definire",
    date: "Sab 21 Feb 2026",
    fromPrice: 12,
    badge: "Last tickets",
    poster: "assets/sample_evento.jpg",
    description: "Visual slime viola, cups, drip vibes. Line-up a breve."
  },
  {
    id: "garer-lean-gasa-02",
    title: "GARER: Purple Drip",
    city: "Bologna",
    venue: "Location da definire",
    date: "Sab 07 Mar 2026",
    fromPrice: 10,
    badge: "Early",
    poster: "assets/sample_evento.jpg",
    description: "Trap night + visual. Dresscode: black/purple."
  },
  {
    id: "garer-lean-gasa-03",
    title: "GARER: Cup Spill Edition",
    city: "Reggio Emilia",
    venue: "Location da definire",
    date: "Sab 28 Mar 2026",
    fromPrice: 15,
    badge: "New",
    poster: "assets/sample_evento.jpg",
    description: "Format speciale con stage design e drip overlay."
  }
];

function mountEventGrid(el){
  el.innerHTML = events.map(e => `
    <article class="card eventCard">
      <div class="badge">${e.badge}</div>
      <div class="poster">
        <img src="${e.poster}" alt="Locandina ${e.title}">
      </div>
      <div class="card__pad">
        <div class="eventCard__meta">
          <span>${e.date}</span>
          <span>da ${formatEUR(e.fromPrice)}</span>
        </div>
        <div class="eventCard__title">${e.title}</div>
        <div class="eventCard__meta">
          <span>${e.city}</span>
          <span>${e.venue}</span>
        </div>
        <div class="hr"></div>
        <a class="btn btn--primary eventCard__btn" href="evento.html?id=${encodeURIComponent(e.id)}">
          Dettagli e prenotazioni
        </a>
      </div>
    </article>
  `).join("");
}

function getEventById(id){
  return events.find(e => e.id === id) || events[0];
}

function mountEventPage(){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const e = getEventById(id);

  const titleEl = document.querySelector("[data-event-title]");
  const metaEl = document.querySelector("[data-event-meta]");
  const descEl = document.querySelector("[data-event-desc]");
  const priceEl = document.querySelector("[data-event-fromprice]");
  const posterEl = document.querySelector("[data-event-poster]");

  if(titleEl) titleEl.textContent = e.title;
  if(metaEl) metaEl.textContent = `${e.date} • ${e.city} • ${e.venue}`;
  if(descEl) descEl.textContent = e.description;
  if(priceEl) priceEl.textContent = `Da ${formatEUR(e.fromPrice)}`;
  if(posterEl) posterEl.src = e.poster;

  const ticketType = document.querySelector("#ticketType");
  const qty = document.querySelector("#qty");
  const totalEl = document.querySelector("[data-total]");
  const buyBtn = document.querySelector("#buyBtn");

  const prices = { early: e.fromPrice, standard: e.fromPrice + 5, vip: e.fromPrice + 15 };

  function compute(){
    const type = ticketType?.value || "standard";
    const q = Number(qty?.value || 1);
    const total = (prices[type] || prices.standard) * q;
    if(totalEl) totalEl.textContent = formatEUR(total);
    if(buyBtn){
      buyBtn.dataset.eventId = e.id;
      buyBtn.dataset.ticketType = type;
      buyBtn.dataset.qty = String(q);
    }
  }

  ticketType?.addEventListener("change", compute);
  qty?.addEventListener("change", compute);
  compute();
}

// Slide activation animation (pptFX)
function wireDeck(){
  const deck = document.querySelector(".deck");
  if(!deck) return;

  const slides = Array.from(document.querySelectorAll(".slide"));
  const setActive = () => {
    const y = deck.scrollTop + (window.innerHeight * 0.35);
    let idx = Math.floor(y / window.innerHeight);
    idx = Math.max(0, Math.min(slides.length - 1, idx));
    slides.forEach((s,i) => s.classList.toggle("is-active", i === idx));
  };

  deck.addEventListener("scroll", () => requestAnimationFrame(setActive));
  window.addEventListener("resize", setActive);
  setActive();
}

// Stripe Checkout: serve endpoint backend (non mettere secret key nel frontend). [web:24]
async function startCheckout(payload){
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if(!res.ok) throw new Error("Checkout error");
  const data = await res.json();
  if(!data.url) throw new Error("Missing checkout url");
  location.href = data.url;
}

function wireCheckoutButton(){
  const buyBtn = document.querySelector("#buyBtn");
  if(!buyBtn) return;

  buyBtn.addEventListener("click", async () => {
    buyBtn.disabled = true;
    buyBtn.textContent = "Reindirizzo al pagamento…";

    const payload = {
      eventId: buyBtn.dataset.eventId,
      ticketType: buyBtn.dataset.ticketType,
      quantity: Number(buyBtn.dataset.qty || 1)
    };

    try{
      await startCheckout(payload);
    }catch(e){
      buyBtn.disabled = false;
      buyBtn.textContent = "Acquista ora";
      alert("Errore checkout. Riprova o contattaci su WhatsApp.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector("[data-event-grid]");
  if(grid) mountEventGrid(grid);

  wireDeck();

  if(document.body.dataset.page === "evento"){
    mountEventPage();
    wireCheckoutButton();
  }
});
function wireDrawer(){
  const burger = document.querySelector(".burger");
  const backdrop = document.querySelector(".backdrop");
  const drawer = document.querySelector(".drawer");
  if(!burger || !backdrop || !drawer) return;

  const open = () => {
    document.body.classList.add("drawerOpen");
    burger.setAttribute("aria-expanded","true");
    drawer.setAttribute("aria-hidden","false");
  };
  const close = () => {
    document.body.classList.remove("drawerOpen");
    burger.setAttribute("aria-expanded","false");
    drawer.setAttribute("aria-hidden","true");
  };

  burger.addEventListener("click", () => document.body.classList.contains("drawerOpen") ? close() : open());
  backdrop.addEventListener("click", close);
  drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
}
document.addEventListener("DOMContentLoaded", wireDrawer);
