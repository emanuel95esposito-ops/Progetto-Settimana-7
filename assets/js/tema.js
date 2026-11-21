// Tema chiaro/scuro. Bootstrap 5.3 cambia tutta la palette leggendo
// l'attributo data-bs-theme sull'elemento <html>: qui si decide solo quale
// dei due valori scriverci e lo si ricorda da una visita all'altra.

const TEMA_KEY = "sportshub:tema";

function temaDiSistema() {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// La scelta dell'utente vince su quella del sistema; se non ha mai scelto,
// si parte da come ha impostato il suo computer.
function temaCorrente() {
    return localStorage.getItem(TEMA_KEY) ?? temaDiSistema();
}

function applicaTema(tema) {
    document.documentElement.setAttribute("data-bs-theme", tema);
}

function salvaTema(tema) {
    localStorage.setItem(TEMA_KEY, tema);

    applicaTema(tema);
}

function alternaTema() {
    const nuovo = temaCorrente() === "dark" ? "light" : "dark";

    salvaTema(nuovo);

    return nuovo;
}

// Il bottone sta nella barra di tutte le pagine: qui si occupa anche
// dell'icona, che indica dove si va, non dove si e'.
function collegaBottoneTema() {
    const bottone = document.querySelector("#tema");

    if (!bottone) return;

    const icona = bottone.querySelector("i");

    const mostra = (tema) => {
        const scuro = tema === "dark";

        icona.className = scuro ? "fa-solid fa-sun" : "fa-solid fa-moon";
        bottone.title = scuro ? "Passa al tema chiaro" : "Passa al tema scuro";
    };

    mostra(temaCorrente());

    bottone.addEventListener("click", () => mostra(alternaTema()));
}

export { temaCorrente, applicaTema, alternaTema, collegaBottoneTema };
