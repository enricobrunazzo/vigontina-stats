# Guida all'Autenticazione - Vigontina Stats

## Sistema Password Organizzatore

Per risolvere i problemi con gli eventi delle partite e la modifica dei punteggi, è stato implementato un sistema di autenticazione con password per distinguere tra organizzatori e spettatori.

## Password Organizzatore

**Password corrente:** `vigontina2025`

### Dove inserire la password

1. **Creazione nuova partita:** Nel form "Nuova Partita" apparirà un campo "Password Organizzatore"
2. **Riprendere partita esistente:** Se richiesta, apparirà una modale di autenticazione

## Ruoli Utente

### 🔧 Organizzatore (con password corretta)
- Può creare nuove partite condivise
- Può modificare eventi durante la partita (gol, autogol, rigori)
- Può modificare i punteggi nella Prova Tecnica
- Può avviare/terminare periodi
- Può salvare e gestire la partita

### 👁️ Spettatore (senza password o password errata)
- Può solo visualizzare la partita in tempo reale
- Non può modificare eventi o punteggi
- Riceve aggiornamenti live ma non può interagire

## Problemi Risolti

### ✅ Eventi Partite Durante il Match
- **Problema:** Gli eventi (gol, autogol, rigori) non venivano registrati
- **Soluzione:** Aggiunto controllo password per modifiche agli eventi
- **Nota:** Solo gli organizzatori autenticati possono aggiungere eventi

### ✅ Modifica Punti Prova Tecnica
- **Problema:** I pulsanti +/- per i punti non funzionavano nella Prova Tecnica
- **Soluzione:** Aggiunta funzione `updateScore` per partite condivise
- **Nota:** La modifica manuale ora funziona sia in locale che in cloud

### ✅ Protezioni Aggiuntive
- Nella Prova Tecnica non si possono più aggiungere gol/autogol/rigori per errore
- Gli eventi vengono bloccati automaticamente durante la Prova Tecnica
- Messaggi di errore più chiari per utenti non autorizzati

## Come Modificare la Password

Per cambiare la password, modifica la costante `ORGANIZER_PASSWORD` nel file:
```javascript
// src/hooks/useSharedMatch.js
const ORGANIZER_PASSWORD = "nuova_password_qui";
```

## Risoluzione Problemi

### "Non riesco ad aggiungere eventi durante la partita"
1. Verifica di aver inserito la password corretta: `vigontina2025`
2. Controlla che non sia la Prova Tecnica (usa i pulsanti +/- per i punti)
3. Assicurati di essere l'organizzatore della partita

### "I pulsanti +/- non funzionano nella Prova Tecnica"
1. Verifica di essere autenticato come organizzatore
2. La funzione ora dovrebbe funzionare sia per partite locali che condivise
3. Se il problema persiste, ricarica la pagina e riprendi la partita

### "La partita è in sola lettura"
1. Significa che stai visualizzando come spettatore
2. Inserisci la password organizzatore per ottenere i permessi di modifica
3. Se già inserita, verifica che sia corretta: `vigontina2025`

## Note Tecniche

- L'autenticazione è gestita lato client (semplice ma efficace per l'uso previsto)
- La password viene verificata ad ogni operazione critica
- Le partite locali (non condivise) mantengono tutti i permessi
- Le modifiche sono retrocompatibili con partite esistenti

---

**Ultimo aggiornamento:** Ottobre 2025  
**Versione:** 3.1.0