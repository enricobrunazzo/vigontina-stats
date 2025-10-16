# ⚽ Vigontina Stats - Applicazione Gestione Statistiche

**Versione:** 3.0.0  
**Demo Live:** https://vigontina-stats.vercel.app  
**Sviluppatore:** Enrico Brunazzo

## 📝 Descrizione

Applicazione web per la gestione delle statistiche della squadra **Vigontina San Paolo**. L'app consente di tracciare partite in tempo reale, gestire formazioni, registrare eventi di gioco e generare report dettagliati. **Novità v3.0**: Supporto per **partite condivise multi-utente** in tempo reale!

## ✨ Caratteristiche Principali

- 📊 **Gestione Partite in Tempo Reale**: Timer automatico con persistenza su Firebase
- 👥 **Gestione Formazioni**: Selezione giocatori e posizioni
- ⚽ **Eventi di Gioco**: Gol, rigori, sostituzioni
- 📈 **Statistiche Dettagliate**: Analisi prestazioni per giocatore e squadra
- 📄 **Export Multipli**: Excel e PDF per report completi
- 🔄 **Sincronizzazione Cloud**: Dati salvati su Firebase Realtime Database
- 📱 **Design Responsivo**: Ottimizzato per desktop e mobile
- 🎨 **UI Moderna**: Interfaccia pulita con Tailwind CSS
- 🌐 **Partite Condivise**: **NOVITÀ** - Più persone possono seguire la stessa partita in tempo reale
- 🔗 **Condivisione Facile**: Codici univoci per accesso rapido alle partite attive

## 🌟 Nuove Funzionalità v3.0 - Multi-Utente

### 🔗 Partite Condivise
- **Organizzatore**: Crea una partita e ottiene un codice di 6 cifre
- **Spettatori**: Si uniscono con il codice per seguire in tempo reale
- **Sincronizzazione Real-Time**: Tutti vedono punteggio, eventi e timer aggiornati istantaneamente
- **Persistenza Garantita**: Le partite rimangono attive fino alla chiusura manuale

### 👥 Ruoli Utente
- **Organizzatore** 🎯: Crea la partita, registra eventi, controlla il timer
- **Spettatori** 👀: Visualizzano la partita in tempo reale (sola lettura)
- **Collaboratori** 🤝: Possono registrare eventi (funzionalità futura)

### 📱 Modalità di Accesso
1. **Codice Partita**: Inserimento manuale del codice a 6 cifre
2. **Link Diretto**: Condivisione tramite URL con parametro `?match=XXXXXX`
3. **Auto-Join**: Rilevamento automatico del codice dall'URL

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** - Framework JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Libreria di icone

### Backend & Database
- **Firebase Realtime Database** - Database NoSQL in tempo reale per partite attive
- **Firebase Firestore** - Database per cronologia e dati storici
- **Firebase Hosting** - Hosting statico

### Librerie Aggiuntive
- **ExcelJS** - Generazione file Excel
- **jsPDF + jsPDF-AutoTable** - Generazione PDF
- **XLSX** - Manipolazione file Excel

## 📁 Struttura del Progetto

```
vigontina-stats/
├── 📁 public/
│   ├── favicon.png
│   └── logo-vigontina.png
├── 📁 src/
│   ├── App.jsx                    # Componente principale (aggiornato v3.0)
│   ├── main.jsx                   # Entry point React
│   ├── index.css                  # Stili globali
│   ├── 📁 components/             # Componenti React
│   │   ├── MatchHistory.jsx       # Cronologia partite
│   │   ├── MatchOverview.jsx      # Panoramica partita
│   │   ├── MatchSummary.jsx       # Riassunto partita
│   │   ├── NewMatchForm.jsx       # Form nuova partita
│   │   ├── PeriodPlay.jsx         # Gestione periodo di gioco
│   │   ├── SharedMatchManager.jsx # 🆕 Gestione partite condivise
│   │   └── 📁 modals/             # Componenti modal
│   │       ├── GoalModal.jsx      # Modal registrazione gol
│   │       ├── LineupModal.jsx    # Modal gestione formazione
│   │       └── PenaltyModal.jsx   # Modal gestione rigori
│   ├── 📁 config/
│   │   └── firebase.js            # Configurazione Firebase (aggiornata v3.0)
│   ├── 📁 constants/
│   │   └── players.js             # Database giocatori
│   ├── 📁 hooks/                  # Custom React Hooks
│   │   ├── useMatch.js            # Gestione stato partita locale
│   │   ├── useSharedMatch.js      # 🆕 Gestione partite condivise
│   │   ├── useMatchHistory.js     # Cronologia partite
│   │   └── useTimer.js            # Timer e wake lock
│   └── 📁 utils/                  # Funzioni utility
│       ├── dateUtils.js           # Utility per date
│       ├── exportUtils.js         # Export Excel/PDF
│       └── matchUtils.js          # Calcoli e statistiche
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🚀 Installazione e Avvio

### Prerequisiti
- Node.js >= 18
- npm o yarn
- Account Firebase (per database)

### Setup Locale

```bash
# Clone del repository
git clone https://github.com/enricobrunazzo/vigontina-stats.git
cd vigontina-stats

# Installazione dipendenze
npm install

# Avvio server di sviluppo
npm run dev
```

### Configurazione Firebase

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com/)
2. Abilita **Realtime Database** (per partite condivise)
3. Abilita **Firestore** (per cronologia)
4. Copia le credenziali nel file `src/config/firebase.js`
5. Configura le regole del database:

**Realtime Database Rules:**
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

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 📋 Funzionalità Dettagliate

### 🎮 Gestione Partita
- **Timer Automatico**: Cronometro con pausa/riavvio
- **Periodi di Gioco**: Supporto per 2 tempi + eventuali supplementari
- **Wake Lock**: Mantiene schermo attivo durante la partita
- **Salvataggio Automatico**: Stato partita salvato in tempo reale
- **Modalità Locale/Condivisa**: Scelta del tipo di partita al momento della creazione

### 🌐 Partite Condivise (Novità v3.0)
- **Creazione Facile**: L'organizzatore crea una partita e riceve un codice
- **Accesso Immediato**: Gli spettatori inseriscono il codice per unirsi
- **Real-Time Sync**: Tutti i dati sincronizzati istantaneamente
- **Controllo Accessi**: Solo l'organizzatore può registrare eventi
- **URL Sharing**: Condivisione tramite link diretto
- **Gestione Partecipanti**: Visualizzazione di chi è connesso

### 👥 Gestione Giocatori
- **Database Completo**: Lista giocatori con posizioni
- **Formazioni**: Selezione 11 titolari + panchina
- **Sostituzioni**: Sistema di cambi con tracciamento minuti
- **Statistiche Individuali**: Gol, rigori, presenze per giocatore

### 📊 Eventi e Statistiche
- **Gol**: Registrazione con marcatore, assist, minuto
- **Rigori**: Tracciamento rigori segnati/sbagliati
- **Cartellini**: Sistema ammonizioni (futuro sviluppo)
- **Report Automatici**: Generazione statistiche partita
- **Sincronizzazione Real-Time**: Eventi visibili istantaneamente a tutti

### 📤 Export e Condivisione
- **Excel**: Report dettagliato con tutti i dati partita
- **PDF**: Documento stampabile con riassunto
- **Cronologia**: Archivio partite precedenti
- **Backup**: Esportazione dati completa
- **Link Condivisione**: URL diretti per partite attive

## 🎨 Design e UX

- **Responsive Design**: Ottimizzato per tutti i dispositivi
- **Interfaccia Intuitiva**: Chiara distinzione tra modalità locale e condivisa
- **Indicatori Real-Time**: Status di connessione e ruolo utente
- **Iconografia Consistente**: Lucide React icons con indicatori di stato
- **Animazioni Fluide**: Transizioni CSS smooth
- **Accessibilità**: Supporto screen reader e navigazione keyboard

## 🔧 Scripts Disponibili

```bash
npm run dev      # Avvia server sviluppo (Vite)
npm run build    # Build per produzione
npm run preview  # Anteprima build locale
npm start        # Alias per npm run dev
```

## 🚀 Deploy

L'applicazione è configurata per il deploy automatico su **Vercel**:

1. Connetti il repository GitHub a Vercel
2. Configura le variabili ambiente Firebase
3. Il deploy avviene automaticamente ad ogni push su `main`

**Variabili Ambiente Richieste:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL` (per Realtime Database)
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 🎯 Esempi d'Uso - Partite Condivise

### Scenario 1: Allenatore + Genitori
1. **Allenatore** crea una partita condivisa → riceve codice `ABC123`
2. Condivide il codice o link con i genitori
3. **Genitori** inseriscono `ABC123` → seguono la partita in tempo reale
4. Vedono gol, sostituzioni, punteggio aggiornati istantaneamente

### Scenario 2: Match Analysis
1. **Osservatore** crea partita per analisi tattica
2. Condivide con **Staff Tecnico** via link
3. Tutti annotano eventi simultaneamente
4. Dati sincronizzati per analisi post-partita

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/nuova-feature`)
3. Commit delle modifiche (`git commit -m 'Aggiunge nuova feature'`)
4. Push del branch (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

## 📝 Roadmap

### v3.1 (Prossima Release)
- [ ] Collaboratori con permessi di modifica
- [ ] Chat integrata per partite condivise
- [ ] Notifiche push per eventi importanti
- [ ] QR Code per accesso rapido

### v4.0 (Futuro)
- [ ] Sistema cartellini gialli/rossi
- [ ] Statistiche avanzate (possesso palla, tiri, etc.)
- [ ] Modalità torneo/campionato
- [ ] Integrazione video highlights
- [ ] API REST per integrazioni esterne
- [ ] App mobile native (React Native)
- [ ] Sistema di autenticazione utenti
- [ ] Permessi granulari per ruoli

## 🔄 Changelog v3.0

### ✨ Nuove Funzionalità
- **Partite Condivise Multi-Utente**: Sistema completo per partite in tempo reale
- **Firebase Realtime Database**: Integrazione per sincronizzazione istantanea
- **Gestione Ruoli**: Organizzatori e spettatori con permessi differenziati
- **Codici Partita**: Sistema di accesso tramite codici a 6 cifre
- **URL Sharing**: Condivisione diretta tramite link parametrizzati
- **SharedMatchManager**: Nuovo componente per gestione accessi
- **useSharedMatch**: Hook dedicato per partite condivise

### 🔧 Miglioramenti
- **App.jsx**: Completamente riorganizzato per supportare entrambe le modalità
- **Firebase Config**: Aggiunta configurazione Realtime Database
- **UI/UX**: Nuove interfacce per selezione modalità e gestione partecipanti
- **Documentazione**: README aggiornato con esempi e guide

## 📄 Licenza

Progetto sviluppato per uso privato della **Vigontina San Paolo**.

## 👨‍💻 Autore

**Enrico Brunazzo**  
- GitHub: [@enricobrunazzo](https://github.com/enricobrunazzo)
- Email: enrico.br@gmail.com

---

⭐ Se il progetto ti è utile, lascia una stella su GitHub!

🔄 **Ultimo aggiornamento:** Ottobre 2025 - v3.0 Multi-User Release