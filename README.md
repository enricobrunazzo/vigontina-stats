# Vigontina Stats

Applicazione web per la gestione **live** delle statistiche delle partite della **Vigontina San Paolo**, con supporto a eventi avanzati (gol, rigori, azioni salienti) ed esportazione dei dati in Excel/PDF e report FIGC.

## Caratteristiche principali

- Gestione partite e periodi di gioco con timer integrato
- Registrazione eventi: gol, autogol, rigori con selezione marcatore/assist
- Sezione **Azioni Salienti** (Parata, Tiro Fuori, Palo/Traversa) ottimizzata per l'uso da bordo campo
- Storico partite con filtri per competizione ed esportazione in **Excel/PDF**
- Generazione **report FIGC** anche dallo storico
- **Pagina Statistiche** con classifica marcatori, gol subiti e statistiche difensive
- Integrazione con **Firebase** per autenticazione e persistenza dati

## Torneo Mirabilandia Festival

Regole e campi dedicati:

- Selezione **Campo di gioco** da menù a tendina (obbligatoria per creare la partita)
- Non è previsto **Casa/Trasferta**
- Non è previsto lo **Staff** (Assistente Arbitro / Dirigente Accompagnatore)
- Partita con **2 tempi** (1° e 2°)

## Stack tecnico

- **Frontend**: React + Vite
- **UI**: Tailwind CSS
- **Backend/BaaS**: Firebase (Authentication, Firestore/Realtime Database)
- **Build/Tooling**: Node.js, npm

Dettagli di configurazione sono descritti in `SETUP_FIREBASE.md` e nei file di configurazione (`vite.config.js`, `tailwind.config.js`).

## Setup locale

1. Clona il repository:
   ```bash
   git clone https://github.com/enricobrunazzo/vigontina-stats.git
   cd vigontina-stats
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Configura Firebase seguendo la guida in `SETUP_FIREBASE.md` (creazione progetto, chiavi API, file di configurazione)

4. Avvia l'ambiente di sviluppo:
   ```bash
   npm run dev
   ```

5. Apri il browser su `http://localhost:5173` (o porta indicata da Vite)

## Flusso di utilizzo (live match)

1. Crea una nuova partita e definisci i periodi
2. Avvia il periodo per attivare timer e gestione punteggio
3. Registra gli eventi tramite i pulsanti:
   - Gol Vigontina / Gol Avversario / Autogol / Rigore
   - **Azioni Salienti**: Parata, Tiro Fuori, Palo/Traversa
4. A fine periodo/partita, salva i dati ed esegui eventuale esportazione o generazione report FIGC

Per una descrizione dettagliata degli eventi e delle schermate vedi `LIVE_MATCH_FLOW.md`.

## Dettaglio Eventi

- **Gol Vigontina**: selezione marcatore (+ assist opzionale)
- **Gol Avversario**: inserimento diretto
- **Autogol**: scelta squadra (il punto viene assegnato alla squadra avversaria)
- **Rigore**: scelta squadra, esito (gol/fallito), marcatore se Vigontina
- **Parata**: scelta squadra; se Vigontina, selezione portiere
- **Tiro Fuori**: scelta squadra; se Vigontina, selezione giocatore
- **Palo/Traversa**: scelta tra Palo/Traversa, scelta squadra; se Vigontina, selezione giocatore

## Pagina Statistiche

Accessibile dallo Storico Partite tramite il pulsante dedicato.

### Riepilogo stagione

- **Gol segnati** — totale gol Vigontina nella stagione
- **Gol subiti** — totale gol avversari nella stagione

### Statistiche difensive

| Metrica | Descrizione |
|---|---|
| Gol Subiti Totali | Somma di tutti i gol avversari (esclusa Prova Tecnica) |
| Clean Sheets | Partite terminate senza subire gol |
| Media Gol Subiti / Partita | Media con 1 decimale |

### Classifica Marcatori

- Classifica ordinata per gol (desc), poi assist (desc), poi numero maglia (asc)
- Include: gol normali, rigori trasformati
- Esclude: periodi "Prova Tecnica", eventi cancellati
- Mostra assist accanto ai gol (🅰️)

## Novità recenti

### Aprile 2026

- **Statistiche** — aggiunta sezione gol subiti nella pagina statistiche:
  - Riepilogo stagione con gol segnati e subiti affiancati
  - Nuova sezione difesa con: gol subiti totali, clean sheets, media gol subiti/partita

### Gennaio 2026

- Torneo Mirabilandia Festival:
  - Campo di gioco obbligatorio da menù a tendina
  - Rimossi Casa/Trasferta e Staff
  - Partita impostata su 2 tempi
- Storico Partite:
  - Menu con 5 filtri competizione
  - Pulsante "Tutte le Partite" con blu più scuro

## Note UI

- L'icona di Palo/Traversa è unica (**🧱**) e viene poi distinta negli eventi (es. "🧱 Palo", "⎯ Traversa")
- La modalità **Prova Tecnica** permette solo modifiche manuali al punteggio, senza registrare eventi

## Esportazione

- Export Excel/PDF per partita e storico
- Report FIGC per partita corrente e storico

## Documentazione tecnica

Per approfondimenti consulta:
- `LIVE_MATCH_FLOW.md` — Flusso dettagliato della gestione live match
- `SETUP_FIREBASE.md` — Guida alla configurazione Firebase
- `AUTHENTICATION_GUIDE.md` — Sistema di autenticazione
- Codice dei componenti in `src/components/`

## Licenza

Uso interno - Tutti i diritti riservati
