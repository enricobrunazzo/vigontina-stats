# ⚽ Vigontina Stats - Applicazione Gestione Statistiche

**Versione:** 2.0.0  
**Demo Live:** https://vigontina-stats.vercel.app  
**Sviluppatore:** Enrico Brunazzo

## 📝 Descrizione

Applicazione web per la gestione delle statistiche della squadra **Vigontina San Paolo**. L'app consente di tracciare partite in tempo reale, gestire formazioni, registrare eventi di gioco e generare report dettagliati.

## ✨ Caratteristiche Principali

- 📊 **Gestione Partite in Tempo Reale**: Timer automatico con persistenza su Firebase
- 👥 **Gestione Formazioni**: Selezione giocatori e posizioni
- ⚽ **Eventi di Gioco**: Gol, rigori, sostituzioni
- 📈 **Statistiche Dettagliate**: Analisi prestazioni per giocatore e squadra
- 📄 **Export Multipli**: Excel e PDF per report completi
- 🔄 **Sincronizzazione Cloud**: Dati salvati su Firebase Realtime Database
- 📱 **Design Responsivo**: Ottimizzato per desktop e mobile
- 🎨 **UI Moderna**: Interfaccia pulita con Tailwind CSS

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** - Framework JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Libreria di icone

### Backend & Database
- **Firebase Realtime Database** - Database NoSQL in tempo reale
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
│   ├── App.jsx                    # Componente principale
│   ├── main.jsx                   # Entry point React
│   ├── index.css                  # Stili globali
│   ├── 📁 components/             # Componenti React
│   │   ├── MatchHistory.jsx       # Cronologia partite
│   │   ├── MatchOverview.jsx      # Panoramica partita
│   │   ├── MatchSummary.jsx       # Riassunto partita
│   │   ├── NewMatchForm.jsx       # Form nuova partita
│   │   ├── PeriodPlay.jsx         # Gestione periodo di gioco
│   │   └── 📁 modals/             # Componenti modal
│   │       ├── GoalModal.jsx      # Modal registrazione gol
│   │       ├── LineupModal.jsx    # Modal gestione formazione
│   │       └── PenaltyModal.jsx   # Modal gestione rigori
│   ├── 📁 config/
│   │   └── firebase.js            # Configurazione Firebase
│   ├── 📁 constants/
│   │   └── players.js             # Database giocatori
│   ├── 📁 hooks/                  # Custom React Hooks
│   │   ├── useMatch.js            # Gestione stato partita
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
2. Abilita **Realtime Database**
3. Copia le credenziali nel file `src/config/firebase.js`
4. Configura le regole del database per permettere lettura/scrittura

## 📋 Funzionalità Dettagliate

### 🎮 Gestione Partita
- **Timer Automatico**: Cronometro con pausa/riavvio
- **Periodi di Gioco**: Supporto per 2 tempi + eventuali supplementari
- **Wake Lock**: Mantiene schermo attivo durante la partita
- **Salvataggio Automatico**: Stato partita salvato in tempo reale

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

### 📤 Export e Condivisione
- **Excel**: Report dettagliato con tutti i dati partita
- **PDF**: Documento stampabile con riassunto
- **Cronologia**: Archivio partite precedenti
- **Backup**: Esportazione dati completa

## 🎨 Design e UX

- **Responsive Design**: Ottimizzato per tutti i dispositivi
- **Dark/Light Mode**: Supporto temi (futuro sviluppo)
- **Iconografia Consistente**: Lucide React icons
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

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/nuova-feature`)
3. Commit delle modifiche (`git commit -m 'Aggiunge nuova feature'`)
4. Push del branch (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

## 📝 Roadmap

- [ ] Sistema cartellini gialli/rossi
- [ ] Statistiche avanzate (possesso palla, tiri, etc.)
- [ ] Modalità torneo/campionato
- [ ] Notifiche push per eventi importanti
- [ ] Integrazione video highlights
- [ ] API REST per integrazioni esterne
- [ ] App mobile native (React Native)

## 📄 Licenza

Progetto sviluppato per uso privato della **Vigontina San Paolo**.

## 👨‍💻 Autore

**Enrico Brunazzo**  
- GitHub: [@enricobrunazzo](https://github.com/enricobrunazzo)
- Email: enrico.br@gmail.com

---

⭐ Se il progetto ti è utile, lascia una stella su GitHub!

🔄 **Ultimo aggiornamento:** Ottobre 2025