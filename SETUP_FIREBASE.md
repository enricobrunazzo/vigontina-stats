# 🔥 Guida Setup Firebase Realtime Database

## ✅ Stato Attuale

**Database URL configurato:** `https://vigontina-stats-default-rtdb.europe-west1.firebasedatabase.app/`

## 📋 Checklist Setup (Da completare nella Console Firebase)

### 1. Verifica Realtime Database Attivo
- [ ] Vai su [Firebase Console](https://console.firebase.google.com/)
- [ ] Seleziona progetto `vigontina-stats`
- [ ] Vai su **"Realtime Database"** nel menu laterale
- [ ] Verifica che il database sia attivo e l'URL corrisponda

### 2. Configura Regole di Sicurezza
Nella tab **"Regole"** del Realtime Database, inserisci:

```json
{
  "rules": {
    "active-matches": {
      "$matchId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**⚠️ IMPORTANTE:** Clicca **"Pubblica"** per salvare le regole!

## 🧪 Test di Funzionamento

### Test 1: Verifica Connessione
1. Avvia l'app locale: `npm run dev`
2. Apri la console del browser (F12)
3. Dovresti vedere: `Firebase Realtime Database configurato: https://vigontina-stats-default-rtdb.europe-west1.firebasedatabase.app/`

### Test 2: Creazione Partita Condivisa
1. Nell'app, clicca **"Nuova Partita"**
2. Seleziona **"Partita Condivisa"** (pulsante blu a destra)
3. Compila i dati della partita
4. Clicca **"Crea Partita"**
5. Dovresti ottenere un codice a 6 cifre (es. `123456`)

### Test 3: Verifica Dati su Firebase
1. Torna alla Console Firebase
2. Vai su **"Realtime Database" → "Dati"**
3. Dovresti vedere una struttura come:
```
vigontina-stats-default-rtdb
└── active-matches
    └── 123456 (il tuo codice)
        ├── createdAt: timestamp
        ├── isActive: true
        ├── matchData: {...}
        └── participants: {...}
```

### Test 4: Accesso da Secondo Dispositivo
1. Su un altro browser/dispositivo, vai alla tua app
2. Clicca **"Partita Condivisa"**
3. Inserisci il codice ottenuto nel Test 2
4. Clicca **"Unisciti"**
5. Dovresti vedere la partita in tempo reale!

## 🚨 Risoluzione Problemi

### Errore: "Database not found"
- Verifica che l'URL del database sia corretto
- Controlla che il Realtime Database sia attivo nella console

### Errore: "Permission denied"
- Verifica che le regole siano state pubblicate correttamente
- Ricontrolla la sintassi JSON delle regole

### Partita non si sincronizza
- Verifica la connessione internet
- Controlla la console del browser per errori
- Verifica che entrambi i dispositivi usino lo stesso codice partita

### Debug Avanzato
Per vedere tutti gli eventi Firebase, aggiungi nella console:
```javascript
// Abilita debug Firebase
firebase.database().enableLogging(true);
```

## 🎯 Struttura Dati Firebase

Le partite vengono salvate in questa struttura:

```
active-matches/
  {CODICE_PARTITA}/
    ├── id: "123456"
    ├── createdAt: timestamp
    ├── createdBy: "organizer"
    ├── isActive: true
    ├── currentPeriod: null|number
    ├── opponent: "Nome Avversario"
    ├── competition: "Campionato"
    ├── periods: [...]
    ├── participants: {
    │     organizer: { role: "organizer", joinedAt: timestamp }
    │     1634567890: { role: "viewer", joinedAt: timestamp }
    │   }
    └── settings: {
          allowViewers: true,
          allowCollaborators: false
        }
```

## 📞 Supporto

Se hai problemi:
1. Controlla la console del browser per errori
2. Verifica la configurazione Firebase nella console
3. Assicurati che le regole siano pubblicate
4. Testa prima in locale, poi su Vercel

---

**Status:** ✅ Configurazione completata
**Prossimo passo:** Testa la creazione di una partita condivisa!