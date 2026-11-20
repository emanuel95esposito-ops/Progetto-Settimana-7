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


import { Squadra } from "./classi.js";
import { cercaSquadre, caricaProssimi, caricaDettagli, rimuoviCache } from "./api.js";
import {
    risultati, titoloRisultati, statoVuoto, formRicerca, inputQuery,
    preferitiBox, filtriSport, appuntamentiLista, listaProssimi, listaUltimi,
    mostraSpinner, nascondiSpinner, mostraErrore, messaggioErrore, mostraMessaggio,
    mostraSkeleton, renderPreferiti, renderSquadre, renderDettagli,
    apriEvento, trovaEventoMostrato, mostraSezioneAppuntamenti, appuntamentiInCaricamento,
    renderAppuntamenti, segnaBottoneSalvato, segnaBottoneDaSalvare, aggiornaBottoniFiltro
} from "./ui.js";


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


// === Appuntamenti ===

async function caricaAppuntamenti() {
    mostraSezioneAppuntamenti(preferiti.length > 0);

    if (preferiti.length === 0) return;

    appuntamentiInCaricamento();

    // allSettled e non all: una squadra che fallisce non deve fermare le altre
    const esiti = await Promise.allSettled(
        preferiti.map((squadra) => caricaProssimi(squadra.id))
    );

    const appuntamenti = [];
    let falliti = 0;

    esiti.forEach((esito, i) => {
        if (esito.status === "rejected") {
            falliti += 1;
            return;
        }

        esito.value.forEach((evento) => {
            appuntamenti.push({ evento, squadra: preferiti[i] });
        });
    });

    appuntamenti.sort((a, b) => new Date(a.evento.data) - new Date(b.evento.data));

    renderAppuntamenti(appuntamenti, falliti);
}


// === Eventi ===

async function eseguiRicerca(query) {
    controller?.abort();
    controller = new AbortController();

    const { signal } = controller;

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
        renderSquadre(squadre, preferiti);
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
    renderPreferiti(preferitiFiltrati(), preferiti.length);
    caricaAppuntamenti();

    segnaBottoneSalvato(bottone);
});

preferitiBox.addEventListener("click", (e) => {
    const bottone = e.target.closest('[data-azione="rimuovi"]');

    if (!bottone) return;

    const id = bottone.closest("[data-id]").dataset.id;

    preferiti = preferiti.filter((squadra) => squadra.id !== id);
    rimuoviCache(id);
    salvaPreferiti();
    renderPreferiti(preferitiFiltrati(), preferiti.length);
    caricaAppuntamenti();

    const daRiattivare = risultati.querySelector(`[data-id="${id}"] [data-azione="aggiungi"]`);

    if (daRiattivare) {
        segnaBottoneDaSalvare(daRiattivare);
    }
});

// Le tre liste di eventi si comportano allo stesso modo: un gestore solo.
function gestisciClickEvento(e) {
    const voce = e.target.closest("[data-evento]");

    if (!voce) return;

    const evento = trovaEventoMostrato(voce.dataset.evento);

    if (evento) apriEvento(evento);
}

[listaProssimi, listaUltimi, appuntamentiLista].forEach((lista) => {
    lista.addEventListener("click", gestisciClickEvento);

    lista.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        if (!e.target.closest("[data-evento]")) return;

        // lo spazio farebbe scorrere la pagina
        e.preventDefault();

        gestisciClickEvento(e);
    });
});

filtriSport.addEventListener("click", (e) => {
    const bottone = e.target.closest("[data-sport]");

    if (!bottone) return;

    filtroSport = bottone.dataset.sport;

    aggiornaBottoniFiltro(filtroSport);

    renderPreferiti(preferitiFiltrati(), preferiti.length);
});

renderPreferiti(preferitiFiltrati(), preferiti.length);
caricaAppuntamenti();
mostraMessaggio("Cerca una squadra per iniziare.");
