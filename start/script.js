// SportsHub — Week Project Settimana VII
//
// Devi fare 4 cose per la Versione Base:
// 1. Definire le classi Squadra ed Evento (mappano i dati di TheSportsDB)
// 2. Funzione async cercaSquadre(query) che chiama /searchteams.php
// 3. Funzione async caricaDettagli(idTeam) che chiama in parallelo
//    eventsnext.php + eventslast.php usando Promise.all
// 4. Render dinamico: card squadre, lista prossimi eventi, lista risultati
//
// Endpoint base: https://www.thesportsdb.com/api/v1/json/3/
// Il `3` nell'URL è la chiave API pubblica di test di TheSportsDB: gratis, non serve registrarsi.
//
// Per le versioni Intermedia/Avanzata: localStorage preferiti, debounce, Promise.all multi.

// === Classi ===

class Squadra {
  constructor(dati) {
    this.id = dati.idTeam;
    this.nome = dati.strTeam;
    this.logo = dati.strBadge;
    this.lega = dati.strLeague;
    this.paese = dati.strCountry;
  }
}

class Evento {
  constructor(dati) {
    this.id = dati.idEvent;
    this.data = dati.dateEvent;
    this.homeTeam = dati.strHomeTeam;
    this.awayTeam = dati.strAwayTeam;
    this.homeScore = dati.intHomeScore;
    this.awayScore = dati.intAwayScore;
  }
  formattaData() {
    return this.data.split("-").reverse().join("/");
  }

  punteggio() {
    return `${this.homeScore} - ${this.awayScore}`;
  }
}

async function cercaSquadre(query) {
  try {
    const risposta = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${query}`,
    );
    const dati = await risposta.json();
    if (!dati.teams) return [];
    return dati.teams.map((t) => new Squadra(t));
  } catch (errore) {
    throw errore;
  }
}

async function caricaDettagli(idTeam) {
  const BASE = "https://www.thesportsdb.com/api/v1/json/3/";
  const [rispostaProssimi, rispostaUltimi] = await Promise.all([
    fetch(`${BASE}eventsnext.php?id=${idTeam}`),
    fetch(`${BASE}eventslast.php?id=${idTeam}`),
  ]);

  const [datiProssimi, datiUltimi] = await Promise.all([
    rispostaProssimi.json(),
    rispostaUltimi.json(),
  ]);

  return {
    prossimi: datiProssimi.events
      ? datiProssimi.events.map((e) => new Evento(e))
      : [],
    ultimi: datiUltimi.results
      ? datiUltimi.results.map((e) => new Evento(e))
      : [],
  };
}

function renderSquadre(squadre) {
  const sezione = document.getElementById("risultati-section");

  if (squadre.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Nessuna squadra trovata";
    sezione.appendChild(p);
    return;
  }

  if (!sezione.querySelector(".titolo-risultati")) {
    const titolo = document.createElement("h2");
    titolo.className = "titolo-risultati";
    titolo.textContent = "Squadre trovate";
    sezione.appendChild(titolo);
  }

  let griglia = sezione.querySelector(".griglia-squadre");
  if (!griglia) {
    griglia = document.createElement("div");
    griglia.className = "griglia-squadre";
    sezione.appendChild(griglia);
  }

  squadre.forEach((s) => {
    if (griglia.querySelector(`[data-id="${s.id}"]`)) return;

    const card = document.createElement("div");
    card.className = "card-squadra";
    card.dataset.id = s.id;

    const img = document.createElement("img");
    img.src = s.logo;
    img.alt = s.nome;

    const h3 = document.createElement("h3");
    h3.textContent = s.nome;

    const pLega = document.createElement("p");
    pLega.textContent = s.lega;

    const pPaese = document.createElement("p");
    pPaese.textContent = s.paese;

    const btnPreferiti = document.createElement("button");
    btnPreferiti.className = "btn-preferiti";
    const giaSalvata = preferiti.some((p) => p.id === s.id);
    btnPreferiti.textContent = giaSalvata ? "★ Già nei preferiti" : "★ Aggiungi ai preferiti";
    if (giaSalvata) btnPreferiti.disabled = true;
    btnPreferiti.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!preferiti.some((p) => p.id === s.id)) {
        preferiti.push({ id: s.id, nome: s.nome, logo: s.logo, lega: s.lega, paese: s.paese });
        salvaPreferiti();
        renderPreferiti();
        card.remove();
      }
    });

    card.appendChild(img);
    card.appendChild(h3);
    card.appendChild(pLega);
    card.appendChild(pPaese);
    card.appendChild(btnPreferiti);
    griglia.appendChild(card);
  });
}

function renderDettagli(nome, id, prossimi, ultimi) {
  const sezione = document.getElementById("dettagli-section");
  sezione.hidden = false;
  sezione.dataset.currentId = id;
  sezione.innerHTML = "";

  const h2 = document.createElement("h2");
  h2.textContent = nome;
  sezione.appendChild(h2);

  const colonne = document.createElement("div");
  colonne.className = "dettagli-colonne";

  const colonnaProssimi = document.createElement("div");
  colonnaProssimi.className = "dettagli-colonna";

  const h3Prossimi = document.createElement("h3");
  h3Prossimi.textContent = "Prossimi eventi";
  colonnaProssimi.appendChild(h3Prossimi);

  const ulProssimi = document.createElement("ul");
  if (prossimi.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nessun evento in programma";
    ulProssimi.appendChild(li);
  } else {
    prossimi.forEach((e) => {
      const li = document.createElement("li");
      li.textContent = `${e.formattaData()} — ${e.homeTeam} vs ${e.awayTeam}`;
      ulProssimi.appendChild(li);
    });
  }
  colonnaProssimi.appendChild(ulProssimi);

  const colonnaUltimi = document.createElement("div");
  colonnaUltimi.className = "dettagli-colonna";

  const h3Ultimi = document.createElement("h3");
  h3Ultimi.textContent = "Ultimi risultati";
  colonnaUltimi.appendChild(h3Ultimi);

  const ulUltimi = document.createElement("ul");
  if (ultimi.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nessun risultato disponibile";
    ulUltimi.appendChild(li);
  } else {
    ultimi.forEach((e) => {
      const li = document.createElement("li");
      li.textContent = `${e.formattaData()} — ${e.homeTeam} vs ${e.awayTeam} ${e.punteggio()}`;
      ulUltimi.appendChild(li);
    });
  }
  colonnaUltimi.appendChild(ulUltimi);

  colonne.appendChild(colonnaProssimi);
  colonne.appendChild(colonnaUltimi);
  sezione.appendChild(colonne);
}

// === Stato ===

let preferiti = JSON.parse(localStorage.getItem("preferiti") || "[]");

function salvaPreferiti() {
  localStorage.setItem("preferiti", JSON.stringify(preferiti));
}

// === Render preferiti ===

function renderPreferiti() {
  const sezione = document.getElementById("preferiti-section");
  sezione.innerHTML = "";

  if (preferiti.length === 0) return;

  const griglia = document.createElement("div");
  griglia.className = "griglia-squadre";

  preferiti.forEach((s) => {
    const card = document.createElement("div");
    card.className = "card-squadra";
    card.dataset.id = s.id;
    card.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = s.logo;
    img.alt = s.nome;

    const h3 = document.createElement("h3");
    h3.textContent = s.nome;

    const pLega = document.createElement("p");
    pLega.textContent = s.lega;

    const pPaese = document.createElement("p");
    pPaese.textContent = s.paese;

    const btnRimuovi = document.createElement("button");
    btnRimuovi.className = "btn-rimuovi";
    btnRimuovi.textContent = "✕ Rimuovi";
    btnRimuovi.addEventListener("click", (e) => {
      e.stopPropagation();
      preferiti = preferiti.filter((p) => p.id !== s.id);
      salvaPreferiti();
      renderPreferiti();
    });

    card.addEventListener("click", async () => {
      const { prossimi, ultimi } = await caricaDettagli(s.id);
      renderDettagli(s.nome, s.id, prossimi, ultimi);
    });

    card.appendChild(img);
    card.appendChild(h3);
    card.appendChild(pLega);
    card.appendChild(pPaese);
    card.appendChild(btnRimuovi);
    griglia.appendChild(card);
  });

  sezione.appendChild(griglia);
}

// === API ===

// === Render ===

// === Eventi ===

renderPreferiti();

const form = document.getElementById("search-bar");
const inputRicerca = document.getElementById("input-ricerca");
let debounceTimer;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = inputRicerca.value.trim();
  if (!query) return;
  const squadre = await cercaSquadre(query);
  renderSquadre(squadre);
});

inputRicerca.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const query = inputRicerca.value.trim();
    if (!query) return;
    const squadre = await cercaSquadre(query);
    renderSquadre(squadre);
  }, 400);
});

const sezione = document.getElementById("risultati-section");

sezione.addEventListener("click", async (e) => {
  const card = e.target.closest(".card-squadra");
  if (!card) return;

  if (card.classList.contains("selezionata")) return;
  card.classList.add("selezionata");

  const id = card.dataset.id;
  const nome = card.querySelector("h3").textContent;
  const { prossimi, ultimi } = await caricaDettagli(id);
  renderDettagli(nome, id, prossimi, ultimi);
});
