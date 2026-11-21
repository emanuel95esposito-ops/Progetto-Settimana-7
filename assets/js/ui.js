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
const areaUtente = document.querySelector("#area-utente");
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


// --- Appuntamenti ---

function mostraSezioneAppuntamenti(visibile) {
    appuntamentiSection.hidden = !visibile;
}

function appuntamentiInCaricamento() {
    appuntamentiLista.replaceChildren(
        creaElemento("li", "text-body-secondary fst-italic py-2", undefined, "Caricamento in corso\u2026")
    );
}


// --- Ritocchi a elementi gia' disegnati ---


// La barra in alto: due link quando non c'e' nessuno, nome e uscita quando
// qualcuno e' entrato. Chi esce lo decide main.js, che passa la funzione.
function renderAreaUtente(utente, suUscita) {
    if (!utente) {
        const accedi = creaElemento("a", "btn btn-sm btn-outline-light", undefined, "Accedi");
        const registrati = creaElemento("a", "btn btn-sm btn-light", undefined, "Registrati");

        accedi.href = "./auth/login.html";
        registrati.href = "./auth/register.html";

        areaUtente.replaceChildren(accedi, registrati);

        return;
    }

    const saluto = creaElemento("span", "text-white small d-flex align-items-center gap-2");

    if (utente.immagine) {
        const avatar = creaElemento("img", "rounded-circle bg-white", saluto);

        avatar.src = utente.immagine;
        avatar.alt = "";
        avatar.width = 28;
        avatar.height = 28;
    }

    creaElemento("span", "fw-semibold", saluto, utente.nome);

    const esci = creaElemento("button", "btn btn-sm btn-outline-light", undefined, "Esci");

    esci.type = "button";
    esci.addEventListener("click", suUscita);

    areaUtente.replaceChildren(saluto, esci);
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
    aggiornaBottoniFiltro,
    appuntamentiInCaricamento,
    appuntamentiLista,
    appuntamentiSection,
    areaUtente,
    creaElemento,
    dettagliLogo,
    dettagliMeta,
    dettagliModal,
    dettagliNome,
    erroreModal,
    erroreTesto,
    erroreTitolo,
    eventoCasa,
    eventoDati,
    eventoModal,
    eventoPunteggio,
    eventoStemmaCasa,
    eventoStemmaTrasferta,
    eventoTitolo,
    eventoTrasferta,
    filtriSport,
    formRicerca,
    inputQuery,
    listaProssimi,
    listaUltimi,
    messaggioErrore,
    mostraErrore,
    mostraMessaggio,
    mostraSezioneAppuntamenti,
    mostraSkeleton,
    mostraSpinner,
    nascondiSpinner,
    preferitiBox,
    preferitiVuoto,
    renderAreaUtente,
    risultati,
    segnaBottoneDaSalvare,
    segnaBottoneSalvato,
    spinner,
    statoVuoto,
    titoloRisultati
};
