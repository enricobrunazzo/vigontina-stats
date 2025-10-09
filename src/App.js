import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    loadHistory();
    loadTimerState();
    
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

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

  const loadHistory = async () => {
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
    }
  };

  const loadTimerState = async () => {
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
  };

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

  const createNewMatch = (matchData) => {
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
  };

  const startPeriod = (periodIndex) => {
    setCurrentPeriod(periodIndex);
    resetTimer();
    setPage('period');
  };

  const viewCompletedPeriod = (periodIndex) => {
    setCurrentPeriod(periodIndex);
    setPage('period-view');
  };

  const addGoal = (scorerNum, assistNum) => {
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
  };

  const addOwnGoal = () => {
    const ownGoal = {
      minute: getCurrentMinute(),
      type: 'own-goal'
    };
    
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].goals.push(ownGoal);
    updatedMatch.periods[currentPeriod].vigontina++;
    setCurrentMatch(updatedMatch);
  };

  const addOpponentGoal = () => {
    const opponentGoal = {
      minute: getCurrentMinute(),
      type: 'opponent-goal'
    };
    
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].goals.push(opponentGoal);
    updatedMatch.periods[currentPeriod].opponent++;
    setCurrentMatch(updatedMatch);
  };

  const addPenalty = (team, scored, scorerNum = null) => {
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
  };

  const updateOpponentScore = (delta) => {
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].opponent = Math.max(0, updatedMatch.periods[currentPeriod].opponent + delta);
    setCurrentMatch(updatedMatch);
  };

  const updateVigontinaScore = (delta) => {
    const updatedMatch = { ...currentMatch };
    updatedMatch.periods[currentPeriod].vigontina = Math.max(0, updatedMatch.periods[currentPeriod].vigontina + delta);
    setCurrentMatch(updatedMatch);
  };

  const finishPeriod = () => {
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
    try {
      await addDoc(collection(db, 'matches'), {
        ...currentMatch,
        finalPoints: {
          vigontina: calculatePoints('vigontina'),
          opponent: calculatePoints('opponent')
        },
        savedAt: Date.now()
      });
      alert('✅ Partita salvata!');
      await loadHistory();
      setCurrentMatch(null);
      setPage('home');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('❌ Errore nel salvataggio');
    }
  };

  const exportMatchToExcel = () => {
    alert('Export Excel in development');
  };

  if (page === 'home') {
    const totalMatches = matchHistory.length;
    const wins = matchHistory.filter(m => m.finalPoints && m.finalPoints.vigontina > m.finalPoints.opponent).length;
    const draws = matchHistory.filter(m => m.finalPoints && m.finalPoints.vigontina === m.finalPoints.opponent).length;
    const losses = matchHistory.filter(m => m.finalPoints && m.finalPoints.vigontina < m.finalPoints.opponent).length;

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

            {totalMatches > 0 && (
              <div className="bg-gradient-to-r from-slate-50 to-cyan-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3 text-center">Stagione 2025-2026</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{totalMatches}</p>
                    <p className="text-xs text-gray-600">Partite</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{wins}</p>
                    <p className="text-xs text-gray-600">Vinte</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{draws}</p>
                    <p className="text-xs text-gray-600">Pareggiate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{losses}</p>
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
        onReload={loadHistory}
        onViewStats={(match) => {
          setSelectedHistoryMatch(match);
          setPage('history-summary');
        }}
        onDelete={async (matchId) => {
          const password = prompt('Inserisci la password per eliminare la partita:');
          if (password === 'Vigontina2526') {
            try {
              await deleteDoc(doc(db, 'matches', matchId));
              alert('✅ Partita eliminata!');
              await loadHistory();
            } catch (error) {
              console.error('Errore eliminazione:', error);
              alert('❌ Errore nell\'eliminazione');
            }
          } else if (password !== null) {
            alert('❌ Password errata');
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

  const handleSubmit = (e) => {
    e.preventDefault();
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Inizia Partita
            </button>
          </form>
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
                      {period.goals && period.goals.length > 0 && ` (${period.goals.length} gol)`}
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

  const availablePlayers = PLAYERS.filter(p => !match.notCalled.includes(p.num));

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
  const period = match.periods[periodIndex];
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedScorer, setSelectedScorer] = useState(null);
  const [selectedAssist, setSelectedAssist] = useState(null);

  const availablePlayers = PLAYERS.filter(p => !match.notCalled.includes(p.num));

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

  const isProvaTecnica = period.name === 'PROVA TECNICA';

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
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowGoalDialog(true)}
                  className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
                >
                  ⚽ GOL
                </button>

                <button
                  onClick={onAddOwnGoal}
                  className="bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-semibold"
                >
                  🔴 AUTOGOL
                </button>

                <button
                  onClick={onAddOpponentGoal}
                  className="bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold text-sm"
                >
                  Gol {match.opponent}
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
                        <p className="font-medium text-red-800">
                          ⚽ {event.minute}' - Autogol
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>

          <h2 className="text-2xl font-bold mb-6">Riepilogo Partita</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Informazioni Partita</h3>
              <div className="bg-gray-50 p-4 rounded space-y-1">
                <p><strong>Competizione:</strong> {match.competition}</p>
                {match.matchDay && <p><strong>Giornata:</strong> {match.matchDay}</p>}
                <p><strong>Luogo:</strong> {match.isHome ? '🏠 Casa' : '✈️ Trasferta'}</p>
                <p><strong>Avversario:</strong> {match.opponent}</p>
                <p><strong>Data:</strong> {new Date(match.date).toLocaleDateString('it-IT')}</p>
                {match.assistantReferee && <p><strong>Assistente Arbitro:</strong> {match.assistantReferee}</p>}
                {match.teamManager && <p><strong>Dirigente Accompagnatore:</strong> {match.teamManager}</p>}
              </div>
            </div>

            {Object.keys(scorers).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">⚽ Marcatori</h3>
                <div className="space-y-2">
                  {Object.entries(scorers)
                    .sort((a, b) => b[1] - a[1])
                    .map(([num, count]) => {
                      const player = PLAYERS.find(p => p.num === parseInt(num));
                      return (
                        <div key={num} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                          <span>{num} {player?.name}</span>
                          <span className="font-bold flex items-center gap-1">
                            {count} {'⚽'.repeat(Math.min(count, 5))}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {ownGoalsCount > 0 && (
              <div>
                <h3 className="font-semibold mb-2">🔴 Autogol</h3>
                <div className="bg-red-50 p-3 rounded flex justify-between items-center border border-red-200">
                  <span className="text-red-800 flex items-center gap-2">
                    <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>
                    Autogol
                  </span>
                  <span className="font-bold text-red-800 flex items-center gap-1">
                    {ownGoalsCount}
                  </span>
                </div>
              </div>
            )}

            {(penaltiesScored > 0 || penaltiesMissed > 0) && (
              <div>
                <h3 className="font-semibold mb-2">🎯 Rigori</h3>
                <div className="space-y-2">
                  {penaltiesScored > 0 && (
                    <div className="bg-green-50 p-3 rounded flex justify-between items-center border border-green-200">
                      <span className="text-green-800">Realizzati</span>
                      <span className="font-bold text-green-800">{penaltiesScored}</span>
                    </div>
                  )}
                  {penaltiesMissed > 0 && (
                    <div className="bg-red-50 p-3 rounded flex justify-between items-center border border-red-200">
                      <span className="text-red-800">Falliti</span>
                      <span className="font-bold text-red-800">{penaltiesMissed}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {Object.keys(assisters).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">🎯 Assist</h3>
                <div className="space-y-2">
                  {Object.entries(assisters)
                    .sort((a, b) => b[1] - a[1])
                    .map(([num, count]) => {
                      const player = PLAYERS.find(p => p.num === parseInt(num));
                      return (
                        <div key={num} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                          <span>{num} {player?.name}</span>
                          <span className="font-bold flex items-center gap-1">
                            {count} {'🎯'.repeat(Math.min(count, 5))}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {allGoals.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">📋 Cronologia Eventi</h3>
                <div className="space-y-2">
                  {allGoals.map((event, idx) => {
                    if (event.type === 'goal') {
                      return (
                        <div key={idx} className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="font-medium text-green-800">
                            ⚽ {event.period} - {event.minute}' - {event.scorer} {event.scorerName}
                          </p>
                          {event.assist && (
                            <p className="text-sm text-green-700">
                              🎯 Assist: {event.assist} {event.assistName}
                            </p>
                          )}
                        </div>
                      );
                    } else if (event.type === 'own-goal') {
                      return (
                        <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="font-medium text-red-800 flex items-center gap-2">
                            <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>
                            {event.period} - {event.minute}' - Autogol
                          </p>
                        </div>
                      );
                    } else if (event.type === 'opponent-goal') {
                      return (
                        <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="font-medium text-blue-800">
                            ⚽ {event.period} - {event.minute}' - Gol {match.opponent}
                          </p>
                        </div>
                      );
                    } else if (event.type === 'penalty-goal') {
                      return (
                        <div key={idx} className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="font-medium text-green-800">
                            ⚽ {event.period} - {event.minute}' - Gol RIG.{event.scorer && ` - ${event.scorer} ${event.scorerName}`}
                          </p>
                        </div>
                      );
                    } else if (event.type === 'penalty-missed') {
                      return (
                        <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="font-medium text-red-800 flex items-center gap-2">
                            <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>
                            {event.period} - {event.minute}' - RIG. FALLITO
                          </p>
                        </div>
                      );
                    } else if (event.type === 'penalty-opponent-goal') {
                      return (
                        <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="font-medium text-blue-800">
                            ⚽ {event.period} - {event.minute}' - Gol RIG. {match.opponent}
                          </p>
                        </div>
                      );
                    } else if (event.type === 'penalty-opponent-missed') {
                      return (
                        <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="font-medium text-red-800 flex items-center gap-2">
                            <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>
                            {event.period} - {event.minute}' - RIG. FALLITO {match.opponent}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>

          <h2 className="text-2xl font-bold mb-6">Riepilogo Partita</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Informazioni Partita</h3>
              <div className="bg-gray-50 p-4 rounded space-y-1">
                <p><strong>Competizione:</strong> {match.competition}</p>
                {match.matchDay && <p><strong>Giornata:</strong> {match.matchDay}</p>}
                <p><strong>Luogo:</strong> {match.isHome ? '🏠 Casa' : '✈️ Trasferta'}</p>
                <p><strong>Avversario:</strong> {match.opponent}</p>
                <p><strong>Data:</strong> {new Date(match.date).toLocaleDateString('it-IT')}</p>
                {match.assistantReferee && <p><strong>Assistente Arbitro:</strong> {match.assistantReferee}</p>}
                {match.teamManager && <p><strong>Dirigente Accompagnatore:</strong> {match.teamManager}</p>}
              </div>
            </div>

            {Object.keys(scorers).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">⚽ Marcatori</h3>
                <div className="space-y-2">
                  {Object.entries(scorers)
                    .sort((a, b) => b[1] - a[1])
                    .map(([num, count]) => {
                      const player = PLAYERS.find(p => p.num === parseInt(num));
                      return (
                        <div key={num} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                          <span>{num} {player?.name}</span>
                          <span className="font-bold flex items-center gap-1">
                            {count} {'⚽'.repeat(Math.min(count, 5))}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {ownGoalsCount > 0 && (
              <div>
                <h3 className="font-semibold mb-2">🔴 Autogol</h3>
                <div className="bg-red-50 p-3 rounded flex justify-between items-center border border-red-200">
                  <span className="text-red-800">Autogol</span>
                  <span className="font-bold text-red-800 flex items-center gap-1">
                    {ownGoalsCount} {'⚽'.repeat(Math.min(ownGoalsCount, 5))}
                  </span>
                </div>
              </div>
            )}

            {Object.keys(assisters).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">🎯 Assist</h3>
                <div className="space-y-2">
                  {Object.entries(assisters)
                    .sort((a, b) => b[1] - a[1])
                    .map(([num, count]) => {
                      const player = PLAYERS.find(p => p.num === parseInt(num));
                      return (
                        <div key={num} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                          <span>{num} {player?.name}</span>
                          <span className="font-bold flex items-center gap-1">
                            {count} {'🎯'.repeat(Math.min(count, 5))}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {allGoals.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">📋 Cronologia Eventi</h3>
                <div className="space-y-2">
                  {allGoals.map((event, idx) => {
                    if (event.type === 'goal') {
                      return (
                        <div key={idx} className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="font-medium text-green-800">
                            ⚽ {event.period} - {event.minute}' - {event.scorer} {event.scorerName}
                          </p>
                          {event.assist && (
                            <p className="text-sm text-green-700">
                              🎯 Assist: {event.assist} {event.assistName}
                            </p>
                          )}
                        </div>
                      );
                    } else if (event.type === 'own-goal') {
                      return (
                        <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="font-medium text-red-800">
                            ⚽ {event.period} - {event.minute}' - Autogol
                          </p>
                        </div>
                      );
                    } else if (event.type === 'opponent-goal') {
                      return (
                        <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="font-medium text-blue-800">
                            ⚽ {event.period} - {event.minute}' - Gol {match.opponent}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })}
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
