// Autenticazione: due backend dietro la stessa interfaccia.
//
//   "demo"   DummyJSON, online, non richiede installazioni. Login vero con JWT,
//            ma nessuna registrazione: il servizio non la espone.
//   "locale" json-server-auth su localhost:3001. Registrazione e accesso
//            completi, ma bisogna avviare il server (npm run server).
//
// Il resto dell'app non sa quale dei due sia attivo: cambia solo questa riga.

const MODALITA = "demo";

const BACKEND = {
    demo: {
        base: "https://dummyjson.com",
        login: "/auth/login",
        profilo: "/auth/me",
        registrazione: null,
        campo: "username",
        etichetta: "Nome utente",
        prova: { identita: "emilys", password: "emilyspass" }
    },
    locale: {
        base: "http://localhost:3001",
        login: "/login",
        profilo: null,
        registrazione: "/register",
        campo: "email",
        etichetta: "Email",
        prova: null
    }
};

const config = BACKEND[MODALITA];

const TOKEN_KEY = "sportshub:token";
const UTENTE_KEY = "sportshub:utente";


// === Cosa sa fare il backend attivo ===

function etichettaIdentita() {
    return config.etichetta;
}

function registrazioneDisponibile() {
    return config.registrazione !== null;
}

function credenzialiDiProva() {
    return config.prova;
}


// === Sessione nel browser ===

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// L'utente resta nel localStorage: al caricamento il nome si mostra subito,
// senza aspettare la risposta del server.
function utenteCorrente() {
    const salvato = localStorage.getItem(UTENTE_KEY);

    return salvato ? JSON.parse(salvato) : null;
}

function salvaSessione(token, utente) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(UTENTE_KEY, JSON.stringify(utente));
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(UTENTE_KEY);
}


// === Chiamate ===

async function chiama(percorso, opzioni = {}) {
    let risposta;

    try {
        risposta = await fetch(config.base + percorso, opzioni);
    } catch (err) {
        // Con il backend locale spento la fetch fallisce senza risposta.
        const nostro = new Error("Server non raggiungibile");

        nostro.offline = true;

        throw nostro;
    }

    if (!risposta.ok) {
        const err = new Error(`HTTP ${risposta.status}`);

        err.status = risposta.status;

        throw err;
    }

    return risposta.json();
}

// I due servizi rispondono con forme diverse: qui diventano un utente solo.
function normalizza(dati) {
    const base = dati.user ?? dati;

    // json-server-auth conosce solo l'email: per il saluto basta la parte
    // davanti alla chiocciola.
    const nome = base.firstName ?? base.username ?? base.email?.split("@")[0];

    return {
        id: base.id,
        nome,
        email: base.email ?? null,
        immagine: base.image ?? null
    };
}

async function login(identita, password) {
    const corpo = { password };

    corpo[config.campo] = identita;

    const dati = await chiama(config.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
    });

    const utente = normalizza(dati);

    salvaSessione(dati.accessToken ?? dati.token, utente);

    return utente;
}

async function registra(identita, password) {
    if (!registrazioneDisponibile()) {
        throw new Error("La registrazione non è disponibile in questa modalità");
    }

    const corpo = { password };

    corpo[config.campo] = identita;

    const dati = await chiama(config.registrazione, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
    });

    const utente = normalizza(dati);

    salvaSessione(dati.accessToken ?? dati.token, utente);

    return utente;
}

// All'avvio: controlla che il token valga ancora. Se il server lo rifiuta,
// la sessione e' scaduta e va chiusa.
async function verificaSessione() {
    const token = getToken();

    if (!token || !config.profilo) return utenteCorrente();

    try {
        const dati = await chiama(config.profilo, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const utente = normalizza(dati);

        salvaSessione(token, utente);

        return utente;
    } catch (err) {
        if (err.status === 401) {
            logout();
            return null;
        }

        // Rete assente: teniamo buono quello che sappiamo gia'.
        return utenteCorrente();
    }
}

// Messaggi leggibili al posto dei codici di stato.
function messaggioAuth(err) {
    if (err.offline) {
        return MODALITA === "locale"
            ? "Il server locale non risponde. Avvialo con npm run server e riprova."
            : "Impossibile contattare il servizio di accesso. Controlla la connessione.";
    }

    if (err.status === 400 || err.status === 401) {
        return "Credenziali non valide. Controlla i dati inseriti.";
    }

    return "Accesso non riuscito. Riprova tra poco.";
}


export {
    MODALITA,
    etichettaIdentita,
    registrazioneDisponibile,
    credenzialiDiProva,
    getToken,
    utenteCorrente,
    login,
    registra,
    logout,
    verificaSessione,
    messaggioAuth
};
