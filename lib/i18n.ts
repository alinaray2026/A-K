// Translations. Plain data only (strings / arrays) so it can be passed to client components.
export const LANGS = ["en", "it", "de"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_NAME: Record<Lang, string> = { en: "English", it: "Italiano", de: "Deutsch" };

const en = {
  locale: "en",
  countries: { Kosovo: "Kosovo", Albania: "Albania", England: "England", Italy: "Italy", Spain: "Spain" } as Record<string, string>,
  nav: { football: "Football", myBets: "My bets", leaderboard: "Leaderboard", admin: "Admin", results: "Results" },
  auth: {
    login: "Log in", signup: "Sign up", logout: "Log out", createAccount: "Create account",
    startBonus: "Get 1,000 free virtual points to start.", username: "Username", password: "Password",
    haveAccount: "Have an account?", noAccount: "No account?",
  },
  bonus: "Bonus", bonusTitle: "+100 points every day", pts: "pts", balance: "Balance",
  footer: "Demo with virtual points: no real money, no payments, no cash prizes. 18+. Play responsibly.",
  all: "All", match: "Match", betSlip: "Bet slip", odds: "Odds", stake: "Stake",
  potentialWin: "Potential win", payout: "Payout", single: "Single", accumulator: "Accumulator ({n})",
  placeBet: "Place bet", placing: "Placing…", insufficient: "Insufficient balance", clearSlip: "Clear slip",
  remove: "Remove", loginToPlay: "Log in to play", tapPrice: "Tap a price to add it to your bet slip.",
  noOpen: "No open matches right now.", latestResults: "Latest results", cancelled: "cancelled",
  noBets: "You haven't placed any bets yet.", bets: "Bets", won: "Won", player: "Player", points: "Points",
  status: { open: "Pending", won: "Won", lost: "Lost", void: "Void", pending: "Pending" },
  markets: { m1x2: "1X2", ou: "Over/Under 2.5", btts: "GG/NG", ouHeads: ["Over", "Under"] },
  sel: { "1": "Home win (1)", X: "Draw (X)", "2": "Away win (2)", O: "Over 2.5 goals", U: "Under 2.5 goals", GG: "Both teams score (GG)", NG: "Not both score (NG)" },
  selShort: { "1": "1", X: "X", "2": "2", O: "Over 2.5", U: "Under 2.5", GG: "GG", NG: "NG" },
  days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  admin: {
    title: "Admin panel", addMatch: "Add match", league: "League", leaguePh: "e.g. Kosovo · Superliga",
    home: "Home team", away: "Away team", rating: "Rating", kickoff: "Kick-off",
    priceNote: "Prices are calculated automatically from the ratings (Poisson model, 6% margin).",
    add: "Add", newRound: "New round", newRoundNote: "Creates new matches for all sample leagues over the next few days.",
    generate: "Generate round", openMatches: "Open matches ({n})", score: "Score", save: "Save",
    simulate: "Simulate", cancel: "Cancel", homeGoals: "Home goals", awayGoals: "Away goals",
    users: "Users", openBets: "Open bets", staked: "Total staked", paid: "Paid out",
  },
  msg: {
    betPlaced: "Bet #{id} placed! Potential win: {win}", scoreSaved: "Score saved, {n} bets settled",
    simulated: "Simulated {score}, {n} bets settled", matchCancelled: "Match cancelled, {n} bets refunded",
    roundAdded: "Added {n} new matches", matchAdded: "{match} added",
  },
  err: {
    minStake: "Minimum stake is {n}", emptySlip: "Bet slip is empty", maxSel: "Maximum {n} selections",
    invalidSel: "Invalid selection", onePerMatch: "Only one selection per match", userNotFound: "User not found",
    insufficient: "Insufficient balance", closed: "Betting on this match is closed", matchNotFound: "Match not found",
    alreadySettled: "Match is already settled", cannotCancel: "Match cannot be cancelled", loginToBet: "Log in to place a bet",
    adminsOnly: "Admins only", invalidScore: "Invalid score", username: "Username: 3–20 letters, numbers, _ or .",
    password: "Password must be at least 6 characters", taken: "That username is taken", wrongLogin: "Wrong username or password",
    leagueTeams: "Enter a league and two different teams", kickoffFuture: "Kick-off must be in the future",
    rating: "Rating must be 1–100", unknown: "Something went wrong",
  },
};
export type Dict = typeof en;

const it: Dict = {
  locale: "it",
  countries: { Kosovo: "Kosovo", Albania: "Albania", England: "Inghilterra", Italy: "Italia", Spain: "Spagna" },
  nav: { football: "Calcio", myBets: "Le mie scommesse", leaderboard: "Classifica", admin: "Admin", results: "Risultati" },
  auth: {
    login: "Accedi", signup: "Registrati", logout: "Esci", createAccount: "Crea account",
    startBonus: "Ricevi 1.000 punti virtuali gratis per iniziare.", username: "Nome utente", password: "Password",
    haveAccount: "Hai già un account?", noAccount: "Non hai un account?",
  },
  bonus: "Bonus", bonusTitle: "+100 punti ogni giorno", pts: "pt", balance: "Saldo",
  footer: "Demo con punti virtuali: niente soldi veri, nessun pagamento, nessuna vincita in denaro. 18+. Gioca responsabilmente.",
  all: "Tutte", match: "Partita", betSlip: "Schedina", odds: "Quota", stake: "Importo",
  potentialWin: "Vincita potenziale", payout: "Pagamento", single: "Singola", accumulator: "Multipla ({n})",
  placeBet: "Scommetti", placing: "Invio…", insufficient: "Saldo insufficiente", clearSlip: "Svuota schedina",
  remove: "Rimuovi", loginToPlay: "Accedi per giocare", tapPrice: "Tocca una quota per aggiungerla alla schedina.",
  noOpen: "Nessuna partita aperta al momento.", latestResults: "Ultimi risultati", cancelled: "annullata",
  noBets: "Non hai ancora piazzato scommesse.", bets: "Scommesse", won: "Vinte", player: "Giocatore", points: "Punti",
  status: { open: "In attesa", won: "Vinta", lost: "Persa", void: "Rimborsata", pending: "In attesa" },
  markets: { m1x2: "1X2", ou: "Under/Over 2,5", btts: "GG/NG", ouHeads: ["Over", "Under"] },
  sel: { "1": "Vittoria casa (1)", X: "Pareggio (X)", "2": "Vittoria trasferta (2)", O: "Over 2,5 gol", U: "Under 2,5 gol", GG: "Entrambe segnano (GG)", NG: "Non entrambe segnano (NG)" },
  selShort: { "1": "1", X: "X", "2": "2", O: "Over 2,5", U: "Under 2,5", GG: "GG", NG: "NG" },
  days: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
  admin: {
    title: "Pannello admin", addMatch: "Aggiungi partita", league: "Campionato", leaguePh: "es. Kosovo · Superliga",
    home: "Squadra di casa", away: "Squadra ospite", rating: "Rating", kickoff: "Calcio d'inizio",
    priceNote: "Le quote sono calcolate automaticamente dai rating (modello di Poisson, margine 6%).",
    add: "Aggiungi", newRound: "Nuova giornata", newRoundNote: "Crea nuove partite per tutti i campionati di esempio nei prossimi giorni.",
    generate: "Genera giornata", openMatches: "Partite aperte ({n})", score: "Risultato", save: "Salva",
    simulate: "Simula", cancel: "Annulla", homeGoals: "Gol casa", awayGoals: "Gol ospiti",
    users: "Utenti", openBets: "Scommesse aperte", staked: "Totale giocato", paid: "Pagato",
  },
  msg: {
    betPlaced: "Scommessa #{id} piazzata! Vincita potenziale: {win}", scoreSaved: "Risultato salvato, {n} scommesse liquidate",
    simulated: "Simulato {score}, {n} scommesse liquidate", matchCancelled: "Partita annullata, {n} scommesse rimborsate",
    roundAdded: "Aggiunte {n} nuove partite", matchAdded: "{match} aggiunta",
  },
  err: {
    minStake: "L'importo minimo è {n}", emptySlip: "La schedina è vuota", maxSel: "Massimo {n} selezioni",
    invalidSel: "Selezione non valida", onePerMatch: "Una sola selezione per partita", userNotFound: "Utente non trovato",
    insufficient: "Saldo insufficiente", closed: "Le scommesse su questa partita sono chiuse", matchNotFound: "Partita non trovata",
    alreadySettled: "La partita è già stata chiusa", cannotCancel: "Impossibile annullare la partita", loginToBet: "Accedi per scommettere",
    adminsOnly: "Solo per amministratori", invalidScore: "Risultato non valido", username: "Nome utente: 3–20 lettere, numeri, _ o .",
    password: "La password deve avere almeno 6 caratteri", taken: "Nome utente già in uso", wrongLogin: "Nome utente o password errati",
    leagueTeams: "Inserisci un campionato e due squadre diverse", kickoffFuture: "Il calcio d'inizio deve essere nel futuro",
    rating: "Il rating deve essere tra 1 e 100", unknown: "Qualcosa è andato storto",
  },
};

const de: Dict = {
  locale: "de",
  countries: { Kosovo: "Kosovo", Albania: "Albanien", England: "England", Italy: "Italien", Spain: "Spanien" },
  nav: { football: "Fußball", myBets: "Meine Wetten", leaderboard: "Rangliste", admin: "Admin", results: "Ergebnisse" },
  auth: {
    login: "Anmelden", signup: "Registrieren", logout: "Abmelden", createAccount: "Konto erstellen",
    startBonus: "Erhalte 1.000 kostenlose virtuelle Punkte zum Start.", username: "Benutzername", password: "Passwort",
    haveAccount: "Schon ein Konto?", noAccount: "Noch kein Konto?",
  },
  bonus: "Bonus", bonusTitle: "+100 Punkte jeden Tag", pts: "Pkt.", balance: "Guthaben",
  footer: "Demo mit virtuellen Punkten: kein Echtgeld, keine Zahlungen, keine Geldgewinne. 18+. Spiele verantwortungsvoll.",
  all: "Alle", match: "Spiel", betSlip: "Wettschein", odds: "Quote", stake: "Einsatz",
  potentialWin: "Möglicher Gewinn", payout: "Auszahlung", single: "Einzelwette", accumulator: "Kombiwette ({n})",
  placeBet: "Wette platzieren", placing: "Wird platziert…", insufficient: "Guthaben reicht nicht", clearSlip: "Wettschein leeren",
  remove: "Entfernen", loginToPlay: "Zum Spielen anmelden", tapPrice: "Tippe auf eine Quote, um sie zum Wettschein hinzuzufügen.",
  noOpen: "Derzeit keine offenen Spiele.", latestResults: "Letzte Ergebnisse", cancelled: "abgesagt",
  noBets: "Du hast noch keine Wetten platziert.", bets: "Wetten", won: "Gewonnen", player: "Spieler", points: "Punkte",
  status: { open: "Offen", won: "Gewonnen", lost: "Verloren", void: "Erstattet", pending: "Offen" },
  markets: { m1x2: "1X2", ou: "Über/Unter 2,5", btts: "Beide treffen", ouHeads: ["Über", "Unter"] },
  sel: { "1": "Heimsieg (1)", X: "Unentschieden (X)", "2": "Auswärtssieg (2)", O: "Über 2,5 Tore", U: "Unter 2,5 Tore", GG: "Beide treffen: Ja", NG: "Beide treffen: Nein" },
  selShort: { "1": "1", X: "X", "2": "2", O: "Über 2,5", U: "Unter 2,5", GG: "Ja", NG: "Nein" },
  days: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  admin: {
    title: "Admin-Bereich", addMatch: "Spiel hinzufügen", league: "Liga", leaguePh: "z. B. Kosovo · Superliga",
    home: "Heimteam", away: "Auswärtsteam", rating: "Rating", kickoff: "Anstoß",
    priceNote: "Quoten werden automatisch aus den Ratings berechnet (Poisson-Modell, 6 % Marge).",
    add: "Hinzufügen", newRound: "Neuer Spieltag", newRoundNote: "Erstellt neue Spiele für alle Beispiel-Ligen in den nächsten Tagen.",
    generate: "Spieltag erzeugen", openMatches: "Offene Spiele ({n})", score: "Ergebnis", save: "Speichern",
    simulate: "Simulieren", cancel: "Absagen", homeGoals: "Tore Heim", awayGoals: "Tore Auswärts",
    users: "Nutzer", openBets: "Offene Wetten", staked: "Gesamteinsatz", paid: "Ausgezahlt",
  },
  msg: {
    betPlaced: "Wette #{id} platziert! Möglicher Gewinn: {win}", scoreSaved: "Ergebnis gespeichert, {n} Wetten abgerechnet",
    simulated: "Simuliert {score}, {n} Wetten abgerechnet", matchCancelled: "Spiel abgesagt, {n} Wetten erstattet",
    roundAdded: "{n} neue Spiele hinzugefügt", matchAdded: "{match} hinzugefügt",
  },
  err: {
    minStake: "Mindesteinsatz ist {n}", emptySlip: "Der Wettschein ist leer", maxSel: "Maximal {n} Auswahlen",
    invalidSel: "Ungültige Auswahl", onePerMatch: "Nur eine Auswahl pro Spiel", userNotFound: "Nutzer nicht gefunden",
    insufficient: "Guthaben reicht nicht", closed: "Wetten auf dieses Spiel sind geschlossen", matchNotFound: "Spiel nicht gefunden",
    alreadySettled: "Spiel ist bereits abgerechnet", cannotCancel: "Spiel kann nicht abgesagt werden", loginToBet: "Bitte zum Wetten anmelden",
    adminsOnly: "Nur für Admins", invalidScore: "Ungültiges Ergebnis", username: "Benutzername: 3–20 Buchstaben, Zahlen, _ oder .",
    password: "Passwort muss mindestens 6 Zeichen haben", taken: "Benutzername ist bereits vergeben", wrongLogin: "Falscher Benutzername oder falsches Passwort",
    leagueTeams: "Liga und zwei verschiedene Teams angeben", kickoffFuture: "Anstoß muss in der Zukunft liegen",
    rating: "Rating muss zwischen 1 und 100 liegen", unknown: "Etwas ist schiefgelaufen",
  },
};

export const DICTS: Record<Lang, Dict> = { en, it, de };
export type ErrCode = keyof Dict["err"];

/** Fills {name} placeholders. */
export function fill(s: string, vars: Record<string, string | number> = {}) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function pickLang(cookie?: string, acceptLanguage?: string | null): Lang {
  if (cookie && (LANGS as readonly string[]).includes(cookie)) return cookie as Lang;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if ((LANGS as readonly string[]).includes(code)) return code as Lang;
  }
  return "en";
}

/** "England · Premier League" → "Inghilterra · Premier League" */
export function leagueName(league: string, d: Dict) {
  const [country, ...rest] = league.split(" · ");
  return rest.length && d.countries[country] ? [d.countries[country], ...rest].join(" · ") : league;
}
