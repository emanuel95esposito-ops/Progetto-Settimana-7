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
            strSport: dati.sport
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
        this.stemmaCasa = dati.strHomeTeamBadge;
        this.stemmaTrasferta = dati.strAwayTeamBadge;
        this.video = dati.strVideo;
    }

    dataFormattata() {
        if (!this.data) return "Data da definire";

        return new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(new Date(this.data));
    }

    oraFormattata() {
        if (!this.ora) return null;

        // L'API manda "15:00:00": i secondi non servono.
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
            strHomeTeamBadge: dati.stemmaCasa,
            strAwayTeamBadge: dati.stemmaTrasferta,
            strVideo: dati.video
        });
    }
}

export { Squadra, Evento };
