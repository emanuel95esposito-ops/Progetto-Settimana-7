// Costruzione dei contenuti: card delle squadre, liste di eventi, schede.
// Prende i dati gia' pronti e li trasforma in nodi del documento; lo stato
// dell'interfaccia (spinner, messaggi, barra utente) sta invece in ui.js.

import {
    appuntamentiLista,
    creaElemento,
    dettagliLogo,
    dettagliMeta,
    dettagliModal,
    dettagliNome,
    eventoCasa,
    eventoDati,
    eventoModal,
    eventoPunteggio,
    eventoStemmaCasa,
    eventoStemmaTrasferta,
    eventoTitolo,
    eventoTrasferta,
    filtriSport,
    listaProssimi,
    listaUltimi,
    preferitiBox,
    preferitiVuoto,
    risultati,
    titoloRisultati
} from "./ui.js";


// Gli eventi disegnati a schermo, per id: al clic serve l'oggetto, non il DOM.
const eventiMostrati = new Map();


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

        const info = creaElemento("div", "flex-grow-1", li);

        creaElemento("p", "text-body-secondary small mb-0", info,
            `${evento.dataFormattata()} · ${squadra.nome}`);

        creaElemento("p", "fw-semibold mb-0", info, `${evento.casa} vs ${evento.trasferta}`);

        // Competizione e stadio riempiono la riga su schermo largo; sul telefono
        // sparirebbero a capo, quindi restano nascosti.
        const contorno = [evento.lega, evento.stadio].filter(Boolean).join(" · ");

        if (contorno) {
            creaElemento("p", "text-body-secondary small mb-0 d-none d-md-block", info, contorno);
        }

        // A destra giorno e ora: senza, la freccia resterebbe sola nel vuoto.
        const quando = creaElemento("div", "text-end d-none d-sm-block");

        const giorno = evento.giornoSettimana();
        const ora = evento.oraFormattata();

        if (giorno) {
            creaElemento("p", "text-body-secondary small text-uppercase mb-0", quando, giorno);
        }

        if (ora) {
            creaElemento("p", "fw-semibold mb-0", quando, ora);
        }

        if (quando.children.length > 0) li.appendChild(quando);

        creaElemento("i", "fa-solid fa-chevron-right text-body-secondary", li);

        return li;
    });

    if (falliti > 0) {
        const avviso = creaElemento("li", "text-body-secondary small fst-italic pt-2", undefined,
            `${falliti} squadra/e non ha risposto: riprova tra qualche secondo.`);

        voci.push(avviso);
    }

    appuntamentiLista.replaceChildren(...voci);
}

// L'evento che la voce rappresenta, per quando l'utente la clicca.
function trovaEventoMostrato(id) {
    return eventiMostrati.get(id);
}


export {
    apriEvento,
    creaCardSquadra,
    renderAppuntamenti,
    renderDettagli,
    renderEventi,
    renderEvento,
    renderPreferiti,
    renderSquadre,
    rendiCliccabile,
    trovaEventoMostrato
};
