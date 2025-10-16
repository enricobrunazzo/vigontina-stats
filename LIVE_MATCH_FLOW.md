# Flusso Partita Live Semplificato

Questo documento descrive il nuovo flusso semplificato per la gestione delle partite live nel sistema Vigontina Stats.

## Panoramica

Il nuovo sistema elimina la complessità della scelta tra partite locali e condivise. **Tutte le partite sono ora automaticamente salvate nel cloud** con possibilità di riprendere la partita da qualsiasi dispositivo.

## Flusso Utente

### 1. Avvio Nuova Partita

- Dalla **Home**, clicco su **"Nuova Partita"**
- Compilo i dettagli della partita (avversario, data, competizione, ecc.)
- La partita viene **automaticamente creata nel cloud**
- Vengo portato alla **panoramica partita**

### 2. Durante la Partita

- **Tutti gli eventi vengono salvati in tempo reale nel cloud**:
  - Gol (con marcatore e eventuale assistman)
  - Rigori (segnati/sbagliati)
  - Autogol
  - Gol avversario
  - Timer e cronometraggio

- **Sulla Home appare il Live Dashboard**:
  - Punteggio aggiornato in tempo reale
  - Ultimi eventi della partita
  - Pulsante **"Riprendi Partita"** per tornare alla gestione

### 3. Ripresa Partita

- Il pulsante **"Nuova Partita"** diventa **"Riprendi Partita"**
- Cliccando su **"Riprendi Partita"** torno direttamente alla partita in corso
- Tutti i dati sono **sincronizzati e aggiornati**
- Posso continuare a gestire la partita normalmente

### 4. Conclusione Partita

- Completo tutti i tempi di gioco
- Clicco **"Salva Partita"** nella panoramica
- La partita viene **spostata nello storico**
- Il pulsante torna a **"Nuova Partita"**
- Il **Live Dashboard scompare** dalla Home

## Vantaggi del Nuovo Sistema

### ✅ Semplicità
- **Un solo flusso**: non c'è più scelta tra locale/condiviso
- **Automatico**: tutto viene salvato nel cloud senza configurazione

### ✅ Affidabilità
- **Resume garantito**: posso sempre riprendere una partita interrotta
- **Sincronizzazione real-time**: dati sempre aggiornati
- **Backup automatico**: niente rischio di perdere dati

### ✅ Esperienza Utente
- **Live Dashboard**: vedo sempre lo stato della partita in corso
- **Un click per riprendere**: accesso immediato alla partita attiva
- **Stato sempre visibile**: so sempre se ho una partita in corso

## Dettagli Tecnici

### Persistenza Cloud
- Utilizza **Firebase Realtime Database**
- Salvataggio automatico di ogni evento
- Sincronizzazione in tempo reale
- Gestione offline con sync al reconnect

### Gestione Stato
- **Active Match Code**: ID univoco della partita attiva
- **Local Storage**: per mantenere il riferimento alla partita attiva
- **Real-time Updates**: tramite Firebase listeners

### Compatibilità
- **Funziona offline**: gli eventi vengono bufferizzati e inviati al reconnect
- **Multi-device**: posso riprendere la partita da qualsiasi dispositivo
- **Condivisione**: posso condividere il link live con altri per seguire la partita

## Stati dell'Applicazione

### Home senza partita attiva
```
[Logo Vigontina San Paolo]
[Statistiche stagione]
[Ultima partita giocata]
[Nuova Partita] [Storico Partite]
```

### Home con partita attiva
```
[Logo Vigontina San Paolo]

┌─ PARTITA IN CORSO ────────────┐
│ 🔴 LIVE                       │
│ Vigontina vs Avversario       │
│        2 - 1                  │
│ Ultimi eventi:                │
│ • 15' Gol: 10 Mario Rossi     │
│ • 20' Gol avversario          │
│ [▶ Riprendi Partita]          │
└───────────────────────────────┘

[Statistiche stagione]
[Ultima partita giocata]
[Riprendi Partita] [Storico Partite]
```

## Flusso di Salvataggio

1. **Durante la partita**: Ogni evento → Firebase Realtime DB
2. **Completamento partita**: 
   - Dati completi → Firebase Realtime DB (marca partita come completata)
   - Dati partita → Local Storage (storico locale)
   - Cleanup: rimuovi Active Match Code
3. **Visualizzazione storico**: Dati da Local Storage

Questa architettura garantisce la **massima affidabilità** mantenendo **performance ottimali** per la consultazione dello storico.
