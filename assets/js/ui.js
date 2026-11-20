// Tutto il disegno della pagina: i riferimenti agli elementi, le funzioni che
// creano il DOM e i messaggi all'utente. Qui dentro non si chiama la rete e non
// si decide niente: si riceve cio' che va mostrato e lo si mostra.

const risultati = document.querySelector("#risultati");
const titoloRisultati = document.querySelector("#titolo-risultati");
const spinner = document.querySelector("#spinner");
const erroreModal = document.querySelector("#errore-modal");
const erroreTitolo = document.querySelector("#errore-titolo");
const erroreTesto = document.querySelector("#errore-testo");
const statoVuoto = document.querySelector("#stato-vuoto");
const formRicerca = document.querySelector("#form-ricerca");
const inputQuery = document.querySelector("#query");
const preferitiBox = document.querySelector("#preferiti");
const preferitiVuoto = document.querySelector("#preferiti-vuoto");
const filtriSport = document.querySelector("#filtri-sport");
const appuntamentiSection = document.querySelector("#appuntamenti-section");
const appuntamentiLista = document.querySelector("#appuntamenti");
const dettagliModal = document.querySelector("#dettagli-modal");
const dettagliLogo = document.querySelector("#dettagli-logo");
const dettagliNome = document.querySelector("#dettagli-nome");
const dettagliMeta = document.querySelector("#dettagli-meta");
const listaProssimi = document.querySelector("#prossimi");
const listaUltimi = document.querySelector("#ultimi");

const eventoModal = document.querySelector("#evento-modal");
const eventoTitolo = document.querySelector("#evento-titolo");
const eventoCasa = document.querySelector("#evento-casa");
const eventoTrasferta = document.querySelector("#evento-trasferta");
const eventoStemmaCasa = document.querySelector("#evento-stemma-casa");
const eventoStemmaTrasferta = document.querySelector("#evento-stemma-trasferta");
const eventoPunteggio = document.querySelector("#evento-punteggio");
const eventoDati = document.querySelector("#evento-dati");

function creaElemento(tag, classe, genitore, testo) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;
    if (testo !== undefined) elemento.textContent = testo;
    if (genitore) genitore.appendChild(elemento);

    return elemento;
}

function mostraSpinner() {
    spinner.hidden = false;
    statoVuoto.hidden = true;
}

function nascondiSpinner() {
    spinner.hidden = true;
}

// L'errore ferma l'utente in un riquadro da chiudere: non puo' passare inosservato.
// Il titolo dice subito di chi e' il problema: quasi sempre dell'archivio,
// che e' un servizio esterno, non dell'app.
function mostraErrore(messaggio) {
    erroreTitolo.textContent = navigator.onLine
        ? "Problema con TheSportsDB"
        : "Connessione assente";

    erroreTesto.textContent = messaggio;

    bootstrap.Modal.getOrCreateInstance(erroreModal).show();
}

function messaggioErrore(err, contesto) {
    if (err.status === 429) {
        return "TheSportsDB, l'archivio da cui l'app prende i dati, ha ricevuto troppe "
            + "richieste in poco tempo e le sta rifiutando. Aspetta qualche secondo e riprova.";
    }

    if (err.status) {
        return `${contesto}: TheSportsDB ha risposto con un errore ${err.status}. Riprova tra poco.`;
    }

    // Senza status il motivo non e' leggibile dal codice: una risposta rifiutata
    // dall'API arriva priva di intestazioni CORS, il browser la scarta e fetch
    // fallisce come se la rete fosse assente. navigator.onLine separa i due casi:
    // quando dice false il dispositivo e' davvero scollegato.
    if (!navigator.onLine) {
        return "Il dispositivo risulta scollegato dalla rete. Controlla la connessione e riprova.";
    }

    return "TheSportsDB non ha risposto. La chiave gratuita che l'app usa accetta poche "
        + "richieste al minuto, quindi è probabile che le stia rifiutando. Riprova tra un minuto.";
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

// elenco: i preferiti da mostrare (gia' filtrati). totale: quanti ce ne sono
// in tutto, per distinguere "nessun preferito" da "nessuno per questo sport".
function renderPreferiti(elenco, totale) {
    const colonne = elenco.map((squadra) => {
        const { colonna, card } = creaCardSquadra(squadra);

        const bottone = creaElemento("button", "btn btn-sm btn-outline-danger w-100 mt-3",
            card, "\u{1F5D1} Rimuovi");

        bottone.type = "button";
        bottone.dataset.azione = "rimuovi";

        return colonna;
    });

    preferitiBox.replaceChildren(...colonne);

    filtriSport.hidden = totale === 0;

    if (totale === 0) {
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

function renderSquadre(squadre, preferiti) {
    const colonne = squadre.map((squadra) => {
        const { colonna, card } = creaCardSquadra(squadra);
        const giaSalvata = preferiti.some((salvata) => salvata.id === squadra.id);

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


// Gli eventi disegnati a schermo, per id: al clic serve l'oggetto, non il DOM.
const eventiMostrati = new Map();

// Marca una voce come apribile e tiene da parte l'evento che rappresenta.
function rendiCliccabile(li, evento) {
    li.dataset.evento = evento.id;
    li.tabIndex = 0;
    li.setAttribute("role", "button");

    eventiMostrati.set(evento.id, evento);
}

function renderEvento(evento) {
    eventoTitolo.textContent = evento.nome ?? `${evento.casa} vs ${evento.trasferta}`;

    eventoCasa.textContent = evento.casa;
    eventoTrasferta.textContent = evento.trasferta;

    // Senza stemma l'immagine resta nascosta, invece di mostrare l'icona rotta.
    const stemma = (img, url, squadra) => {
        img.hidden = !url;
        img.src = url ?? "";
        img.alt = url ? `Stemma ${squadra}` : "";
    };

    stemma(eventoStemmaCasa, evento.stemmaCasa, evento.casa);
    stemma(eventoStemmaTrasferta, evento.stemmaTrasferta, evento.trasferta);

    eventoPunteggio.textContent = evento.punteggio() ?? "vs";

    // Una riga per ogni dato che l'API ha davvero mandato: gli sport senza
    // giornate mandano "0", che non ha senso mostrare.
    const dati = [
        ["Data", evento.dataFormattata()],
        ["Ora", evento.oraFormattata()],
        ["Competizione", evento.lega],
        ["Stagione", evento.stagione],
        ["Giornata", evento.giornata === "0" ? null : evento.giornata],
        ["Stadio", evento.stadio],
        ["Paese", evento.paese]
    ];

    const righe = dati
        .filter(([, valore]) => valore)
        .map(([etichetta, valore]) => {
            const li = creaElemento("li",
                "d-flex justify-content-between gap-3 border-bottom py-2");

            creaElemento("span", "text-body-secondary", li, etichetta);
            creaElemento("span", "fw-semibold text-end", li, valore);

            return li;
        });

    if (evento.video) {
        const li = creaElemento("li", "pt-3");
        const link = creaElemento("a", "btn btn-sm btn-outline-primary w-100", li,
            "Guarda gli highlights");

        link.href = evento.video;
        link.target = "_blank";
        link.rel = "noopener";

        righe.push(li);
    }

    eventoDati.replaceChildren(...righe);

    bootstrap.Modal.getOrCreateInstance(eventoModal).show();
}

function apriEvento(evento) {
    // Due modal aperti insieme si sovrappongono: se la scheda della squadra e'
    // aperta si chiude prima, e l'evento si apre a animazione finita.
    if (!dettagliModal.classList.contains("show")) {
        renderEvento(evento);
        return;
    }

    dettagliModal.addEventListener("hidden.bs.modal", () => renderEvento(evento), { once: true });

    bootstrap.Modal.getOrCreateInstance(dettagliModal).hide();
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

        rendiCliccabile(li, evento);

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

// --- Appuntamenti ---

function mostraSezioneAppuntamenti(visibile) {
    appuntamentiSection.hidden = !visibile;
}

function appuntamentiInCaricamento() {
    appuntamentiLista.replaceChildren(
        creaElemento("li", "text-body-secondary fst-italic py-2", undefined, "Caricamento in corso\u2026")
    );
}

// falliti: quante squadre non hanno risposto, per dirlo invece di fingere
// che non abbiano partite in programma.
function renderAppuntamenti(appuntamenti, falliti) {
    if (appuntamenti.length === 0) {
        appuntamentiLista.replaceChildren(
            creaElemento("li", "text-body-secondary fst-italic py-2", undefined,
                falliti > 0
                    ? "Non \u00e8 stato possibile caricare le partite. Riprova tra qualche secondo."
                    : "Nessuna partita in programma per le tue squadre.")
        );

        return;
    }

    const voci = appuntamenti.slice(0, 5).map(({ evento, squadra }) => {
        const li = creaElemento("li", "border-bottom py-3 d-flex align-items-center gap-3");

        rendiCliccabile(li, evento);

        // Lo stemma della squadra salvata, accanto alla partita invece che
        // in un'etichetta staccata in fondo alla riga.
        const stemma = creaElemento("img", "object-fit-contain flex-shrink-0", li);

        stemma.hidden = !squadra.logo;
        stemma.src = squadra.logo ?? "";
        stemma.alt = "";
        stemma.width = 36;
        stemma.height = 36;
        stemma.loading = "lazy";

        const info = creaElemento("div", "", li);

        creaElemento("p", "text-body-secondary small mb-0", info,
            `${evento.dataFormattata()} · ${squadra.nome}`);

        creaElemento("p", "fw-semibold mb-0", info, `${evento.casa} vs ${evento.trasferta}`);

        creaElemento("i", "fa-solid fa-chevron-right text-body-secondary ms-auto", li);

        return li;
    });

    if (falliti > 0) {
        const avviso = creaElemento("li", "text-body-secondary small fst-italic pt-2", undefined,
            `${falliti} squadra/e non ha risposto: riprova tra qualche secondo.`);

        voci.push(avviso);
    }

    appuntamentiLista.replaceChildren(...voci);
}


// --- Ritocchi a elementi gia' disegnati ---

// L'evento che la voce rappresenta, per quando l'utente la clicca.
function trovaEventoMostrato(id) {
    return eventiMostrati.get(id);
}

function segnaBottoneSalvato(bottone) {
    bottone.className = "btn btn-sm btn-secondary w-100 mt-3";
    bottone.textContent = "\u2713 Gi\u00e0 nei preferiti";
    bottone.disabled = true;
}

function segnaBottoneDaSalvare(bottone) {
    bottone.className = "btn btn-sm btn-warning w-100 mt-3";
    bottone.textContent = "\u2605 Aggiungi ai preferiti";
    bottone.disabled = false;
}

function aggiornaBottoniFiltro(filtroAttivo) {
    filtriSport.querySelectorAll("[data-sport]").forEach((bottone) => {
        const attivo = bottone.dataset.sport === filtroAttivo;

        bottone.classList.toggle("btn-primary", attivo);
        bottone.classList.toggle("btn-outline-primary", !attivo);
    });
}


export {
    risultati,
    titoloRisultati,
    statoVuoto,
    formRicerca,
    inputQuery,
    preferitiBox,
    filtriSport,
    appuntamentiLista,
    listaProssimi,
    listaUltimi,
    mostraSpinner,
    nascondiSpinner,
    mostraErrore,
    messaggioErrore,
    mostraMessaggio,
    mostraSkeleton,
    renderPreferiti,
    renderSquadre,
    renderDettagli,
    apriEvento,
    trovaEventoMostrato,
    mostraSezioneAppuntamenti,
    appuntamentiInCaricamento,
    renderAppuntamenti,
    segnaBottoneSalvato,
    segnaBottoneDaSalvare,
    aggiornaBottoniFiltro
};
