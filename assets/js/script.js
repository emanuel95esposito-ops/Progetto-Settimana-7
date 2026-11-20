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

    // I preferiti tornano dal localStorage con i nomi italiani:
    // qui rifanno il percorso inverso verso il costruttore.
    static fromJSON(dati) {
        return new Squadra({
            idTeam: dati.id,
            strTeam: dati.nome,
            strBadge: dati.logo,
            strLeague: dati.lega,
            strCountry: dati.paese,
            strSport: dati.sport
        });
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

async function cercaSquadre(query, signal) {
    const url = new URL("searchteams.php", BASE);

    url.searchParams.set("t", query);

    const dati = await getJSON(url, { signal });

    if (!dati.teams) return [];

    return dati.teams.map((squadra) => new Squadra(squadra));
}

const cacheDettagli = new Map();

async function caricaDettagli(idTeam) {
    if (cacheDettagli.has(idTeam)) {
        return cacheDettagli.get(idTeam);
    }

    const urlProssimi = new URL("eventsnext.php", BASE);
    const urlUltimi = new URL("eventslast.php", BASE);

    urlProssimi.searchParams.set("id", idTeam);
    urlUltimi.searchParams.set("id", idTeam);

    const [prossimi, ultimi] = await Promise.all([
        getJSON(urlProssimi),
        getJSON(urlUltimi)
    ]);

    const dettagli = {
        prossimi: (prossimi.events ?? []).map((evento) => new Evento(evento)),
        ultimi: (ultimi.results ?? []).map((evento) => new Evento(evento))
    };

    cacheDettagli.set(idTeam, dettagli);

    return dettagli;
}


// === Stato ===

const PREFERITI_KEY = "sportshub:preferiti";

let squadreTrovate = [];
let preferiti = caricaPreferiti();

// Ricerca mentre si digita: timer del debounce e richiesta da annullare.
let timeoutId;
let controller;

// Filtro dei preferiti: "tutti" oppure il valore di strSport dell'API.
let filtroSport = "tutti";

function resetFiltroSport() {
    filtroSport = "tutti";

    filtriSport.querySelectorAll("[data-sport]").forEach((b) => {
        const attivo = b.dataset.sport === "tutti";

        b.classList.toggle("btn-primary", attivo);
        b.classList.toggle("btn-outline-primary", !attivo);
    });
}

function preferitiFiltrati() {
    if (filtroSport === "tutti") return preferiti;

    return preferiti.filter((squadra) => squadra.sport === filtroSport);
}

function caricaPreferiti() {
    const dati = JSON.parse(localStorage.getItem(PREFERITI_KEY) ?? "[]");

    return dati.map((squadra) => Squadra.fromJSON(squadra));
}

function salvaPreferiti() {
    localStorage.setItem(PREFERITI_KEY, JSON.stringify(preferiti));
}

function isPreferita(id) {
    return preferiti.some((squadra) => squadra.id === id);
}

function trovaSquadra(id) {
    return squadreTrovate.find((s) => s.id === id) ?? preferiti.find((s) => s.id === id);
}

// === Render ===

const risultati = document.querySelector("#risultati");
const titoloRisultati = document.querySelector("#titolo-risultati");
const spinner = document.querySelector("#spinner");
const errore = document.querySelector("#errore");
const statoVuoto = document.querySelector("#stato-vuoto");
const formRicerca = document.querySelector("#form-ricerca");
const inputQuery = document.querySelector("#query");
const esempiBox = document.querySelector("#esempi");
const preferitiBox = document.querySelector("#preferiti");
const preferitiVuoto = document.querySelector("#preferiti-vuoto");
const filtriSport = document.querySelector("#filtri-sport");
const dettagliModal = document.querySelector("#dettagli-modal");
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

function messaggioErrore(err, contesto) {
    if (err.status === 429) {
        return "Troppe richieste in poco tempo. Aspetta qualche secondo e riprova.";
    }

    if (err.status) {
        return `${contesto} (errore ${err.status}). Riprova tra poco.`;
    }

    return "Impossibile contattare il servizio. Controlla la connessione.";
}

// L'API cerca per nome quasi completo: l'etichetta e' corta, la query e' quella vera.
const ESEMPI = [
    { etichetta: "Arsenal", query: "Arsenal" },
    { etichetta: "Lakers", query: "Los Angeles Lakers" },
    { etichetta: "Patriots", query: "New England Patriots" }
];

function renderEsempi() {
    const bottoni = ESEMPI.map((esempio) => {
        const bottone = creaElemento("button", "btn btn-sm btn-outline-light rounded-pill",
            undefined, esempio.etichetta);

        bottone.type = "button";
        bottone.dataset.esempio = esempio.query;

        return bottone;
    });

    esempiBox.replaceChildren(...bottoni);
}

function mostraMessaggio(testo, suggerimento) {
    statoVuoto.replaceChildren();

    creaElemento("p", "fst-italic mb-1", statoVuoto, testo);

    if (suggerimento) {
        creaElemento("p", "small mb-0", statoVuoto, suggerimento);
    }

    statoVuoto.hidden = false;
}

function creaCardSquadra(squadra) {
    const colonna = creaElemento("div", "col");
    const card = creaElemento("article", "card h-100 text-center p-3", colonna);

    card.dataset.id = squadra.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Apri i dettagli di ${squadra.nome}`);

    const logo = creaElemento("img", "object-fit-contain mx-auto mb-3", card);

    logo.src = squadra.logo ?? "";
    logo.alt = `Stemma ${squadra.nome}`;
    logo.width = 100;
    logo.height = 100;
    logo.loading = "lazy";

    creaElemento("h3", "h6 fw-bold mb-1", card, squadra.nome);
    creaElemento("p", "text-body-secondary small mb-0", card, squadra.lega);
    creaElemento("p", "text-body-secondary small mb-0", card, squadra.paese);

    return { colonna, card };
}

function renderPreferiti() {
    const elenco = preferitiFiltrati();

    const colonne = elenco.map((squadra) => {
        const { colonna, card } = creaCardSquadra(squadra);

        const bottone = creaElemento("button", "btn btn-sm btn-outline-danger w-100 mt-3",
            card, "\u{1F5D1} Rimuovi");

        bottone.type = "button";
        bottone.dataset.azione = "rimuovi";

        return colonna;
    });

    preferitiBox.replaceChildren(...colonne);

    filtriSport.hidden = preferiti.length === 0;

    if (preferiti.length === 0) {
        preferitiVuoto.textContent =
            "Non hai ancora salvato nessuna squadra. Cercane una e aggiungila ai preferiti.";
        preferitiVuoto.hidden = false;
    } else if (elenco.length === 0) {
        preferitiVuoto.textContent = "Nessuna squadra salvata per questo sport.";
        preferitiVuoto.hidden = false;
    } else {
        preferitiVuoto.hidden = true;
    }
}

function renderSquadre(squadre) {
    const colonne = squadre.map((squadra) => {
        const { colonna, card } = creaCardSquadra(squadra);
        const giaSalvata = isPreferita(squadra.id);

        const bottone = creaElemento("button",
            giaSalvata ? "btn btn-sm btn-secondary w-100 mt-3" : "btn btn-sm btn-warning w-100 mt-3",
            card,
            giaSalvata ? "\u2713 Gi\u00e0 nei preferiti" : "\u2605 Aggiungi ai preferiti");

        bottone.type = "button";
        bottone.disabled = giaSalvata;
        bottone.dataset.azione = "aggiungi";

        return colonna;
    });

    risultati.replaceChildren(...colonne);
    titoloRisultati.hidden = squadre.length === 0;
}

function mostraSkeleton(quante = 1) {
    const colonne = Array.from({ length: quante }, () => {
        const colonna = creaElemento("div", "col");
        const card = creaElemento("article", "card h-100 text-center p-3 placeholder-glow", colonna);

        creaElemento("span", "placeholder skeleton-logo rounded-circle mx-auto mb-3", card);
        creaElemento("span", "placeholder col-6 mx-auto mb-2", card);
        creaElemento("span", "placeholder col-9 mx-auto", card);
        creaElemento("span", "placeholder col-4 mx-auto", card);

        return colonna;
    });

    risultati.replaceChildren(...colonne);
}

function renderEventi(lista, eventi) {
    if (eventi.length === 0) {
        const vuoto = creaElemento("li", "text-body-secondary fst-italic py-2",
            undefined, "Nessun evento in programma");

        lista.replaceChildren(vuoto);
        return;
    }

    const voci = eventi.map((evento) => {
        const li = creaElemento("li", "border-bottom py-3");

        creaElemento("p", "text-body-secondary small mb-2", li, evento.dataFormattata());

        const giocata = evento.punteggio() !== null;
        const golCasa = Number(evento.punteggioCasa);
        const golTrasferta = Number(evento.punteggioTrasferta);

        const riga = (nome, gol, vince) => {
            const div = creaElemento("div",
                "d-flex justify-content-between align-items-center gap-3", li);

            creaElemento("span", vince ? "fw-bold text-truncate" : "text-truncate", div, nome);

            if (gol !== null) {
                creaElemento("span",
                    vince ? "fw-bold text-nowrap" : "text-body-secondary text-nowrap", div, gol);
            }
        };

        riga(evento.casa, evento.punteggioCasa, giocata && golCasa > golTrasferta);
        riga(evento.trasferta, evento.punteggioTrasferta, giocata && golTrasferta > golCasa);

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

    bootstrap.Modal.getOrCreateInstance(dettagliModal).show();
}

// === Eventi ===

async function eseguiRicerca(query) {
    controller?.abort();
    controller = new AbortController();

    const { signal } = controller;

    errore.hidden = true;
    statoVuoto.hidden = true;
    titoloRisultati.hidden = true;

    mostraSkeleton();

    try {
        const squadre = await cercaSquadre(query, signal);

        if (squadre.length === 0) {
            risultati.replaceChildren();

            mostraMessaggio(
                `Nessuna squadra trovata per "${query}".`,
                "Prova con il nome completo della squadra."
            );

            return;
        }

        squadreTrovate = squadre;
        renderSquadre(squadre);
    } catch (err) {
        // una richiesta annullata non e' un errore da mostrare
        if (err.name === "AbortError") return;

        risultati.replaceChildren();

        mostraErrore(messaggioErrore(err, "Il servizio non risponde"));
    }
}

formRicerca.addEventListener("submit", (e) => {
    e.preventDefault();

    clearTimeout(timeoutId);

    const query = inputQuery.value.trim();

    if (query.length < 2) return;

    eseguiRicerca(query);
});

inputQuery.addEventListener("input", () => {
    clearTimeout(timeoutId);
    controller?.abort();

    const query = inputQuery.value.trim();

    if (query.length < 3) {
        risultati.replaceChildren();
        titoloRisultati.hidden = true;
        mostraMessaggio("Cerca una squadra per iniziare.");
        return;
    }

    timeoutId = setTimeout(() => eseguiRicerca(query), 400);
});

async function apriDettagli(squadra) {
    mostraSpinner();

    try {
        const { prossimi, ultimi } = await caricaDettagli(squadra.id);

        renderDettagli(squadra, prossimi, ultimi);
    } catch (err) {
        mostraErrore(messaggioErrore(err, `Impossibile caricare i dettagli di ${squadra.nome}`));
    } finally {
        nascondiSpinner();
    }
}

function gestisciClickCard(e) {
    // i bottoni dentro la card hanno una loro azione: non aprono il dettaglio
    if (e.target.closest("[data-azione]")) return;

    const card = e.target.closest("[data-id]");

    if (!card) return;

    const squadra = trovaSquadra(card.dataset.id);

    if (!squadra) return;

    apriDettagli(squadra);
}

function gestisciTastiCard(e) {
    if (e.key !== "Enter" && e.key !== " ") return;

    const card = e.target.closest("[data-id]");

    if (!card) return;

    e.preventDefault();
    card.click();
}

risultati.addEventListener("click", gestisciClickCard);
preferitiBox.addEventListener("click", gestisciClickCard);

risultati.addEventListener("keydown", gestisciTastiCard);
preferitiBox.addEventListener("keydown", gestisciTastiCard);

risultati.addEventListener("click", (e) => {
    const bottone = e.target.closest('[data-azione="aggiungi"]');

    if (!bottone) return;

    const squadra = trovaSquadra(bottone.closest("[data-id]").dataset.id);

    if (!squadra || isPreferita(squadra.id)) return;

    preferiti.push(squadra);
    salvaPreferiti();

    // senza questo, un filtro attivo nasconderebbe la squadra appena aggiunta
    resetFiltroSport();
    renderPreferiti();

    bottone.className = "btn btn-sm btn-secondary w-100 mt-3";
    bottone.textContent = "\u2713 Gi\u00e0 nei preferiti";
    bottone.disabled = true;
});

preferitiBox.addEventListener("click", (e) => {
    const bottone = e.target.closest('[data-azione="rimuovi"]');

    if (!bottone) return;

    const id = bottone.closest("[data-id]").dataset.id;

    preferiti = preferiti.filter((squadra) => squadra.id !== id);
    salvaPreferiti();
    renderPreferiti();

    const daRiattivare = risultati.querySelector(`[data-id="${id}"] [data-azione="aggiungi"]`);

    if (daRiattivare) {
        daRiattivare.className = "btn btn-sm btn-warning w-100 mt-3";
        daRiattivare.textContent = "\u2605 Aggiungi ai preferiti";
        daRiattivare.disabled = false;
    }
});

filtriSport.addEventListener("click", (e) => {
    const bottone = e.target.closest("[data-sport]");

    if (!bottone) return;

    filtroSport = bottone.dataset.sport;

    filtriSport.querySelectorAll("[data-sport]").forEach((b) => {
        const attivo = b.dataset.sport === filtroSport;

        b.classList.toggle("btn-primary", attivo);
        b.classList.toggle("btn-outline-primary", !attivo);
    });

    renderPreferiti();
});

esempiBox.addEventListener("click", (e) => {
    const bottone = e.target.closest("[data-esempio]");

    if (!bottone) return;

    inputQuery.value = bottone.dataset.esempio;
    formRicerca.requestSubmit();
});

renderEsempi();
renderPreferiti();
mostraMessaggio("Cerca una squadra per iniziare.");