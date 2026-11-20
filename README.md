# SportsHub

Ricerca squadre sportive e consulta prossime partite e ultimi risultati,
con dati in tempo reale da TheSportsDB.

Week project della Settimana VII — Master Front-End EPICODE.

## Anteprima

<!-- screenshot della pagina, da aggiungere a interfaccia pronta -->

## Funzionalità

- Ricerca di una squadra per nome (calcio, basket, football americano)
- Card con logo, campionato e paese
- Dettaglio squadra: prossime partite e ultimi risultati caricati in parallelo
- Squadre preferite salvate nel browser e legate all'utente autenticato
- Tema chiaro/scuro con preferenza ricordata tra una visita e l'altra
- Accesso e registrazione su pagine dedicate

## Tecnologie

HTML5, CSS3, Bootstrap 5.3, JavaScript ES6+ (classi, moduli, async/await).
Nessuna dipendenza da installare per la modalità predefinita.

## API

[TheSportsDB](https://www.thesportsdb.com) — API REST pubblica, chiave di test gratuita.

| Endpoint | Scopo |
|---|---|
| `/searchteams.php?t=` | ricerca squadre per nome |
| `/eventsnext.php?id=` | prossime partite |
| `/eventslast.php?id=` | ultimi risultati |

La chiave di test gratuita è `123`. Comporta due limiti, entrambi gestiti dall'interfaccia:
la ricerca restituisce **una sola squadra** per volta, quella con il match migliore,
e molte squadre non espongono partite future.

## Autenticazione

L'app usa due backend intercambiabili dietro la stessa interfaccia, selezionabili
dalla costante `MODALITA` in `assets/js/auth.js`:

**`"demo"` (predefinita)** — [DummyJSON](https://dummyjson.com).
Login reale con JWT salvato in localStorage, header `Authorization: Bearer`,
disconnessione automatica alla risposta 401. Funziona online senza installare nulla.
La registrazione non è disponibile: DummyJSON non espone un endpoint per creare utenti,
e il form lo dichiara invece di simularla.
Credenziali di prova: `emilys` / `emilyspass`, precompilabili dalla pagina di accesso.

**`"locale"`** — [json-server-auth](https://github.com/jeremyben/json-server-auth).
Registrazione e accesso completi su un backend finto in locale. Richiede:

    npm install
    npm run server

e `MODALITA = "locale"`. Il server resta in ascolto su `http://localhost:3001`.

L'accesso è facoltativo: ricerca e dettagli funzionano anche senza autenticarsi.
Il login serve a legare i preferiti a un utente, così account diversi vedono
elenchi diversi.

## Come avviarlo

Serve un server locale: i moduli ES non funzionano aprendo il file con doppio clic.

1. Clona il repository
2. Apri la cartella in VS Code
3. Avvia Live Server su `index.html`

## Struttura

    index.html
    auth/
      login.html
      register.html
    assets/
      css/style.css
      js/

## Stato

- [x] Setup del progetto
- [ ] Versione Base — ricerca squadre e dettaglio con Promise.all
- [ ] Versione Intermedia — preferiti, debounce, layout responsive
- [ ] Versione Avanzata — filtro per sport, modal evento, moduli ES
- [ ] Extra — autenticazione a due backend, tema chiaro/scuro

## Versioni

| Tag | Contenuto |
|---|---|
| `v0.1.0` | ricerca squadre funzionante |
| `v0.2.0` | dettaglio squadra |
| `v1.0.0` | Versione Base completa |