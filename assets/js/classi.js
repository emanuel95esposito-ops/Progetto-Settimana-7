// Le due classi che danno forma ai dati di TheSportsDB.
// Vivono da sole perche' le usano sia le chiamate di rete sia il resto dell'app.

class Squadra {
    constructor(dati) {
        this.id = dati.idTeam;
        this.nome = dati.strTeam;
        this.logo = dati.strBadge;
        this.lega = dati.strLeague;
        this.paese = dati.strCountry;
        this.sport = dati.strSport;

        // Immagine panoramica della squadra: fa da sfondo alla sua scheda.
        // Il banner e' il ripiego per chi non ha fanart.
        this.sfondo = dati.strFanart1 ?? dati.strBanner ?? null;
    }

    // I preferiti tornano dal localStorage con i nomi italiani:
    // qui rifanno il percorso inverso verso il costruttore.
    static fromJSON(dati) {
        return new Squadra({
            idTeam: dati.id,
            strTeam: dati.nome,
            strBadge: dati.logo,
            strLeague: dati.lega,
            strCountry: dati.paese,
            strSport: dati.sport,
            strFanart1: dati.sfondo
        });
    }
}

class Evento {
    constructor(dati) {
        this.id = dati.idEvent;
        this.data = dati.dateEvent;
        this.casa = dati.strHomeTeam;
        this.trasferta = dati.strAwayTeam;
        this.punteggioCasa = dati.intHomeScore;
        this.punteggioTrasferta = dati.intAwayScore;

        // Campi di contorno: servono alla scheda del singolo evento.
        this.nome = dati.strEvent;
        this.lega = dati.strLeague;
        this.stagione = dati.strSeason;
        this.giornata = dati.intRound;
        this.stadio = dati.strVenue;
        this.paese = dati.strCountry;
        this.ora = dati.strTime;

        // Momento esatto in UTC: con questo data e ora si possono mostrare nel
        // fuso di chi guarda, invece che in quello del server.
        this.istante = dati.strTimestamp;
        this.stemmaCasa = dati.strHomeTeamBadge;
        this.stemmaTrasferta = dati.strAwayTeamBadge;
        this.video = dati.strVideo;
    }

    // L'API manda l'orario in UTC: senza la Z finale il browser lo leggerebbe
    // come ora locale e la partita slitterebbe di qualche ora.
    quando() {
        if (this.istante) return new Date(`${this.istante}Z`);
        if (this.data) return new Date(this.data);

        return null;
    }

    dataFormattata() {
        const momento = this.quando();

        if (!momento) return "Data da definire";

        return new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(momento);
    }

    // "sab", per la colonna di destra degli appuntamenti.
    giornoSettimana() {
        const momento = this.quando();

        if (!momento) return null;

        return new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(momento);
    }

    oraFormattata() {
        if (this.istante) {
            return new Intl.DateTimeFormat("it-IT", {
                hour: "2-digit",
                minute: "2-digit"
            }).format(this.quando());
        }

        if (!this.ora) return null;

        // Senza timestamp resta l'orario grezzo: "15:00:00" diventa "15:00".
        return this.ora.slice(0, 5);
    }

    punteggio() {
        if (this.punteggioCasa === null || this.punteggioTrasferta === null) {
            return null;
        }

        return `${this.punteggioCasa} – ${this.punteggioTrasferta}`;
    }

    static fromJSON(dati) {
        return new Evento({
            idEvent: dati.id,
            dateEvent: dati.data,
            strHomeTeam: dati.casa,
            strAwayTeam: dati.trasferta,
            intHomeScore: dati.punteggioCasa,
            intAwayScore: dati.punteggioTrasferta,
            strEvent: dati.nome,
            strLeague: dati.lega,
            strSeason: dati.stagione,
            intRound: dati.giornata,
            strVenue: dati.stadio,
            strCountry: dati.paese,
            strTime: dati.ora,
            strTimestamp: dati.istante,
            strHomeTeamBadge: dati.stemmaCasa,
            strAwayTeamBadge: dati.stemmaTrasferta,
            strVideo: dati.video
        });
    }
}

export { Squadra, Evento };
