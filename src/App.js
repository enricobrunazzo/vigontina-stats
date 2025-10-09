import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, ArrowLeft, Save, Download, FileText, Plus, Minus } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC1Dw0zFBOYwW6uVfEa0zHC5YBOFUhHsmI",
  authDomain: "vigontina-stats.firebaseapp.com",
  projectId: "vigontina-stats",
  storageBucket: "vigontina-stats.firebasestorage.app",
  messagingSenderId: "979551248607",
  appId: "1:979551248607:web:fb9b3092d79507ddaf896a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PLAYERS = [
  { num: 1, name: 'OMAR' },
  { num: 2, name: 'BICCIO' },
  { num: 3, name: 'LEONARDO' },
  { num: 4, name: 'JACOPO' },
  { num: 6, name: 'FRANCESCO' },
  { num: 7, name: 'ERNAD' },
  { num: 8, name: 'VITTORIO' },
  { num: 9, name: 'SOMTOCHI' },
  { num: 10, name: 'ZANE' },
  { num: 11, name: 'ALESSANDRO' },
  { num: 13, name: 'PIETRO' },
  { num: 14, name: 'PIETRO (CIGNO)' },
  { num: 15, name: 'RARES' },
  { num: 16, name: 'ARON' },
  { num: 18, name: 'SAMUELE' }
];

const VigontinaStats = () => {
  const [page, setPage] = useState('home');
  const [matchHistory, setMatchHistory] = useState([]);
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState(null);
  
  const [currentMatch, setCurrentMatch] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const timerRef = useRef(null);
  const wakeLockRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const q = query(collection(db, 'matches'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const matches = [];
      querySnapshot.forEach((doc) => {
        matches.push({ id: doc.id, ...doc.data() });
      });
      setMatchHistory(matches);
    } catch (error) {
      console.error('Errore caricamento storico:', error);
      alert(`⚠️ Errore nel caricamento dello storico: ${error.message || 'Errore sconosciuto'}`);
    }
  }, []);

  const loadTimerState = useCallback(async () => {
    try {
      const q = query(collection(db, 'activeTimer'));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const timerData = querySnapshot.docs[0].data();
        if (timerData.isRunning) {
          setTimerStartTime(timerData.startTime);
          setIsTimerRunning(true);
          const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
          setTimerSeconds(Math.min(elapsed, 1200));
        }
      }
    } catch (error) {
      console.error('Errore caricamento timer:', error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadTimerState();
    
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [loadHistory, loadTimerState]);

  useEffect(() => {
    if (isTimerRunning && timerStartTime) {
      const requestWakeLock = async () => {
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        } catch (err) {
          console.log('Wake Lock error:', err);
        }
      };
      requestWakeLock();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        if (elapsed >= 1200) {
          setTimerSeconds(1200);
          setIsTimerRunning(false);
          clearTimerState();
          alert('⏰ FINE TEMPO!\n\nIl tempo è scaduto.');
          if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }
        } else {
          setTimerSeconds(elapsed);
        }
      }, 100);
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timerStartTime]);

  const saveTimerState = async (startTime, isRunning) => {
    try {
      const q = query(collection(db, 'activeTimer'));
      const querySnapshot = await getDocs(q);
      
      const timerData = {
        startTime: startTime,
        isRunning: isRunning,
        lastUpdate: Date.now()
      };
      
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'activeTimer'), timerData);
      } else {
        const timerDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'activeTimer', timerDoc.id), timerData);
      }
    } catch (error) {
      console.error('Errore salvataggio timer:', error);
    }
  };

  const clearTimerState = async () => {
    try {
      const q = query(collection(db, 'activeTimer'));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const timerDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'activeTimer', timerDoc.id));
      }
    } catch (error) {
      console.error('Errore eliminazione timer:', error);
    }
  };

  const startTimer = () => {
    const startTime = Date.now() - (timerSeconds * 1000);
    setTimerStartTime(startTime);
    setIsTimerRunning(true);
    saveTimerState(startTime, true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    saveTimerState(timerStartTime, false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
    clearTimerState();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentMinute = () => Math.floor(timerSeconds / 60);

  const createNewMatch = useCallback((matchData) => {
    const periods = matchData.competition === 'Amichevole' 
      ? ['1° TEMPO', '2° TEMPO', '3° TEMPO', '4° TEMPO']
      : ['PROVA TECNICA', '1° TEMPO', '2° TEMPO', '3° TEMPO', '4° TEMPO'];

    const newMatch = {
      ...matchData,
      periods: periods.map(name => ({
        name,
        vigontina: 0,
        opponent: 0,
        goals: [],
        completed: false
      })),
      timestamp: Date.now()
    };

    setCurrentMatch(newMatch);
    setPage('match-overview');
  }, []);

  const startPeriod = useCallback((periodIndex) => {
    setCurrentPeriod(periodIndex);
    resetTimer();
    setPage('period');
  }, []);

  const viewCompletedPeriod = useCallback((periodIndex) => {
    setCurrentPeriod(periodIndex);
    setPage('period-view');
  }, []);

  const addGoal = useCallback((scorerNum, assistNum) => {
    const goal = {
      scorer: scorerNum,
      scorerName: PLAYERS.find(p => p.num === scorerNum)?.name,
      assist: assistNum,
      assistName: assistNum ? PLAYERS.find(p => p.num === assistNum)?.name : null,
      minute: getCurrentMinute(),
      type: 'goal'
    };

    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].goals.push(goal);
    updatedMatch.periods[currentPeriod].vigontina++;
    
    setCurrentMatch(updatedMatch);
  }, [currentMatch, currentPeriod, timerSeconds]);

  const addOwnGoal = useCallback(() => {
    if (!window.confirm('⚠️ Confermi di aggiungere un AUTOGOL?')) return;
    
    const ownGoal = {
      minute: getCurrentMinute(),
      type: 'own-goal'
    };
    
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].goals.push(ownGoal);
    updatedMatch.periods[currentPeriod].vigontina++;
    setCurrentMatch(updatedMatch);
  }, [currentMatch, currentPeriod, timerSeconds]);

  const addOpponentGoal = useCallback(() => {
    const opponentGoal = {
      minute: getCurrentMinute(),
      type: 'opponent-goal'
    };
    
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].goals.push(opponentGoal);
    updatedMatch.periods[currentPeriod].opponent++;
    setCurrentMatch(updatedMatch);
  }, [currentMatch, currentPeriod, timerSeconds]);

  const addPenalty = useCallback((team, scored, scorerNum = null) => {
    const penalty = {
      minute: getCurrentMinute(),
      type: scored ? (team === 'vigontina' ? 'penalty-goal' : 'penalty-opponent-goal') : (team === 'vigontina' ? 'penalty-missed' : 'penalty-opponent-missed'),
      scorer: scorerNum,
      scorerName: scorerNum ? PLAYERS.find(p => p.num === scorerNum)?.name : null,
      team: team
    };
    
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].goals.push(penalty);
    
    if (scored) {
      if (team === 'vigontina') {
        updatedMatch.periods[currentPeriod].vigontina++;
      } else {
        updatedMatch.periods[currentPeriod].opponent++;
      }
    }
    
    setCurrentMatch(updatedMatch);
  }, [currentMatch, currentPeriod, timerSeconds]);

  const updateOpponentScore = useCallback((delta) => {
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].opponent = Math.max(0, updatedMatch.periods[currentPeriod].opponent + delta);
    setCurrentMatch(updatedMatch);
  }, [currentMatch, currentPeriod]);

  const updateVigontinaScore = useCallback((delta) => {
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].vigontina = Math.max(0, updatedMatch.periods[currentPeriod].vigontina + delta);
    setCurrentMatch(updatedMatch);
  }, [currentMatch, currentPeriod]);

  const finishPeriod = () => {
    const isProvaTecnica = currentMatch.periods[currentPeriod].name === 'PROVA TECNICA';
    const confirmMessage = isProvaTecnica 
      ? 'Confermi di voler terminare la Prova Tecnica?'
      : 'Confermi di voler terminare questo tempo? Il timer verrà azzerato.';
    
    if (!window.confirm(confirmMessage)) return;
    
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].completed = true;
    setCurrentMatch(updatedMatch);
    resetTimer();
    setCurrentPeriod(null);
    setPage('match-overview');
  };

  const calculatePoints = (team) => {
    if (!currentMatch) return 0;
    let points = 0;
    currentMatch.periods.forEach(period => {
      if (period.vigontina > 0 || period.opponent > 0) {
        if (team === 'vigontina') {
          if (period.vigontina > period.opponent) points++;
          else if (period.vigontina === period.opponent) points++;
        } else {
          if (period.opponent > period.vigontina) points++;
          else if (period.opponent === period.vigontina) points++;
        }
      }
    });
    return points;
  };

  const saveMatch = async () => {
    if (!window.confirm('Sei sicuro di voler salvare e terminare questa partita?')) return;
    
    try {
      await addDoc(collection(db, 'matches'), {
        ...currentMatch,
        finalPoints: {
          vigontina: calculatePoints('vigontina'),
          opponent: calculatePoints('opponent')
        },
        savedAt: Date.now()
      });
      alert('✅ Partita salvata con successo!');
      await loadHistory();
      setCurrentMatch(null);
      setPage('home');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert(`❌ Errore nel salvataggio della partita: ${error.message || 'Errore sconosciuto'}\n\nRiprova o contatta l\'assistenza.`);
    }
  };

  const exportMatchToExcel = () => {
    if (!currentMatch) return;
    
    try {
      let csv = '\ufeff';
      
      csv += `VIGONTINA SAN PAOLO - REPORT PARTITA\n\n`;
      csv += `Competizione;${currentMatch.competition}\n`;
      if (currentMatch.matchDay) csv += `Giornata;${currentMatch.matchDay}\n`;
      csv += `Avversario;${currentMatch.opponent}\n`;
      csv += `Data;${new Date(currentMatch.date).toLocaleDateString('it-IT')}\n`;
      csv += `Luogo;${currentMatch.isHome ? 'Casa' : 'Trasferta'}\n`;
      if (currentMatch.assistantReferee) csv += `Assistente Arbitro;${currentMatch.assistantReferee}\n`;
      if (currentMatch.teamManager) csv += `Dirigente Accompagnatore;${currentMatch.teamManager}\n`;
      
      const vigontinaPoints = calculatePoints('vigontina');
      const opponentPoints = calculatePoints('opponent');
      const vigontinaGoals = currentMatch.periods.reduce((sum, p) => sum + p.vigontina, 0);
      const opponentGoals = currentMatch.periods.reduce((sum, p) => sum + p.opponent, 0);
      
      csv += `\nRISULTATO FINALE\n`;
      csv += `Punti;Vigontina ${vigontinaPoints} - ${opponentPoints} ${currentMatch.opponent}\n`;
      csv += `Gol Totali;${vigontinaGoals} - ${opponentGoals}\n`;
      
      csv += `\nDETTAGLIO PERIODI\n`;
      csv += `Periodo;Vigontina;Avversario\n`;
      currentMatch.periods.forEach(period => {
        csv += `${period.name};${period.vigontina};${period.opponent}\n`;
      });
      
      const scorers = {};
      const assisters = {};
      currentMatch.periods.forEach(period => {
        (period.goals || []).forEach(event => {
          if (event.type === 'goal' || event.type === 'penalty-goal') {
            if (event.scorer) {
              scorers[event.scorer] = (scorers[event.scorer] || 0) + 1;
            }
            if (event.assist) {
              assisters[event.assist] = (assisters[event.assist] || 0) + 1;
            }
          }
        });
      });
      
      if (Object.keys(scorers).length > 0) {
        csv += `\nMARCATORI\n`;
        csv += `Numero;Giocatore;Gol\n`;
        Object.entries(scorers)
          .sort((a, b) => b[1] - a[1])
          .forEach(([num, count]) => {
            const player = PLAYERS.find(p => p.num === parseInt(num));
            csv += `${num};${player?.name || 'Sconosciuto'};${count}\n`;
          });
      }
      
      if (Object.keys(assisters).length > 0) {
        csv += `\nASSIST\n`;
        csv += `Numero;Giocatore;Assist\n`;
        Object.entries(assisters)
          .sort((a, b) => b[1] - a[1])
          .forEach(([num, count]) => {
            const player = PLAYERS.find(p => p.num === parseInt(num));
            csv += `${num};${player?.name || 'Sconosciuto'};${count}\n`;
          });
      }
      
      csv += `\nCRONOLOGIA EVENTI\n`;
      csv += `Periodo;Minuto;Tipo;Dettagli\n`;
      currentMatch.periods.forEach(period => {
        (period.goals || []).forEach(event => {
          let tipo = '';
          let dettagli = '';
          
          switch (event.type) {
            case 'goal':
              tipo = 'Gol';
              dettagli = `${event.scorer} ${event.scorerName}`;
              if (event.assist) dettagli += ` (assist: ${event.assist} ${event.assistName})`;
              break;
            case 'own-goal':
              tipo = 'Autogol';
              dettagli = 'Vigontina';
              break;
            case 'opponent-goal':
              tipo = 'Gol Avversario';
              dettagli = currentMatch.opponent;
              break;
            case 'penalty-goal':
              tipo = 'Rigore Segnato';
              dettagli = `${event.scorer} ${event.scorerName}`;
              break;
            case 'penalty-missed':
              tipo = 'Rigore Fallito';
              dettagli = 'Vigontina';
              break;
            case 'penalty-opponent-goal':
              tipo = 'Rigore Segnato Avversario';
              dettagli = currentMatch.opponent;
              break;
            case 'penalty-opponent-missed':
              tipo = 'Rigore Fallito Avversario';
              dettagli = currentMatch.opponent;
              break;
          }
          
          csv += `${period.name};${event.minute}';${tipo};${dettagli}\n`;
        });
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fileName = `Vigontina_vs_${currentMatch.opponent.replace(/\s+/g, '_')}_${currentMatch.date}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ File CSV scaricato!\n\nPuoi aprirlo con Excel o Google Sheets.');
    } catch (error) {
      console.error('Errore export:', error);
      alert(`❌ Errore durante l'esportazione: ${error.message || 'Errore sconosciuto'}`);
    }
  };

  if (page === 'home') {
    const stats = useMemo(() => {
      const totalMatches = matchHistory.length;
      const wins = matchHistory.filter(m => m.finalPoints && m.finalPoints.vigontina > m.finalPoints.opponent).length;
      const draws = matchHistory.filter(m => m.finalPoints && m.finalPoints.vigontina === m.finalPoints.opponent).length;
      const losses = matchHistory.filter(m => m.finalPoints && m.finalPoints.vigontina < m.finalPoints.opponent).length;
      
      return { totalMatches, wins, draws, losses };
    }, [matchHistory]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <span className="text-lg font-black text-slate-900">V</span>
                  <span className="text-lg font-black text-cyan-500">SP</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Vigontina San Paolo</h1>
                <p className="text-sm text-gray-600">Esordienti 2025-2026</p>
              </div>
            </div>

            {stats.totalMatches > 0 && (
              <div className="bg-gradient-to-r from-slate-50 to-cyan-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3 text-center">Stagione 2025-2026</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{stats.totalMatches}</p>
                    <p className="text-xs text-gray-600">Partite</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
                    <p className="text-xs text-gray-600">Vinte</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.draws}</p>
                    <p className="text-xs text-gray-600">Pareggiate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
                    <p className="text-xs text-gray-600">Perse</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => setPage('new-match')}
                className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
              >
                Nuova Partita
              </button>
              
              <button
                onClick={() => setPage('history')}
                className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition text-lg font-semibold"
              >
                Storico Partite ({matchHistory.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'new-match') {
    return <NewMatchForm onSubmit={createNewMatch} onCancel={() => setPage('home')} />;
  }

  if (page === 'match-overview' && currentMatch) {
    return (
      <MatchOverview
        match={currentMatch}
        onStartPeriod={startPeriod}
        onViewPeriod={viewCompletedPeriod}
        onSave={saveMatch}
        onExport={exportMatchToExcel}
        onSummary={() => setPage('summary')}
        isTimerRunning={isTimerRunning}
        onBack={() => {
          if (window.confirm('Sei sicuro? I dati non salvati andranno persi.')) {
            setCurrentMatch(null);
            setPage('home');
          }
        }}
      />
    );
  }

  if (page === 'period' && currentMatch && currentPeriod !== null) {
    return (
      <PeriodPlay
        match={currentMatch}
        periodIndex={currentPeriod}
        timerSeconds={timerSeconds}
        isTimerRunning={isTimerRunning}
        onStartTimer={startTimer}
        onPauseTimer={pauseTimer}
        onAddGoal={addGoal}
        onAddOwnGoal={addOwnGoal}
        onAddOpponentGoal={addOpponentGoal}
        onAddPenalty={addPenalty}
        onUpdateOpponentScore={updateOpponentScore}
        onUpdateVigontinaScore={updateVigontinaScore}
        onFinish={finishPeriod}
        formatTime={formatTime}
        onBack={() => {
          setPage('match-overview');
          setCurrentPeriod(null);
        }}
      />
    );
  }

  if (page === 'period-view' && currentMatch && currentPeriod !== null) {
    return (
      <PeriodPlay
        match={currentMatch}
        periodIndex={currentPeriod}
        timerSeconds={timerSeconds}
        isTimerRunning={isTimerRunning}
        onStartTimer={startTimer}
        onPauseTimer={pauseTimer}
        onAddGoal={addGoal}
        onAddOwnGoal={addOwnGoal}
        onAddOpponentGoal={addOpponentGoal}
        onAddPenalty={addPenalty}
        onUpdateOpponentScore={updateOpponentScore}
        onUpdateVigontinaScore={updateVigontinaScore}
        onFinish={finishPeriod}
        formatTime={formatTime}
        isEditing={true}
        onBack={() => {
          setPage('match-overview');
          setCurrentPeriod(null);
        }}
      />
    );
  }

  if (page === 'history') {
    return (
      <MatchHistory 
        matches={matchHistory} 
        onBack={() => setPage('home')}
        onViewStats={(match) => {
          setSelectedHistoryMatch(match);
          setPage('history-summary');
        }}
        onDelete={async (matchId) => {
          if (!window.confirm('⚠️ Sei sicuro di voler eliminare questa partita?\n\nQuesta azione è irreversibile!')) {
            return;
          }
          
          const password = prompt('Inserisci la password per confermare l\'eliminazione:');
          if (password === 'Vigontina2526') {
            try {
              await deleteDoc(doc(db, 'matches', matchId));
              alert('✅ Partita eliminata con successo!');
              await loadHistory();
            } catch (error) {
              console.error('Errore eliminazione:', error);
              alert(`❌ Errore nell'eliminazione: ${error.message || 'Errore sconosciuto'}`);
            }
          } else if (password !== null) {
            alert('❌ Password errata. Eliminazione annullata.');
          }
        }}
      />
    );
  }

  if (page === 'summary' && currentMatch) {
    return <MatchSummary match={currentMatch} onBack={() => setPage('match-overview')} />;
  }

  if (page === 'history-summary' && selectedHistoryMatch) {
    return (
      <MatchSummary 
        match={selectedHistoryMatch} 
        onBack={() => {
          setSelectedHistoryMatch(null);
          setPage('history');
        }} 
      />
    );
  }

  return null;
};

const NewMatchForm = ({ onSubmit, onCancel }) => {
  const [competition, setCompetition] = useState('Torneo Provinciale Autunnale');
  const [matchDay, setMatchDay] = useState('');
  const [isHome, setIsHome] = useState(true);
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [assistantReferee, setAssistantReferee] = useState('');
  const [teamManager, setTeamManager] = useState('');
  const [notCalled, setNotCalled] = useState([]);

  const handleSubmit = () => {
    if (!opponent.trim()) {
      alert('Inserisci il nome dell\'avversario');
      return;
    }
    onSubmit({
      competition,
      matchDay: competition.includes('Torneo') ? matchDay : null,
      isHome,
      opponent,
      date,
      assistantReferee,
      teamManager,
      notCalled
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button onClick={onCancel} className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>

          <h2 className="text-2xl font-bold mb-6">Nuova Partita</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Competizione</label>
              <select
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option>Torneo Provinciale Autunnale</option>
                <option>Torneo Provinciale Primaverile</option>
                <option>Amichevole</option>
              </select>
            </div>

            {competition.includes('Torneo') && (
              <div>
                <label className="block text-sm font-medium mb-1">Giornata</label>
                <input
                  type="number"
                  value={matchDay}
                  onChange={(e) => setMatchDay(e.target.value)}
                  placeholder="Es: 1"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Luogo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsHome(true)}
                  className={`flex-1 py-2 rounded ${isHome ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                  🏠 Casa
                </button>
                <button
                  type="button"
                  onClick={() => setIsHome(false)}
                  className={`flex-1 py-2 rounded ${!isHome ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                  ✈️ Trasferta
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Avversario *</label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Assistente Arbitro</label>
              <select
                value={assistantReferee}
                onChange={(e) => setAssistantReferee(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleziona...</option>
                <option>Vendramin Enrico</option>
                <option>Brunazzo Enrico</option>
                <option>Campello Francesco</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dirigente Accompagnatore</label>
              <select
                value={teamManager}
                onChange={(e) => setTeamManager(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleziona...</option>
                <option>Vendramin Enrico</option>
                <option>Brunazzo Enrico</option>
                <option>Campello Francesco</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Non Convocati</label>
              <div className="border rounded p-3 max-h-48 overflow-y-auto space-y-2">
                {PLAYERS.map(player => (
                  <label key={player.num} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={notCalled.includes(player.num)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNotCalled([...notCalled, player.num]);
                        } else {
                          setNotCalled(notCalled.filter(n => n !== player.num));
                        }
                      }}
                    />
                    <span>{player.num} {player.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Inizia Partita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchOverview = ({ match, onStartPeriod, onViewPeriod, onSave, onExport, onSummary, isTimerRunning, onBack }) => {
  const calculateTotalGoals = (team) => {
    return match.periods.reduce((sum, p) => sum + (team === 'vigontina' ? p.vigontina : p.opponent), 0);
  };

  const calculatePoints = (team) => {
    let points = 0;
    match.periods.forEach(period => {
      if (period.vigontina > 0 || period.opponent > 0) {
        if (team === 'vigontina') {
          if (period.vigontina > period.opponent) points++;
          else if (period.vigontina === period.opponent) points++;
        } else {
          if (period.opponent > period.vigontina) points++;
          else if (period.opponent === period.vigontina) points++;
        }
      }
    });
    return points;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          Abbandona Partita
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Vigontina vs {match.opponent}</h2>
            {isTimerRunning && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                LIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {match.isHome ? '🏠 Casa' : '✈️ Trasferta'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {match.competition}
            {match.matchDay && ` - Giornata ${match.matchDay}`}
            {' • '}
            {new Date(match.date).toLocaleDateString('it-IT')}
          </p>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm font-semibold mb-2">Risultato Attuale</p>
              <div className="flex justify-center items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Punti</p>
                  <p className="text-4xl font-bold text-green-700">{calculatePoints('vigontina')}</p>
                </div>
                <span className="text-2xl">-</span>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Punti</p>
                  <p className="text-4xl font-bold text-green-700">{calculatePoints('opponent')}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Gol: {calculateTotalGoals('vigontina')} - {calculateTotalGoals('opponent')}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {match.periods.map((period, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${period.completed ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{period.name}</h3>
                    <p className="text-sm text-gray-600">
                      {period.vigontina} - {period.opponent}
                      {period.goals && period.goals.length > 0 && ` (${period.goals.length} eventi)`}
                    </p>
                  </div>
                  {!period.completed ? (
                    <button
                      onClick={() => onStartPeriod(idx)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      {period.name === 'PROVA TECNICA' ? 'Inizia' : 'Gioca'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewPeriod(idx)}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      Dettagli
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onSummary}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Riepilogo
            </button>
            <button
              onClick={onExport}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Excel
            </button>
          </div>

          <button
            onClick={onSave}
            className="w-full mt-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Termina e Salva Partita
          </button>
        </div>
      </div>
    </div>
  );
};

const PeriodPlay = ({ match, periodIndex, timerSeconds, isTimerRunning, onStartTimer, onPauseTimer, onAddGoal, onAddOwnGoal, onAddOpponentGoal, onAddPenalty, onUpdateOpponentScore, onUpdateVigontinaScore, onFinish, formatTime, isEditing, onBack }) => {
  const period = match.periods[periodIndex];
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false);
  const [selectedScorer, setSelectedScorer] = useState(null);
  const [selectedAssist, setSelectedAssist] = useState(null);
  const [penaltyTeam, setPenaltyTeam] = useState('vigontina');
  const [penaltyScored, setPenaltyScored] = useState(true);
  const [penaltyScorer, setPenaltyScorer] = useState(null);

  const availablePlayers = useMemo(() => 
    PLAYERS.filter(p => !match.notCalled.includes(p.num)), 
    [match.notCalled]
  );

  const handleAddGoal = () => {
    if (!selectedScorer) {
      alert('Seleziona il marcatore');
      return;
    }
    onAddGoal(selectedScorer, selectedAssist);
    setShowGoalDialog(false);
    setSelectedScorer(null);
    setSelectedAssist(null);
  };

  const handleAddPenalty = () => {
    if (penaltyTeam === 'vigontina' && penaltyScored && !penaltyScorer) {
      alert('Seleziona il rigorista');
      return;
    }
    onAddPenalty(penaltyTeam, penaltyScored, penaltyScorer);
    setShowPenaltyDialog(false);
    setPenaltyTeam('vigontina');
    setPenaltyScored(true);
    setPenaltyScorer(null);
  };

  const isProvaTecnica = period.name === 'PROVA TECNICA';
  const periodNumber = period.name.match(/(\d+)°/)?.[1] || '';
  const periodTitle = isProvaTecnica ? 'Prova Tecnica' : `${periodNumber}° Tempo`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {showGoalDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Segna Gol</h3>
              
              <div className="mb-4">
                <label className="block font-medium mb-2">Marcatore *</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {availablePlayers.map(player => (
                    <button
                      key={player.num}
                      onClick={() => setSelectedScorer(player.num)}
                      className={`p-2 rounded border text-sm ${
                        selectedScorer === player.num
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {player.num} {player.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-2">Assist</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedAssist(null)}
                    className={`p-2 rounded border text-sm ${
                      selectedAssist === null
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    Nessuno
                  </button>
                  {availablePlayers.filter(p => p.num !== selectedScorer).map(player => (
                    <button
                      key={player.num}
                      onClick={() => setSelectedAssist(player.num)}
                      className={`p-2 rounded border text-sm ${
                        selectedAssist === player.num
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {player.num} {player.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowGoalDialog(false)}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAddGoal}
                  className="flex-1 bg-blue-600 text-white py-2 rounded"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        )}

        {showPenaltyDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Rigore</h3>
              
              <div className="mb-4">
                <label className="block font-medium mb-2">Squadra</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPenaltyTeam('vigontina')}
                    className={`p-3 rounded border ${
                      penaltyTeam === 'vigontina'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    Vigontina
                  </button>
                  <button
                    onClick={() => setPenaltyTeam('opponent')}
                    className={`p-3 rounded border ${
                      penaltyTeam === 'opponent'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {match.opponent}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-2">Risultato</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPenaltyScored(true)}
                    className={`p-3 rounded border ${
                      penaltyScored
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    ⚽ Realizzato
                  </button>
                  <button
                    onClick={() => setPenaltyScored(false)}
                    className={`p-3 rounded border ${
                      !penaltyScored
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    ❌ Fallito
                  </button>
                </div>
              </div>

              {penaltyTeam === 'vigontina' && penaltyScored && (
                <div className="mb-4">
                  <label className="block font-medium mb-2">Rigorista *</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {availablePlayers.map(player => (
                      <button
                        key={player.num}
                        onClick={() => setPenaltyScorer(player.num)}
                        className={`p-2 rounded border text-sm ${
                          penaltyScorer === player.num
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {player.num} {player.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPenaltyDialog(false);
                    setPenaltyTeam('vigontina');
                    setPenaltyScored(true);
                    setPenaltyScorer(null);
                  }}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAddPenalty}
                  className="flex-1 bg-blue-600 text-white py-2 rounded"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          Torna alla Panoramica
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Vigontina vs {match.opponent} - {periodTitle}</h2>

          {!isProvaTecnica && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-5xl font-mono font-bold text-gray-800">
                  {formatTime(timerSeconds)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={isTimerRunning ? onPauseTimer : onStartTimer}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isTimerRunning ? 'Pausa' : 'Avvia'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm font-semibold mb-2">{isProvaTecnica ? 'Punteggio Prova Tecnica' : 'Punteggio Tempo'}</p>
              <div className="flex justify-center items-center gap-6">
                <div>
                  <p className="text-xs text-gray-600">Vigontina</p>
                  <p className="text-4xl font-bold text-green-700">{period.vigontina}</p>
                </div>
                <span className="text-2xl">-</span>
                <div>
                  <p className="text-xs text-gray-600">{match.opponent}</p>
                  <p className="text-4xl font-bold text-green-700">{period.opponent}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {isProvaTecnica ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>Prova Tecnica:</strong> Inserisci i punti manualmente. Al termine, la squadra vincente guadagna 1 punto nel punteggio finale.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => onUpdateVigontinaScore(-1)}
                      className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center bg-gray-100 py-3 rounded-lg">
                      <span className="font-semibold">Punti Vigontina</span>
                    </div>
                    <button
                      onClick={() => onUpdateVigontinaScore(1)}
                      className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => onUpdateOpponentScore(-1)}
                      className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center bg-gray-100 py-3 rounded-lg">
                      <span className="font-semibold">Punti Avversario</span>
                    </div>
                    <button
                      onClick={() => onUpdateOpponentScore(1)}
                      className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowGoalDialog(true)}
                  className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
                >
                  ⚽ GOL
                </button>

                <button
                  onClick={onAddOwnGoal}
                  className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center gap-1"
                >
                  <span className="bg-red-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">⚽</span>
                  AUTOGOL
                </button>

                <button
                  onClick={onAddOpponentGoal}
                  className="bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold text-sm"
                >
                  Gol {match.opponent}
                </button>

                <button
                  onClick={() => setShowPenaltyDialog(true)}
                  className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold"
                >
                  🎯 RIGORE
                </button>
              </div>
            )}
          </div>

          {!isProvaTecnica && period.goals && period.goals.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Eventi Partita</h3>
              <div className="space-y-2">
                {period.goals.map((event, idx) => {
                  if (event.type === 'goal') {
                    return (
                      <div key={idx} className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="font-medium text-green-800">
                          ⚽ {event.minute}' - {event.scorer} {event.scorerName}
                        </p>
                        {event.assist && (
                          <p className="text-sm text-green-700">
                            Assist: {event.assist} {event.assistName}
                          </p>
                        )}
                      </div>
                    );
                  } else if (event.type === 'own-goal') {
                    return (
                      <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="font-medium text-red-800 flex items-center gap-2">
                          <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>
                          {event.minute}' - Autogol
                        </p>
                      </div>
                    );
                  } else if (event.type === 'opponent-goal') {
                    return (
                      <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="font-medium text-blue-800">
                          ⚽ {event.minute}' - Gol {match.opponent}
                        </p>
                      </div>
                    );
                  } else if (event.type === 'penalty-goal') {
                    return (
                      <div key={idx} className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="font-medium text-green-800">
                          ⚽ {event.minute}' - Gol RIG. - {event.scorer} {event.scorerName}
                        </p>
                      </div>
                    );
                  } else if (event.type === 'penalty-missed') {
                    return (
                      <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="font-medium text-red-800 flex items-center gap-2">
                          <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>
                          {event.minute}' - RIG. FALLITO
                        </p>
                      </div>
                    );
                  } else if (event.type === 'penalty-opponent-goal') {
                    return (
                      <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="font-medium text-blue-800">
                          ⚽ {event.minute}' - Gol RIG. {match.opponent}
                        </p>
                      </div>
                    );
                  } else if (event.type === 'penalty-opponent-missed') {
                    return (
                      <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="font-medium text-red-800 flex items-center gap-2">
                          <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>
                          {event.minute}' - RIG. FALLITO {match.opponent}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          <button
            onClick={onFinish}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            {isEditing ? 'Salva Modifiche' : `Termina ${periodTitle}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const MatchHistory = ({ matches, onBack, onViewStats, onDelete }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>

          <h2 className="text-2xl font-bold mb-6">Storico Partite</h2>

          {matches.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Nessuna partita salvata</p>
          ) : (
            <div className="space-y-3">
              {matches.map(match => {
                const isWin = match.finalPoints.vigontina > match.finalPoints.opponent;
                const isLoss = match.finalPoints.vigontina < match.finalPoints.opponent;
                const bgColor = isWin ? 'bg-green-50' : isLoss ? 'bg-red-50' : 'bg-yellow-50';
                const resultText = isWin ? 'VINTA' : isLoss ? 'PERSA' : 'PAREGGIO';
                const resultColor = isWin ? 'text-green-700' : isLoss ? 'text-red-700' : 'text-yellow-700';
                
                return (
                  <div key={match.id} className={`border rounded-lg p-4 relative ${bgColor}`}>
                    <button
                      onClick={() => onDelete(match.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1"
                      title="Elimina partita"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <div className="pr-8">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-base">
                          Vigontina vs {match.opponent}
                        </h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${resultColor} bg-opacity-20`}>
                          {resultText}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{match.isHome ? '🏠' : '✈️'}</span>
                          <span>{match.competition}</span>
                          {match.matchDay && (
                            <>
                              <span>•</span>
                              <span>Giornata {match.matchDay}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(match.date).toLocaleDateString('it-IT')}</span>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">
                            {match.finalPoints.vigontina} - {match.finalPoints.opponent}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onViewStats(match)}
                      className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Dettagli Partita
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchSummary = ({ match, onBack }) => {
  const stats = useMemo(() => {
    const allGoals = match.periods ? match.periods.flatMap((period) =>
      (period.goals || []).map(goal => ({ ...goal, period: period.name }))
    ) : [];

    const scorers = {};
    const assisters = {};
    let ownGoalsCount = 0;
    let penaltiesScored = 0;
    let penaltiesMissed = 0;

    allGoals.forEach(event => {
      if (event.type === 'goal') {
        scorers[event.scorer] = (scorers[event.scorer] || 0) + 1;
        if (event.assist) {
          assisters[event.assist] = (assisters[event.assist] || 0) + 1;
        }
      } else if (event.type === 'own-goal') {
        ownGoalsCount++;
      } else if (event.type === 'penalty-goal') {
        if (event.scorer) {
          scorers[event.scorer] = (scorers[event.scorer] || 0) + 1;
        }
        penaltiesScored++;
      } else if (event.type === 'penalty-missed') {
        penaltiesMissed++;
      }
    });

    const vigontinaGoals = match.periods.reduce((sum, p) => sum + p.vigontina, 0);
    const opponentGoals = match.periods.reduce((sum, p) => sum + p.opponent, 0);
    
    let vigontinaPoints = 0;
    let opponentPoints = 0;
    match.periods.forEach(period => {
      if (period.vigontina > 0 || period.opponent > 0) {
        if (period.vigontina > period.opponent) vigontinaPoints++;
        else if (period.opponent > period.vigontina) opponentPoints++;
        else {
          vigontinaPoints++;
          opponentPoints++;
        }
      }
    });

    const isWin = vigontinaPoints > opponentPoints;
    const isDraw = vigontinaPoints === opponentPoints;
    const resultColor = isWin ? 'text-green-700' : isDraw ? 'text-yellow-700' : 'text-red-700';
    const resultBg = isWin ? 'bg-green-50 border-green-200' : isDraw ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
    const resultText = isWin ? 'VITTORIA' : isDraw ? 'PAREGGIO' : 'SCONFITTA';

    return {
      allGoals,
      scorers,
      assisters,
      ownGoalsCount,
      penaltiesScored,
      penaltiesMissed,
      vigontinaGoals,
      opponentGoals,
      vigontinaPoints,
      opponentPoints,
      isWin,
      isDraw,
      resultColor,
      resultBg,
      resultText
    };
  }, [match]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>

          <h2 className="text-2xl font-bold mb-6">Riepilogo Partita</h2>

          <div className={`border rounded-lg p-6 mb-6 ${stats.resultBg}`}>
            <div className="text-center mb-4">
              <p className={`text-3xl font-black mb-2 ${stats.resultColor}`}>{stats.resultText}</p>
              <div className="flex items-center justify-center gap-8 mb-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Vigontina San Paolo</p>
                  <p className="text-5xl font-bold text-gray-900">{stats.vigontinaPoints}</p>
                </div>
                <span className="text-3xl text-gray-400">-</span>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{match.opponent}</p>
                  <p className="text-5xl font-bold text-gray-900">{stats.opponentPoints}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Gol totali: {stats.vigontinaGoals} - {stats.opponentGoals}
              </p>
            </div>
            
            <div className="bg-white/50 p-3 rounded text-sm">
              <p className="text-center">
                <strong>{match.competition}</strong>
                {match.matchDay && ` - Giornata ${match.matchDay}`}
                {' • '}
                {match.isHome ? '🏠 Casa' : '✈️ Trasferta'}
                {' • '}
                {new Date(match.date).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(stats.scorers).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">⚽ Marcatori</h3>
                  <div className="space-y-1">
                    {Object.entries(stats.scorers)
                      .sort((a, b) => b[1] - a[1])
                      .map(([num, count]) => {
                        const player = PLAYERS.find(p => p.num === parseInt(num));
                        return (
                          <div key={num} className="bg-gray-50 p-2 rounded flex justify-between items-center text-sm">
                            <span>{num} {player?.name}</span>
                            <span className="font-bold">{count}⚽</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {Object.keys(stats.assisters).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">🎯 Assist</h3>
                  <div className="space-y-1">
                    {Object.entries(stats.assisters)
                      .sort((a, b) => b[1] - a[1])
                      .map(([num, count]) => {
                        const player = PLAYERS.find(p => p.num === parseInt(num));
                        return (
                          <div key={num} className="bg-gray-50 p-2 rounded flex justify-between items-center text-sm">
                            <span>{num} {player?.name}</span>
                            <span className="font-bold">{count}🎯</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {(stats.ownGoalsCount > 0 || stats.penaltiesScored > 0 || stats.penaltiesMissed > 0) && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">📊 Altri Eventi</h3>
                  <div className="space-y-1">
                    {stats.ownGoalsCount > 0 && (
                      <div className="bg-red-50 p-2 rounded flex justify-between items-center text-sm border border-red-200">
                        <span className="text-red-800">Autogol</span>
                        <span className="font-bold text-red-800">{stats.ownGoalsCount}</span>
                      </div>
                    )}
                    {stats.penaltiesScored > 0 && (
                      <div className="bg-green-50 p-2 rounded flex justify-between items-center text-sm border border-green-200">
                        <span className="text-green-800">Rigori segnati</span>
                        <span className="font-bold text-green-800">{stats.penaltiesScored}</span>
                      </div>
                    )}
                    {stats.penaltiesMissed > 0 && (
                      <div className="bg-orange-50 p-2 rounded flex justify-between items-center text-sm border border-orange-200">
                        <span className="text-orange-800">Rigori falliti</span>
                        <span className="font-bold text-orange-800">{stats.penaltiesMissed}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {match.periods && match.periods.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">📋 Cronologia Partita</h3>
                <div className="space-y-6">
                  {match.periods.map((period, periodIdx) => {
                    const periodEvents = period.goals || [];
                    if (periodEvents.length === 0 && period.vigontina === 0 && period.opponent === 0) return null;

                    const vigontinaEvents = periodEvents.filter(e => 
                      e.type === 'goal' || 
                      e.type === 'penalty-goal' || 
                      e.type === 'own-goal' ||
                      (e.type === 'penalty-missed' && e.team === 'vigontina')
                    );
                    const opponentEvents = periodEvents.filter(e => 
                      e.type === 'opponent-goal' || 
                      e.type === 'penalty-opponent-goal' ||
                      (e.type === 'penalty-opponent-missed')
                    );

                    return (
                      <div key={periodIdx} className="border rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-3 border-b">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-800">{period.name}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-600">
                                Vigontina {period.vigontina} - {period.opponent} {match.opponent}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(vigontinaEvents.length > 0 || opponentEvents.length > 0) ? (
                          <div className="grid grid-cols-2 divide-x">
                            <div className="p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-2 text-center">VIGONTINA</p>
                              <div className="space-y-2">
                                {vigontinaEvents.map((event, idx) => (
                                  <div key={idx} className="bg-green-50 p-2 rounded border border-green-200 text-sm">
                                    {event.type === 'goal' && (
                                      <>
                                        <p className="font-medium text-green-800">
                                          ⚽ {event.minute}' - {event.scorer} {event.scorerName}
                                        </p>
                                        {event.assist && (
                                          <p className="text-xs text-green-700">
                                            Assist: {event.assist} {event.assistName}
                                          </p>
                                        )}
                                      </>
                                    )}
                                    {event.type === 'penalty-goal' && (
                                      <p className="font-medium text-green-800">
                                        🎯 {event.minute}' - Rigore {event.scorer} {event.scorerName}
                                      </p>
                                    )}
                                    {event.type === 'own-goal' && (
                                      <p className="font-medium text-red-800 flex items-center gap-1">
                                        <span className="bg-red-600 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs">⚽</span>
                                        {event.minute}' - Autogol
                                      </p>
                                    )}
                                    {event.type === 'penalty-missed' && (
                                      <p className="font-medium text-red-800 flex items-center gap-1">
                                        ❌ {event.minute}' - Rigore fallito
                                      </p>
                                    )}
                                  </div>
                                ))}
                                {vigontinaEvents.length === 0 && (
                                  <p className="text-xs text-gray-400 text-center py-4">Nessun evento</p>
                                )}
                              </div>
                            </div>

                            <div className="p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-2 text-center uppercase">{match.opponent}</p>
                              <div className="space-y-2">
                                {opponentEvents.map((event, idx) => (
                                  <div key={idx} className="bg-blue-50 p-2 rounded border border-blue-200 text-sm">
                                    {event.type === 'opponent-goal' && (
                                      <p className="font-medium text-blue-800">
                                        ⚽ {event.minute}' - Gol
                                      </p>
                                    )}
                                    {event.type === 'penalty-opponent-goal' && (
                                      <p className="font-medium text-blue-800">
                                        🎯 {event.minute}' - Rigore
                                      </p>
                                    )}
                                    {event.type === 'penalty-opponent-missed' && (
                                      <p className="font-medium text-red-800 flex items-center gap-1">
                                        ❌ {event.minute}' - Rigore fallito
                                      </p>
                                    )}
                                  </div>
                                ))}
                                {opponentEvents.length === 0 && (
                                  <p className="text-xs text-gray-400 text-center py-4">Nessun evento</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            Nessun evento registrato
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(match.assistantReferee || match.teamManager) && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-sm text-gray-600">Informazioni Aggiuntive</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  {match.assistantReferee && (
                    <p><strong>Assistente Arbitro:</strong> {match.assistantReferee}</p>
                  )}
                  {match.teamManager && (
                    <p><strong>Dirigente Accompagnatore:</strong> {match.teamManager}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VigontinaStats;
