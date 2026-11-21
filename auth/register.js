// La pagina di registrazione. In modalita' demo il backend non la offre:
// invece di fingere che funzioni, il form lo dice e si disattiva.

import {
    MODALITA, registra, utenteCorrente, etichettaIdentita, registrazioneDisponibile, messaggioAuth
} from "./auth.js";
import { collegaBottoneTema } from "../assets/js/tema.js";

collegaBottoneTema();

const form = document.querySelector("#form-registrazione");
const campoIdentita = document.querySelector("#identita");
const campoPassword = document.querySelector("#password");
const campoConferma = document.querySelector("#conferma");
const etichetta = document.querySelector("#etichetta-identita");
const errore = document.querySelector("#errore-registrazione");
const avviso = document.querySelector("#avviso-modalita");
const bottone = document.querySelector("#bottone-registra");
const spinner = document.querySelector("#spinner-registra");

if (utenteCorrente()) {
    location.replace("../index.html");
}

etichetta.textContent = etichettaIdentita();

// In modalita' locale l'identita' e' l'email, in demo il nome utente.
campoIdentita.type = MODALITA === "locale" ? "email" : "text";

if (!registrazioneDisponibile()) {
    avviso.textContent =
        "L'app è in modalità demo: il servizio di prova non permette di creare account. " +
        "Puoi entrare con le credenziali di esempio dalla pagina di accesso, oppure " +
        "avviare il backend locale (npm run server) e passare alla modalità “locale”.";

    avviso.hidden = false;

    form.querySelectorAll("input, button").forEach((campo) => {
        campo.disabled = true;
    });
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

    if (password.length < 6) {
        errore.textContent = "La password deve avere almeno sei caratteri.";
        errore.hidden = false;
        return;
    }

    if (password !== campoConferma.value) {
        errore.textContent = "Le due password non coincidono.";
        errore.hidden = false;
        return;
    }

    errore.hidden = true;
    inCorso(true);

    try {
        await registra(identita, password);

        location.replace("../index.html");
    } catch (err) {
        errore.textContent = messaggioAuth(err);
        errore.hidden = false;
    } finally {
        inCorso(false);
    }
});
