// Tutto quello che tocca la rete: le chiamate a TheSportsDB, la pausa dopo un
// rifiuto e la cache che evita di richiedere due volte gli stessi eventi.

import { Squadra, Evento } from "./classi.js";

const BASE = "https://www.thesportsdb.com/api/v1/json/123/";

// Dopo un rifiuto conviene fermarsi: altre richieste subito dopo vengono
// rifiutate uguale e tengono in piedi il blocco dell'API.
const PAUSA_DOPO_ERRORE = 30 * 1000;
let bloccatoFinoA = 0;

async function getJSON(url, opzioni) {
    if (Date.now() < bloccatoFinoA) {
        const err = new Error("In pausa dopo un rifiuto");
        err.status = 429;
        throw err;
    }

    let risposta;

    try {
        risposta = await fetch(url, opzioni);
    } catch (err) {
        // Una ricerca annullata dal debounce non e' un rifiuto del servizio.
        if (err.name !== "AbortError") {
            bloccatoFinoA = Date.now() + PAUSA_DOPO_ERRORE;
        }

        throw err;
    }

    if (!risposta.ok) {
        bloccatoFinoA = Date.now() + PAUSA_DOPO_ERRORE;

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

// Una sola cache, per squadra, nel localStorage:
//   { "134867": { salvatoIl: 1763..., prossimi: [...], ultimi: [...] } }
// Vale dieci minuti e sopravvive al ricaricamento, cosi' la stessa squadra non
// viene richiesta due volte di seguito e il limite dell'API resta lontano.
// ultimi vale null finche' nessuno ha aperto la modale di quella squadra.
const CACHE_KEY = "sportshub:eventi";
const DURATA_CACHE = 10 * 60 * 1000;

function leggiCache(idTeam) {
    const tutto = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
    const voce = tutto[idTeam];

    if (!voce || Date.now() - voce.salvatoIl > DURATA_CACHE) return null;

    return {
        prossimi: voce.prossimi.map((evento) => Evento.fromJSON(evento)),
        ultimi: voce.ultimi ? voce.ultimi.map((evento) => Evento.fromJSON(evento)) : null
    };
}

function salvaCache(idTeam, dati) {
    const tutto = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");

    tutto[idTeam] = {
        salvatoIl: Date.now(),
        prossimi: dati.prossimi,
        ultimi: dati.ultimi ?? null
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(tutto));
}

// Una squadra tolta dai preferiti non deve lasciare eventi nel localStorage.
function rimuoviCache(idTeam) {
    const tutto = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");

    delete tutto[idTeam];

    localStorage.setItem(CACHE_KEY, JSON.stringify(tutto));
}

// Per la lista degli appuntamenti serve solo eventsnext: meta' delle chiamate.
async function caricaProssimi(idTeam) {
    const voce = leggiCache(idTeam);

    if (voce) return voce.prossimi;

    const url = new URL("eventsnext.php", BASE);

    url.searchParams.set("id", idTeam);

    const dati = await getJSON(url);
    const prossimi = (dati.events ?? []).map((evento) => new Evento(evento));

    salvaCache(idTeam, { prossimi });

    return prossimi;
}

async function caricaDettagli(idTeam) {
    const voce = leggiCache(idTeam);

    // tutto gia' in cache: la modale si apre senza toccare la rete
    if (voce?.ultimi) return voce;

    const urlUltimi = new URL("eventslast.php", BASE);

    urlUltimi.searchParams.set("id", idTeam);

    // i prossimi li ha gia' presi la lista degli appuntamenti: manca solo il resto
    if (voce) {
        const dati = await getJSON(urlUltimi);

        const dettagli = {
            prossimi: voce.prossimi,
            ultimi: (dati.results ?? []).map((evento) => new Evento(evento))
        };

        salvaCache(idTeam, dettagli);

        return dettagli;
    }

    const urlProssimi = new URL("eventsnext.php", BASE);

    urlProssimi.searchParams.set("id", idTeam);

    // niente in cache: le due chiamate partono insieme
    const [datiProssimi, datiUltimi] = await Promise.all([
        getJSON(urlProssimi),
        getJSON(urlUltimi)
    ]);

    const dettagli = {
        prossimi: (datiProssimi.events ?? []).map((evento) => new Evento(evento)),
        ultimi: (datiUltimi.results ?? []).map((evento) => new Evento(evento))
    };

    salvaCache(idTeam, dettagli);

    return dettagli;
}

export { cercaSquadre, caricaProssimi, caricaDettagli, rimuoviCache };
