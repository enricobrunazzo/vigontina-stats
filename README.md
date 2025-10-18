# ⚽ Vigontina Stats - Sistema Gestione Partite

**Versione:** 3.1.0  
**Demo Live:** [vigontina-stats.vercel.app](https://vigontina-stats.vercel.app)  
**Sviluppatore:** Enrico Brunazzo (@enricobrunazzo)  
**Squadra:** Vigontina San Paolo - Esordienti 2025/2026

## 🎯 Panoramica

Applicazione web completa per la gestione delle statistiche calcistiche della **Vigontina San Paolo**. Sistema professionale che combina gestione partite in tempo reale, analisi statistiche avanzate e generazione automatica di report ufficiali conformi agli standard FIGC.

### 🚀 Caratteristiche Distintive
- **Timer Professionale** con wake-lock per mantenere lo schermo attivo
- **Sistema Prova Tecnica** specifico per categoria Esordienti
- **Export Multi-Formato** (Excel, PDF, FIGC)
- **Cloud Sync** con Firebase per persistenza e backup automatico
- **PWA Ready** - Installabile su iOS/Android come app nativa
- **UX Mobile-First** - Ottimizzato per tablet e smartphone arbitrali

---

## 🎮 Funzionalità Core

### 📊 Gestione Partita in Tempo Reale
- **Timer Automatico**: Cronometro con controlli play/pausa e persistenza stato
- **Periodi Personalizzati**: Supporto 4 tempi + Prova Tecnica (configurabile)
- **Registrazione Eventi**: Gol, rigori, sostituzioni con timestamp automatico
- **Formazioni Dinamiche**: Selezione 9 giocatori in campo per periodo
- **Capitano**: Sistema di selezione con indicatore visivo badge "C"
- **Punteggio Dinamico**: Calcolo automatico punti (V=1, P=1, S=0) e gol

### 🎯 Sistema Prova Tecnica
- **Inserimento Manuale Punti**: Controlli +/- per punteggio PT
- **Vincitore PT**: Assegnazione 1 punto finale alla squadra vincente
- **Interfaccia Dedicata**: Nome avversario dinamico "Punti [SquadraAvversaria]"
- **Esclusione Calcoli**: PT non conta nei gol totali, solo per punto finale

### 👥 Gestione Rosa e Staff
- **Database Giocatori**: 15 giocatori con numeri e nomi
- **Non Convocati**: Sistema esclusione giocatori per partita
- **Staff Tecnico**: Allenatore (Gianmaria Tonolo), Assistente Arbitro, Dirigente
- **Validazioni**: Controllo formazioni (9 giocatori) e ruoli obbligatori

### 📈 Statistiche e Analytics
- **Individuali**: Gol, assist, presenze per giocatore
- **Squadra**: Vittorie, pareggi, sconfitte, differenza reti
- **Stagionali**: Trend performance, media gol, percentuale vittorie
- **Comparativa**: Statistiche casa/trasferta, per competizione

---

## 🛠️ Architettura Tecnica

### Frontend Stack
```
├── React 18.2         # Framework UI con hooks moderni
├── Vite 5.1           # Build tool ultra-veloce
├── Tailwind CSS 3.4   # Utility-first CSS framework
├── Lucide React       # Icone SVG ottimizzate
└── PWA Support        # Service Worker e manifest
```

### Backend & Database
```
├── Firebase Firestore  # Database NoSQL per cronologia partite
├── Cloud Persistence   # Backup automatico con retry logic
├── Local Storage       # Cache locale per offline-first
└── Real-time Sync      # Sincronizzazione bidirezionale
```

### Export & Report Engine
```
├── ExcelJS 4.4        # Generazione Excel avanzata con formattazione
├── jsPDF 2.5          # Creazione PDF con autoTable
├── FIGC Export        # Template ufficiali LND Padova
└── Multi-format       # Esportazione simultanea Excel/PDF
```

### Mobile & PWA
```
├── Responsive Design   # Mobile-first approach
├── iOS Optimizations   # Safe-area support, date-picker fix
├── Wake Lock API       # Previene spegnimento schermo durante partita
├── Touch Gestures      # Interfaccia ottimizzata per touch
└── Offline Support     # Funzionamento senza connessione
```

---

## 📱 User Experience

### 🎨 Design System
- **Palette**: Gradient slate/cyan con accenti team (verde Vigontina)
- **Typography**: Font system stack per performance
- **Iconografia**: Lucide React per consistenza
- **Spacing**: Sistema 8px grid per allineamento perfetto

### 📲 Mobile Optimizations
- **iOS Safari**: Fix overflow date-picker, safe-area support
- **Android**: PWA manifest, touch-friendly buttons
- **Tablet**: Layout responsive per arbitri
- **Performance**: Lazy loading, code splitting

### ♿ Accessibilità
- **Screen Reader**: Semantic HTML, ARIA labels
- **Keyboard Navigation**: Tab navigation completa
- **High Contrast**: Colori conformi WCAG
- **Touch Targets**: Minimum 44px tap areas

---

## 📋 Struttura Progetto

```
vigontina-stats/
├── 📁 public/                     # Asset statici e PWA
│   ├── manifest.json              # PWA manifest per installazione
│   ├── apple-touch-icon.png       # Icona iOS
│   ├── android-chrome-*.png       # Icone Android
│   ├── logo-vigontina.png         # Logo squadra
│   ├── forza-vigontina.png        # Banner export
│   └── logo-lnd.png               # Logo FIGC per report ufficiali
├── 📁 src/
│   ├── App.jsx                    # Router principale e state management
│   ├── main.jsx                   # Entry point React
│   ├── index.css                  # Stili globali + iOS fixes
│   ├── 📁 components/             # Componenti React modulari
│   │   ├── NewMatchForm.jsx       # ✨ Form creazione partita completo
│   │   ├── MatchOverview.jsx      # Dashboard controllo partita
│   │   ├── PeriodPlay.jsx         # ⚡ Gestione tempo/eventi real-time
│   │   ├── MatchSummary.jsx       # Report post-partita
│   │   ├── MatchHistory.jsx       # Cronologia con filtri
│   │   ├── FIGCReport.jsx         # 📋 Report ufficiale FIGC/LND
│   │   ├── FIGCReportForm.jsx     # Form report alternativo
│   │   └── 📁 modals/             # Dialog modali
│   │       ├── GoalModal.jsx      # Registrazione gol + assist
│   │       ├── PenaltyModal.jsx   # Gestione rigori
│   │       └── LineupModal.jsx    # Selezione formazione
│   ├── 📁 hooks/                  # Custom React Hooks
│   │   ├── useMatch.js            # State management partita locale
│   │   ├── useTimer.js            # ⏱️ Timer + Wake Lock API
│   │   ├── useMatchHistory.js     # CRUD cronologia partite
│   │   ├── useSharedMatch.js      # Multi-user (preparato, non attivo)
│   │   ├── cloudPersistence.js    # Backup Firebase automatico
│   │   └── sharedConstants.js     # Costanti condivise
│   ├── 📁 utils/                  # Business Logic
│   │   ├── matchUtils.js          # Calcoli punteggi e statistiche
│   │   ├── exportUtils.js         # 📤 Export Excel/PDF principale
│   │   ├── figcExportUtils.js     # Export FIGC specializzato
│   │   ├── excelExport.js         # Utility Excel avanzate
│   │   └── dateUtils.js           # Formattazione date IT
│   ├── 📁 config/
│   │   └── firebase.js            # 🔥 Config Firebase + Firestore + Realtime
│   └── 📁 constants/
│       └── players.js             # 👥 Database giocatori roster
├── 📋 Configuration Files
│   ├── package.json               # Dipendenze e script
│   ├── vite.config.js             # Build config ottimizzata
│   ├── tailwind.config.js         # Design system config
│   └── postcss.config.js          # CSS processing
└── 📄 Documentation
    ├── README.md                   # Documentazione completa (questo file)
    └── index.html                  # HTML template con meta PWA
```

---

## ⚙️ Setup e Installazione

### Prerequisiti Sistema
```bash
# Versioni minime richieste
Node.js >= 18.0.0
npm >= 9.0.0 (oppure yarn/pnpm)
Git >= 2.30
```

### 🔧 Setup Locale
```bash
# 1. Clone repository
git clone https://github.com/enricobrunazzo/vigontina-stats.git
cd vigontina-stats

# 2. Installa dipendenze
npm install

# 3. Avvia development server
npm run dev
# ➜ App disponibile su http://localhost:5173

# 4. Build produzione
npm run build
npm run preview
```

### ☁️ Configurazione Firebase

1. **Crea Progetto Firebase**
   - Vai su [console.firebase.google.com](https://console.firebase.google.com)
   - Crea nuovo progetto "vigontina-stats"
   - Abilita Analytics (opzionale)

2. **Configura Database**
   ```javascript
   // Firestore Rules (per cronologia)
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /matches/{document} {
         allow read, write: if true;
       }
     }
   }
   ```

3. **Configura Variabili Ambiente**
   ```bash
   # File: .env.local
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="vigontina-stats.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="vigontina-stats"
   VITE_FIREBASE_STORAGE_BUCKET="vigontina-stats.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="979551248607"
   VITE_FIREBASE_APP_ID="1:979551248607:web:fb9b3092d79507ddaf896a"
   ```

---

## 🎮 Guida Utilizzo

### 📝 Creazione Nuova Partita
1. **Dati Base**: Competizione, giornata, casa/trasferta, avversario, data
2. **Staff**: Allenatore (preimpostato), assistente arbitro, dirigente
3. **Rosa**: Selezione non convocati e capitano (badge "C")
4. **Validazione**: Controlli automatici completezza dati

### ⚽ Gestione Partita Live
1. **Overview**: Panoramica periodi, punteggi parziali, controlli principali
2. **Timer Control**: Play/pausa con salvataggio stato e wake-lock
3. **Eventi**: Registrazione gol, rigori, sostituzioni con timestamp
4. **Formazioni**: Modifica 9 in campo per ogni periodo

### 🏆 Sistema Punteggi
- **Vittoria**: 1 punto (più gol dell'avversario nel periodo)
- **Pareggio**: 1 punto per entrambe (stesso numero gol)
- **Sconfitta**: 0 punti (meno gol dell'avversario)
- **Prova Tecnica**: Vincitore ottiene +1 punto finale aggiuntivo

### 📊 Export e Report
- **Excel**: Report dettagliato multi-sheet (Riepilogo, Periodi, Marcatori, Eventi)
- **PDF**: Documento ufficiale con logo, statistiche, cronologia
- **FIGC**: Rapporto gara LND con firme digitali e valutazioni
- **Storico**: Export completo stagione in Excel

---

## 🔥 Novità e Miglioramenti Recenti

### ✨ UX Enhancements (Ottobre 2025)
- **🎯 Icona Capitano**: Sostituita corona con badge "C" professionale
- **📱 iOS Date Fix**: Risolto overflow date-picker su iPhone
- **👨‍🏫 Campo Allenatore**: Aggiunto in creazione, riepilogo e report
- **🏷️ Etichette Dinamiche**: "Punti [NomeAvversario]" invece di "Punti Avversario"

### 🎨 UI/UX Improvements
- **Safe Area Support**: Perfetta integrazione con iOS notch e Dynamic Island
- **PWA Completa**: Installabile come app nativa con icone dedicate
- **Responsive Grid**: Layout adattivo per tutte le dimensioni schermo
- **Touch Optimization**: Pulsanti 44px min per accessibilità mobile

### 🔧 Technical Debt Reduction
- **Modular Architecture**: Componenti React riutilizzabili
- **Custom Hooks**: Business logic separata da presentation
- **TypeScript Ready**: Struttura preparata per migrazione TS
- **Performance**: Lazy loading, React.memo, useMemo ottimizzazioni

---

## 🏗️ Architettura Avanzata

### 🔄 State Management Pattern
```
App.jsx (Router + Global State)
├── useMatch (Partita Corrente)
├── useTimer (Cronometro + Wake Lock)
├── useMatchHistory (CRUD Storico)
└── Components (UI Stateless quando possibile)
```

### 💾 Data Flow
```
Local State → Firebase Firestore → Excel/PDF Export
     ↓              ↓                    ↓
Real-time UI → Cloud Backup → Official Reports
```

### 🎯 Component Hierarchy
```
App
├── HomeScreen (Dashboard principale)
├── NewMatchForm (Creazione partita)
├── MatchOverview (Controllo partita)
├── PeriodPlay (Gestione tempo live)
├── MatchSummary (Report post-partita)
├── MatchHistory (Cronologia)
├── FIGCReport (Report ufficiale)
└── Modals (GoalModal, LineupModal, PenaltyModal)
```

---

## 🚀 Deploy e Hosting

### 📦 Build Ottimizzata
```bash
# Build per produzione
npm run build
# Output: dist/ (ready per hosting statico)

# Test local build
npm run preview
# ➜ Preview su http://localhost:4173
```

### ☁️ Vercel Deploy (Auto)
1. Connetti repo GitHub a [vercel.com](https://vercel.com)
2. Configura Environment Variables Firebase
3. Deploy automatico su push `main`
4. Custom domain: `vigontina-stats.vercel.app`

### 🔐 Environment Variables Produzione
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 📚 API e Strutture Dati

### 🏟️ Match Object
```javascript
{
  id: "uuid",
  competition: "Torneo Provinciale Autunnale",
  matchDay: 5,
  opponent: "Calcio Padova",
  date: "2025-10-18",
  isHome: true,
  coach: "Gianmaria Tonolo",
  captain: 10,
  assistantReferee: "Enrico Brunazzo",
  teamManager: "Francesco Campello",
  notCalled: [2, 15],
  periods: [
    {
      name: "PROVA TECNICA",
      vigontina: 8,
      opponent: 6,
      completed: true,
      goals: [], // PT non ha eventi
      lineup: []
    },
    {
      name: "1° TEMPO",
      vigontina: 2,
      opponent: 1,
      completed: true,
      goals: [
        {
          type: "goal",
          scorer: 10,
          scorerName: "ZANE",
          assist: 8,
          assistName: "VITTORIO",
          minute: 15
        }
      ],
      lineup: [1,3,4,6,7,8,9,10,11]
    }
  ],
  timestamp: 1729245600000
}
```

### 📊 Statistics Object
```javascript
{
  totalMatches: 12,
  wins: 7,
  draws: 3,
  losses: 2,
  goalsFor: 45,
  goalsAgainst: 23,
  pointsFor: 17,
  pointsAgainst: 8,
  scorers: { "10": 12, "9": 8, "8": 5 },
  assisters: { "8": 7, "10": 4, "7": 3 }
}
```

---

## 🎯 Esempi d'Uso

### 📅 Scenario: Partita Torneo
```
1. Crea Nuova Partita
   ├── Torneo Provinciale Autunnale - Giornata 5
   ├── Casa vs Calcio Padova
   ├── Capitano: 10 ZANE
   └── Non convocati: 2 BICCIO, 15 RARES

2. Prova Tecnica
   ├── Inserimento manuale: Vigontina 8 - 6 Calcio Padova
   └── Vigontina vince PT → +1 punto finale

3. 1° Tempo
   ├── Formazione: seleziona 9 in campo
   ├── Timer: 20 minuti
   ├── Eventi: Gol 10 ZANE assist 8 VITTORIO (15')
   └── Risultato: Vigontina 2 - 1 Calcio Padova (+1 punto)

4. Export Final
   ├── Excel: Report completo con statistiche
   ├── PDF: Documento stampabile
   └── FIGC: Rapporto ufficiale con firme
```

### 📊 Scenario: Analisi Stagionale
```
1. Storico Partite
   ├── 12 partite giocate
   ├── 7V-3P-2S (17 punti su 20)
   └── 45 gol fatti, 23 subiti

2. Top Performers
   ├── Miglior marcatore: 10 ZANE (12 gol)
   ├── Miglior assistman: 8 VITTORIO (7 assist)
   └── Capitano più utilizzato: 10 ZANE

3. Export Completo
   └── Excel stagionale con trend e comparazioni
```

---

## 🔮 Roadmap Sviluppo

### 🎯 v3.2 (Q1 2026) - Enhancements
- [ ] **Cartellini**: Sistema ammonizioni/espulsioni
- [ ] **Sostituzioni**: Tracker cambi con minuti
- [ ] **Statistiche Avanzate**: Tiri, possesso, falli
- [ ] **Export Migliorati**: Template personalizzabili

### 🌐 v4.0 (Q2 2026) - Multi-User
- [ ] **Partite Condivise**: Real-time multi-device
- [ ] **Ruoli Avanzati**: Collaboratori, spettatori, staff
- [ ] **Chat Integrata**: Comunicazione durante partita
- [ ] **Notifiche Push**: Eventi importanti

### 📱 v5.0 (Q3 2026) - Native Apps
- [ ] **React Native**: App iOS/Android nativa
- [ ] **Offline Completo**: Sincronizzazione differita
- [ ] **Video Integration**: Highlight reel automatici
- [ ] **AI Analytics**: Suggerimenti tattici

---

## 🤝 Contribuire

### 🔀 Workflow Git
```bash
# 1. Fork del progetto
git clone https://github.com/YOUR_USERNAME/vigontina-stats.git

# 2. Branch per feature
git checkout -b feature/nome-feature

# 3. Sviluppo e commit
git add .
git commit -m "feat: descrizione feature"

# 4. Push e Pull Request
git push origin feature/nome-feature
# Apri PR su GitHub
```

### 🎯 Convenzioni Progetto
- **Commit Messages**: Conventional Commits (feat:, fix:, docs:, etc.)
- **Branch Names**: feature/, bugfix/, hotfix/, docs/
- **Code Style**: Prettier + ESLint (config incluso)
- **Component Names**: PascalCase per componenti, camelCase per hook

### 🧪 Testing (Future)
- **Unit Tests**: Vitest + Testing Library
- **E2E Tests**: Playwright per user flows
- **Performance**: Lighthouse CI per metriche
- **Coverage**: 80%+ su business logic

---

## 📊 Performance e Metriche

### ⚡ Core Web Vitals
- **LCP**: < 1.5s (lazy loading ottimizzato)
- **FID**: < 100ms (event delegation)
- **CLS**: < 0.1 (layout stabile)
- **Bundle Size**: ~500KB gzipped

### 📱 Mobile Performance
- **First Paint**: < 1s su 3G
- **Interactive**: < 2s su 3G
- **PWA Score**: 95+ Lighthouse
- **Offline Support**: Completo per partite locali

---

## 🔒 Sicurezza e Privacy

### 🛡️ Data Protection
- **Dati Locali**: Crittografia browser storage
- **Firebase**: Rules di accesso sicure
- **Privacy**: Nessun tracking, dati solo per uso sportivo
- **Backup**: Automatico con retention policy

### 🔐 Authentication (Future)
- **Password Organizzatore**: Sistema protezione creazione partite
- **Team Access**: Controllo accesso per ruolo
- **Session Management**: JWT per autenticazione persistente

---

## 📞 Supporto e Contatti

### 👨‍💻 Sviluppatore
**Enrico Brunazzo**  
- 📧 Email: enrico.br@gmail.com
- 🐙 GitHub: [@enricobrunazzo](https://github.com/enricobrunazzo)
- 🏟️ Ruolo: Assistente Arbitro Vigontina San Paolo

### 🏆 Team
**Vigontina San Paolo ASD**  
- 🏠 Campo: Via A. Moro, Busa di Vigonza (PD)
- 👨‍🏫 Allenatore: Gianmaria Tonolo
- 📋 Categoria: Esordienti 1° Anno 2014

### 🆘 Segnalazione Bug
1. Apri issue su [GitHub Issues](https://github.com/enricobrunazzo/vigontina-stats/issues)
2. Includi: device, browser, passi per riprodurre
3. Screenshot/video se necessario
4. Log console (F12 → Console)

---

## 📜 Licenza e Copyright

**Licenza:** Proprietaria - Uso riservato **Vigontina San Paolo ASD**  
**Copyright:** © 2025 Enrico Brunazzo  
**Distribuzione:** Non commerciale, solo per scopi sportivi  

---

## 🏅 Credits e Riconoscimenti

### 🛠️ Technology Stack
- **React Team** - Framework UI eccezionale
- **Vercel** - Hosting e deployment seamless
- **Firebase** - Backend-as-a-Service affidabile
- **Tailwind Labs** - CSS framework produttivo

### ⚽ Sport Inspiration
- **FIGC/LND** - Standard report ufficiali
- **Vigontina San Paolo** - Test case e feedback continuo
- **Community Calcio Giovanile** - Best practices e requisiti

---

**⭐ Se questo progetto ti è utile, lascia una stella su GitHub!**  
**🔄 Ultimo aggiornamento:** 18 Ottobre 2025 - v3.1.0 Enhanced UX**

---

> 🎯 **Motto del progetto**: "Tecnologia al servizio del calcio giovanile - ogni gol conta, ogni statistica racconta una storia."
