# Struttura Modulare - Vigontina Stats App

## 📁 Struttura delle Cartelle

```
vigontina-stats3_modular/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   ├── favicon.png
│   └── logo-vigontina.png
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components/
    │   ├── MatchHistory.jsx
    │   ├── MatchOverview.jsx
    │   ├── MatchSummary.jsx
    │   ├── NewMatchForm.jsx
    │   ├── PeriodPlay.jsx
    │   └── modals/
    │       ├── GoalModal.jsx
    │       ├── LineupModal.jsx
    │       └── PenaltyModal.jsx
    ├── config/firebase.js
    ├── constants/players.js
    ├── hooks/
    │   ├── useMatch.js
    │   ├── useMatchHistory.js
    │   └── useTimer.js
    └── utils/
        ├── dateUtils.js
        ├── exportUtils.js
        └── matchUtils.js


```

## 🔧 File da Creare

### 1. config/firebase.js
Contiene la configurazione e l'inizializzazione di Firebase.

### 2. constants/players.js
Esporta l'array PLAYERS con tutti i giocatori.

### 3. hooks/useTimer.js
Gestisce lo stato del timer, wake lock, e persistenza su Firebase.

### 4. hooks/useMatchHistory.js
Gestisce il caricamento, salvataggio ed eliminazione delle partite.

### 5. hooks/useMatch.js
Gestisce lo stato della partita corrente e le operazioni su periodi e eventi.

### 6. utils/exportUtils.js
Contiene le funzioni `exportMatchToExcel` e `exportMatchToPDF`.

### 7. utils/matchUtils.js
Funzioni di utility per calcoli (punti, gol totali, statistiche).

### 8. components/modals/
Componenti per i vari modal riutilizzabili.

### 9. components/
Tutti i componenti principali separati in file distinti.

## 🚀 Vantaggi della Modularizzazione

- **Manutenibilità**: Ogni file ha una responsabilità specifica
- **Riusabilità**: I componenti e le funzioni possono essere riutilizzati
- **Testing**: Più facile testare singoli moduli
- **Performance**: Possibilità di code splitting e lazy loading
- **Collaborazione**: Team possono lavorare su file diversi
- **Debugging**: Più facile individuare e risolvere problemi

## 📝 Note di Implementazione

1. Inizia creando le cartelle nella struttura del progetto
2. Sposta i file uno alla volta, testando dopo ogni spostamento
3. Aggiorna gli import in tutti i file che utilizzano i moduli spostati
4. Verifica che l'applicazione funzioni correttamente dopo ogni modifica