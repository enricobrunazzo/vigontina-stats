# Vigontina Stats

Applicazione per la gestione live delle statistiche partita della Vigontina San Paolo.

## Novità (Ottobre 2025)

- Sezione "Azioni Salienti" durante il live match con tre azioni rapide:
  - 🧤 Parata (scelta squadra; se Vigontina, selezione portiere)
  - 🎯 Tiro Fuori (scelta squadra; se Vigontina, selezione giocatore)
  - 🧱 Palo/Traversa (icona neutra "🧱"; scelta tra Palo o Traversa nel modal; scelta squadra; se Vigontina, selezione giocatore)
- Layout pulsanti riorganizzato per velocità in live:
  - Riga 1: Gol Vigontina | Gol Avversario
  - Riga 2: Autogol | Rigore
  - Riga 3: Azioni Salienti (Parata | Tiro Fuori | Palo/Traversa)
- Lista eventi aggiornata con icone e colori dedicati per ogni azione.

## Flusso Live (riassunto)

1. Crea una nuova partita e imposta i periodi.
2. Avvia il periodo: controlli timer e punteggio.
3. Usa i pulsanti evento:
   - Gol/Autogol/Rigore
   - Azioni Salienti: Parata, Tiro Fuori, Palo/Traversa
4. Termina il periodo e salva.

## Dettaglio Eventi

- Gol Vigontina: selezione marcatore (+ assist opzionale)
- Gol Avversario: inserimento diretto
- Autogol: scelta squadra (il punto viene assegnato alla squadra avversaria)
- Rigore: scelta squadra, esito (gol/fallito), marcatore se Vigontina
- Parata: scelta squadra; se Vigontina, selezione portiere
- Tiro Fuori: scelta squadra; se Vigontina, selezione giocatore
- Palo/Traversa: scelta tra Palo/Traversa, scelta squadra; se Vigontina, selezione giocatore

## Note UI

- L'icona di Palo/Traversa è stata resa neutra e uniforme: **🧱** è usata sia nel pulsante principale sia all'interno del modal per le opzioni "Palo" e "Traversa". La distinzione viene comunque mostrata negli eventi come "🧱 Palo" oppure "⎯ Traversa".
- In Prova Tecnica non sono consentiti eventi gol/azioni: modificare solo il punteggio manualmente.

## Esportazione

- Export Excel/PDF per partita e storico
- Report FIGC per partita corrente e storico

---

Per dettagli tecnici consultare i file: `LIVE_MATCH_FLOW.md`, `SETUP_FIREBASE.md` e il codice dei componenti in `src/components`.
