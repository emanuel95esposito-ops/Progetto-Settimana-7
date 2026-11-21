// La pagina di accesso: prende i dati dal form e li passa ad auth.js, che sa
// quale dei due backend interrogare.

import {
    MODALITA, login, utenteCorrente, etichettaIdentita, credenzialiDiProva,
    registrazioneDisponibile, messaggioAuth
} from "./auth.js";
import { collegaBottoneTema } from "../assets/js/tema.js";

collegaBottoneTema();

const form = document.querySelector("#form-login");
const campoIdentita = document.querySelector("#identita");
const campoPassword = document.querySelector("#password");
const etichetta = document.querySelector("#etichetta-identita");
const errore = document.querySelector("#errore-login");
const avviso = document.querySelector("#avviso-modalita");
const bottone = document.querySelector("#bottone-accedi");
const spinner = document.querySelector("#spinner-accedi");
const bottoneProva = document.querySelector("#usa-prova");

// Chi ha gia' una sessione non ha niente da fare qui.
if (utenteCorrente()) {
    location.replace("../index.html");
}

// L'etichetta cambia con il backend: DummyJSON vuole il nome utente,
// json-server-auth l'email.
etichetta.textContent = etichettaIdentita();
campoIdentita.type = MODALITA === "locale" ? "email" : "text";

const prova = credenzialiDiProva();

if (prova) {
    bottoneProva.hidden = false;

    bottoneProva.addEventListener("click", () => {
        campoIdentita.value = prova.identita;
        campoPassword.value = prova.password;
        campoPassword.focus();
    });
}

if (!registrazioneDisponibile()) {
    avviso.textContent = "Modalità demo: l'accesso è reale, ma non è possibile creare nuovi account.";
    avviso.hidden = false;
}

function inCorso(attivo) {
    bottone.disabled = attivo;
    spinner.hidden = !attivo;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identita = campoIdentita.value.trim();
    const password = campoPassword.value;

    if (!identita || !password) {
        errore.textContent = "Compila tutti i campi.";
        errore.hidden = false;
        return;
    }

    errore.hidden = true;
    inCorso(true);

    try {
        await login(identita, password);

        location.replace("../index.html");
    } catch (err) {
        errore.textContent = messaggioAuth(err);
        errore.hidden = false;
    } finally {
        inCorso(false);
    }
});
