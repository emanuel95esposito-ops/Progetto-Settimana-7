// SportsHub — Week Project Settimana VII
//
// Devi fare 4 cose per la Versione Base:
// 1. Definire le classi Squadra ed Evento (mappano i dati di TheSportsDB)
// 2. Funzione async cercaSquadre(query) che chiama /searchteams.php
// 3. Funzione async caricaDettagli(idTeam) che chiama in parallelo
//    eventsnext.php + eventslast.php usando Promise.all
// 4. Render dinamico: card squadre, lista prossimi eventi, lista risultati
//
// Endpoint base: https://www.thesportsdb.com/api/v1/json/123/
// Il `123` nell'URL è la chiave API pubblica di test di TheSportsDB: gratis, non serve registrarsi.
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
        this.sport = dati.strSport;
    }
}

class Evento {
    constructor(dati) {
        this.id = dati.idEvent;
        this.data = dati.dateEvent;
        this.casa = dati.strHomeTeam;
        this.trasferta = dati.strAwayTeam;
        this.punteggioCasa = dati.intHomeScore;
        this.punteggioTrasferta = dati.intAwayScore;
    }

    dataFormattata() {
        if (!this.data) return "Data da definire";

        return new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(new Date(this.data));
    }

    punteggio() {
        if (this.punteggioCasa === null || this.punteggioTrasferta === null) {
            return null;
        }

        return `${this.punteggioCasa} – ${this.punteggioTrasferta}`;
    }
}

// === API ===

const BASE = "https://www.thesportsdb.com/api/v1/json/123/";

async function getJSON(url, opzioni) {
    const risposta = await fetch(url, opzioni);

    if (!risposta.ok) {
        const err = new Error(`HTTP ${risposta.status}`);
        err.status = risposta.status;
        throw err;
    }

    return risposta.json();
}

async function cercaSquadre(query) {
    const url = new URL("searchteams.php", BASE);

    url.searchParams.set("t", query);

    const dati = await getJSON(url);

    if (!dati.teams) return [];

    return dati.teams.map((squadra) => new Squadra(squadra));
}

async function caricaDettagli(idTeam) {
    const urlProssimi = new URL("eventsnext.php", BASE);
    const urlUltimi = new URL("eventslast.php", BASE);

    urlProssimi.searchParams.set("id", idTeam);
    urlUltimi.searchParams.set("id", idTeam);

    const [prossimi, ultimi] = await Promise.all([
        getJSON(urlProssimi),
        getJSON(urlUltimi)
    ]);

    return {
        prossimi: (prossimi.events ?? []).map((evento) => new Evento(evento)),
        ultimi: (ultimi.results ?? []).map((evento) => new Evento(evento))
    };
}


// === Stato ===

let squadreTrovate = [];

// === Render ===

const risultati = document.querySelector("#risultati");
const titoloRisultati = document.querySelector("#titolo-risultati");
const spinner = document.querySelector("#spinner");
const errore = document.querySelector("#errore");
const statoVuoto = document.querySelector("#stato-vuoto");
const formRicerca = document.querySelector("#form-ricerca");
const inputQuery = document.querySelector("#query");
const dettagliSection = document.querySelector("#dettagli-section");
const dettagliLogo = document.querySelector("#dettagli-logo");
const dettagliNome = document.querySelector("#dettagli-nome");
const dettagliMeta = document.querySelector("#dettagli-meta");
const listaProssimi = document.querySelector("#prossimi");
const listaUltimi = document.querySelector("#ultimi");

function creaElemento(tag, classe, genitore, testo) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;
    if (testo !== undefined) elemento.textContent = testo;
    if (genitore) genitore.appendChild(elemento);

    return elemento;
}

function mostraSpinner() {
    spinner.hidden = false;
    errore.hidden = true;
    statoVuoto.hidden = true;
}

function nascondiSpinner() {
    spinner.hidden = true;
}

function mostraErrore(messaggio) {
    errore.textContent = messaggio;
    errore.hidden = false;
}

function mostraMessaggio(testo) {
    statoVuoto.textContent = testo;
    statoVuoto.hidden = false;
}

function renderSquadre(squadre) {
    const colonne = squadre.map((squadra) => {
        const colonna = creaElemento("div", "col");
        const card = creaElemento("article", "card h-100 text-center p-3", colonna);

        card.dataset.id = squadra.id;

        const logo = creaElemento("img", "object-fit-contain mx-auto mb-3", card);

        logo.src = squadra.logo ?? "";
        logo.alt = `Stemma ${squadra.nome}`;
        logo.width = 100;
        logo.height = 100;
        logo.loading = "lazy";

        creaElemento("h3", "h6 fw-bold mb-1", card, squadra.nome);
        creaElemento("p", "text-body-secondary small mb-0", card, squadra.lega);
        creaElemento("p", "text-body-secondary small mb-0", card, squadra.paese);

        return colonna;
    });

    risultati.replaceChildren(...colonne);
    titoloRisultati.hidden = squadre.length === 0;
}

function renderEventi(lista, eventi) {
    if (eventi.length === 0) {
        const vuoto = creaElemento("li", "text-body-secondary fst-italic py-2",
            undefined, "Nessun evento in programma");

        lista.replaceChildren(vuoto);
        return;
    }

    const voci = eventi.map((evento) => {
        const li = creaElemento("li", "border-bottom py-2");

        creaElemento("p", "text-body-secondary small mb-1", li, evento.dataFormattata());

        const riga = creaElemento("div", "d-flex align-items-center gap-2", li);

        creaElemento("span", "fw-semibold", riga, `${evento.casa} vs ${evento.trasferta}`);

        const punteggio = evento.punteggio();

        if (punteggio) {
            creaElemento("span", "badge text-bg-success", riga, punteggio);
        }

        return li;
    });

    lista.replaceChildren(...voci);
}

function renderDettagli(squadra, prossimi, ultimi) {
    dettagliLogo.src = squadra.logo ?? "";
    dettagliLogo.alt = `Stemma ${squadra.nome}`;

    dettagliNome.textContent = squadra.nome;
    dettagliMeta.textContent = `${squadra.lega} · ${squadra.paese}`;

    renderEventi(listaProssimi, prossimi);
    renderEventi(listaUltimi, ultimi);

    dettagliSection.hidden = false;
    dettagliSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// === Eventi ===

formRicerca.addEventListener("submit", async (e) => {
    e.preventDefault();

    const query = inputQuery.value.trim();

    if (query.length < 2) return;

    mostraSpinner();
    risultati.replaceChildren();
    titoloRisultati.hidden = true;

    try {
        const squadre = await cercaSquadre(query);

        if (squadre.length === 0) {
            mostraMessaggio(`Nessuna squadra trovata per "${query}".`);
            return;
        }

        squadreTrovate = squadre;
        renderSquadre(squadre);
    } catch (err) {
        mostraErrore(err.status
            ? `Il servizio non risponde (errore ${err.status}). Riprova tra poco.`
            : "Impossibile contattare il servizio. Controlla la connessione.");
    } finally {
        nascondiSpinner();
    }
});

risultati.addEventListener("click", async (e) => {
    const card = e.target.closest("[data-id]");

    if (!card) return;

    const squadra = squadreTrovate.find((s) => s.id === card.dataset.id);

    if (!squadra) return;

    mostraSpinner();

    try {
        const { prossimi, ultimi } = await caricaDettagli(squadra.id);

        renderDettagli(squadra, prossimi, ultimi);
    } catch (err) {
        mostraErrore(`Impossibile caricare i dettagli di ${squadra.nome}.`);
        dettagliSection.hidden = true;
    } finally {
        nascondiSpinner();
    }
});