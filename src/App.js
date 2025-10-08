import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Trophy, Target, Users, ChevronLeft, ChevronRight, Download, History, Save, Play, Pause, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1Dw0zFBOYwW6uVfEa0zHC5YBOFUhHsmI",
  authDomain: "vigontina-stats.firebaseapp.com",
  projectId: "vigontina-stats",
  storageBucket: "vigontina-stats.firebasestorage.app",
  messagingSenderId: "979551248607",
  appId: "1:979551248607:web:fb9b3092d79507ddaf896a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const VigontinaStats = () => {
  const [players] = useState([
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
  ]);

  const periods = ['PROVA TECNICA', '1° TEMPO', '2° TEMPO', '3° TEMPO', '4° TEMPO'];
  
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [opponentName, setOpponentName] = useState('Avversario');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [assistantReferee, setAssistantReferee] = useState('');
  const [teamManager, setTeamManager] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedScorer, setSelectedScorer] = useState(null);
  const [selectedAssist, setSelectedAssist] = useState(null);
  
  // Timer states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);
  
  const [periodScores, setPeriodScores] = useState(() => {
    const initial = {};
    periods.forEach((_, i) => {
      initial[i] = { vigontina: 0, opponent: 0 };
    });
    return initial;
  });

  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(() => {
    const initialStats = {};
    players.forEach(p => {
      initialStats[p.num] = { goals: 0, assists: 0 };
    });
    return initialStats;
  });

  const [notCalled, setNotCalled] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && currentPeriod > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev >= 1200) { // 20 minuti = 1200 secondi
            setIsTimerRunning(false);
            return 1200;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (!isTimerRunning || currentPeriod === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, currentPeriod]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentMinute = () => {
    return Math.floor(timerSeconds / 60);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const loadHistory = async () => {
    try {
      const q = query(collection(db, 'matches'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const matches = [];
      querySnapshot.forEach((doc) => {
        matches.push({ id: doc.id, ...doc.data() });
      });
      setMatchHistory(matches);
      console.log(`✅ Caricati ${matches.length} match dallo storico`);
    } catch (error) {
      console.error('Errore caricamento storico:', error);
    }
  };

  const saveToFirebase = async () => {
    try {
      setSaving(true);
      
      const matchData = {
        date: matchDate,
        opponent: opponentName,
        assistantReferee: assistantReferee || '-',
        teamManager: teamManager || '-',
        periodScores: periodScores,
        finalPoints: {
          vigontina: calculatePoints('vigontina'),
          opponent: calculatePoints('opponent')
        },
        totalGoals: {
          vigontina: getTotalScore('vigontina'),
          opponent: getTotalScore('opponent')
        },
        goals: goals,
        playerStats: stats,
        notCalled: notCalled,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'matches'), matchData);
      
      alert('✅ Partita salvata nello storico!');
      await loadHistory();
      setSaving(false);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('❌ Errore nel salvataggio: ' + error.message);
      setSaving(false);
    }
  };

  const addGoal = (scorerNum) => {
    setSelectedScorer(scorerNum);
    setShowGoalDialog(true);
  };

  const confirmGoal = () => {
    if (!selectedScorer) return;
    
    const minute = getCurrentMinute();
    const goal = {
      scorer: selectedScorer,
      scorerName: players.find(p => p.num === selectedScorer)?.name,
      assist: selectedAssist,
      assistName: selectedAssist ? players.find(p => p.num === selectedAssist)?.name : null,
      minute: minute,
      period: currentPeriod,
      periodName: periods[currentPeriod]
    };
    
    setGoals(prev => [...prev, goal]);
    
    setStats(prev => ({
      ...prev,
      [selectedScorer]: {
        ...prev[selectedScorer],
        goals: prev[selectedScorer].goals + 1
      },
      ...(selectedAssist ? {
        [selectedAssist]: {
          ...prev[selectedAssist],
          assists: prev[selectedAssist].assists + 1
        }
      } : {})
    }));
    
    if (currentPeriod > 0) {
      updateScore('vigontina', 1);
    }
    
    setShowGoalDialog(false);
    setSelectedScorer(null);
    setSelectedAssist(null);
  };

  const removeLastGoal = (playerNum) => {
    const playerGoals = goals.filter(g => g.scorer === playerNum);
    if (playerGoals.length === 0) return;
    
    const lastGoal = playerGoals[playerGoals.length - 1];
    const lastGoalIndex = goals.lastIndexOf(lastGoal);
    
    setGoals(prev => prev.filter((_, idx) => idx !== lastGoalIndex));
    
    setStats(prev => ({
      ...prev,
      [playerNum]: {
        ...prev[playerNum],
        goals: Math.max(0, prev[playerNum].goals - 1)
      },
      ...(lastGoal.assist ? {
        [lastGoal.assist]: {
          ...prev[lastGoal.assist],
          assists: Math.max(0, prev[lastGoal.assist].assists - 1)
        }
      } : {})
    }));
    
    if (lastGoal.period > 0) {
      setPeriodScores(prevScores => ({
        ...prevScores,
        [lastGoal.period]: {
          ...prevScores[lastGoal.period],
          vigontina: Math.max(0, prevScores[lastGoal.period].vigontina - 1)
        }
      }));
    }
  };

  const toggleNotCalled = (playerNum) => {
    setNotCalled(prev => {
      if (prev.includes(playerNum)) {
        return prev.filter(num => num !== playerNum);
      } else {
        setStats(current => ({
          ...current,
          [playerNum]: { goals: 0, assists: 0 }
        }));
        return [...prev, playerNum];
      }
    });
  };

  const updateScore = (team, delta) => {
    setPeriodScores(prev => ({
      ...prev,
      [currentPeriod]: {
        ...prev[currentPeriod],
        [team]: Math.max(0, prev[currentPeriod][team] + delta)
      }
    }));
  };

  const getTotalScore = (team) => {
    return Object.values(periodScores).reduce((sum, score) => sum + score[team], 0);
  };

  const calculatePoints = (team) => {
    let points = 0;
    periods.forEach((_, i) => {
      const vigontinaScore = periodScores[i].vigontina;
      const opponentScore = periodScores[i].opponent;
      
      // Conta solo se c'è stato almeno un gol nel tempo (partita giocata)
      if (vigontinaScore > 0 || opponentScore > 0) {
        if (team === 'vigontina') {
          if (vigontinaScore > opponentScore) points += 1; // Vittoria
          else if (vigontinaScore === opponentScore) points += 1; // Pareggio
        } else {
          if (opponentScore > vigontinaScore) points += 1; // Vittoria
          else if (opponentScore === vigontinaScore) points += 1; // Pareggio
        }
      }
    });
    return points;
  };

  const resetMatch = () => {
    if (!window.confirm('Sei sicuro di voler iniziare una nuova partita? I dati non salvati andranno persi.')) {
      return;
    }
    
    const resetStats = {};
    players.forEach(p => {
      resetStats[p.num] = { goals: 0, assists: 0 };
    });
    setStats(resetStats);
    
    const resetScores = {};
    periods.forEach((_, i) => {
      resetScores[i] = { vigontina: 0, opponent: 0 };
    });
    setPeriodScores(resetScores);
    setCurrentPeriod(0);
    setOpponentName('Avversario');
    setMatchDate(new Date().toISOString().split('T')[0]);
    setAssistantReferee('');
    setTeamManager('');
    setNotCalled([]);
    setGoals([]);
    resetTimer();
  };

  const getTotalGoals = () => {
    return Object.values(stats).reduce((sum, s) => sum + s.goals, 0);
  };

  const exportToExcel = () => {
    const summaryData = [
      ['VIGONTINA ESORDIENTI - RIEPILOGO PARTITA'],
      [''],
      ['Avversario:', opponentName],
      ['Data:', new Date(matchDate).toLocaleDateString('it-IT')],
      ['Assistente arbitro:', assistantReferee || '-'],
      ['Dirigente accompagnatore:', teamManager || '-'],
      [''],
      ['PUNTEGGI PER TEMPO'],
      ['Tempo', 'Vigontina', opponentName, 'Punti Vigontina', 'Punti ' + opponentName],
    ];

    periods.forEach((period, i) => {
      const vigScore = periodScores[i].vigontina;
      const oppScore = periodScores[i].opponent;
      let vigPoints = 0;
      let oppPoints = 0;
      
      if (vigScore > 0 || oppScore > 0) {
        if (vigScore > oppScore) vigPoints = 1;
        else if (vigScore === oppScore) { vigPoints = 1; oppPoints = 1; }
        else oppPoints = 1;
      }
      
      summaryData.push([
        period,
        vigScore,
        oppScore,
        vigPoints,
        oppPoints
      ]);
    });

    summaryData.push(
      [''],
      ['TOTALE PUNTI', '', '', calculatePoints('vigontina'), calculatePoints('opponent')],
      [''],
      ['TOTALE GOL (statistica)', getTotalScore('vigontina'), getTotalScore('opponent'), '', '']
    );

    if (goals.length > 0) {
      summaryData.push(
        [''],
        ['CRONOLOGIA GOL'],
        ['Min.', 'Tempo', 'Marcatore', 'Assist']
      );
      
      goals.forEach(goal => {
        summaryData.push([
          `${goal.minute}'`,
          goal.periodName,
          `${goal.scorer} - ${goal.scorerName}`,
          goal.assistName ? `${goal.assist} - ${goal.assistName}` : '-'
        ]);
      });
    }

    const playersData = [
      ['STATISTICHE GIOCATORI'],
      [''],
      ['Numero', 'Nome', 'Gol', 'Assist']
    ];

    players.forEach(player => {
      playersData.push([
        player.num,
        player.name,
        stats[player.num].goals,
        stats[player.num].assists
      ]);
    });

    playersData.push(
      [''],
      ['TOTALI', '', getTotalGoals(), '']
    );

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    const ws2 = XLSX.utils.aoa_to_sheet(playersData);
    
    ws1['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
    ws2['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 10 }];
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Riepilogo');
    XLSX.utils.book_append_sheet(wb, ws2, 'Giocatori');
    
    const fileName = `Vigontina_vs_${opponentName}_${matchDate.replace(/-/g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportHistoryToExcel = () => {
    if (matchHistory.length === 0) {
      alert('Nessuna partita nello storico');
      return;
    }

    const historyData = [
      ['STORICO PARTITE VIGONTINA ESORDIENTI'],
      [''],
      ['Data', 'Avversario', 'Punti', 'Gol', 'Ass. Arbitro', 'Dir. Accomp.']
    ];

    matchHistory.forEach(match => {
      const vigPoints = match.finalPoints ? match.finalPoints.vigontina : 0;
      const oppPoints = match.finalPoints ? match.finalPoints.opponent : 0;
      const vigGoals = match.totalGoals ? match.totalGoals.vigontina : (match.totalScore ? match.totalScore.vigontina : 0);
      const oppGoals = match.totalGoals ? match.totalGoals.opponent : (match.totalScore ? match.totalScore.opponent : 0);
      
      historyData.push([
        new Date(match.date).toLocaleDateString('it-IT'),
        match.opponent,
        `${vigPoints} - ${oppPoints} (pt)`,
        `${vigGoals} - ${oppGoals} (gol)`,
        match.assistantReferee,
        match.teamManager
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(historyData);
    
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Storico');
    XLSX.writeFile(wb, `Vigontina_Storico_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Goal Dialog */}
        {showGoalDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-3">
                Gol di {players.find(p => p.num === selectedScorer)?.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">Al minuto: {getCurrentMinute()}'</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Assist di:</label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedAssist(null)}
                    className={`p-2 rounded border text-sm ${
                      selectedAssist === null
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    Nessuno
                  </button>
                  {players
                    .filter(p => p.num !== selectedScorer && !notCalled.includes(p.num))
                    .map(player => (
                    <button
                      key={player.num}
                      onClick={() => setSelectedAssist(player.num)}
                      className={`p-2 rounded border text-sm ${
                        selectedAssist === player.num
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {player.num} - {player.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={confirmGoal}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Conferma
                </button>
                <button
                  onClick={() => {
                    setShowGoalDialog(false);
                    setSelectedScorer(null);
                    setSelectedAssist(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-5 mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900 flex items-center justify-center border-3 border-slate-900">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center">
                  <div className="text-center leading-none">
                    <span className="text-sm sm:text-lg font-black text-slate-900">V</span>
                    <span className="text-sm sm:text-lg font-black text-cyan-500">SP</span>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Vigontina San Paolo</h1>
                <p className="text-xs sm:text-sm text-gray-600">Esordienti 2025-2026</p>
              </div>
            </div>
          </div>

          {/* Timer */}
          {currentPeriod > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-xs text-gray-600 mb-1">Cronometro</div>
                  <div className="text-3xl font-bold text-blue-700">{formatTime(timerSeconds)}</div>
                  <div className="text-xs text-gray-600 mt-1">Minuto: {getCurrentMinute()}'</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleTimer}
                    className={`p-2 rounded ${
                      isTimerRunning 
                        ? 'bg-yellow-500 hover:bg-yellow-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-2 rounded bg-red-500 hover:bg-red-600 text-white"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={saveToFirebase}
              disabled={saving}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvo...' : 'Salva'}
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition flex items-center justify-center gap-2 text-sm"
            >
              <History className="w-4 h-4" />
              Storico ({matchHistory.length})
            </button>
            <button
              onClick={resetMatch}
              className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
            >
              Nuova Partita
            </button>
          </div>

          {showHistory && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">Storico Partite ({matchHistory.length})</h3>
                {matchHistory.length > 0 && (
                  <button
                    onClick={exportHistoryToExcel}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Esporta
                  </button>
                )}
              </div>
              {matchHistory.length === 0 ? (
                <p className="text-xs text-gray-500">Nessuna partita salvata</p>
              ) : (
                <div className="space-y-2">
                  {matchHistory.map((match) => (
                    <div key={match.id} className="bg-white p-2 rounded text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{new Date(match.date).toLocaleDateString('it-IT')}</span>
                        <span className="font-bold text-blue-600">
                          {match.finalPoints ? `${match.finalPoints.vigontina} - ${match.finalPoints.opponent}` : 
                           match.totalScore ? `${match.totalScore.vigontina} - ${match.totalScore.opponent}` : '0 - 0'} pt
                        </span>
                      </div>
                      <div className="text-gray-600">vs {match.opponent}</div>
                      {match.goals && match.goals.length > 0 && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          {match.goals.length} gol registrati
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 w-16 sm:w-20">Data:</label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 w-16 sm:w-20">Ass. arb:</label>
              <select
                value={assistantReferee}
                onChange={(e) => setAssistantReferee(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              >
                <option value="">Seleziona...</option>
                <option value="Vendramin Enrico">Vendramin Enrico</option>
                <option value="Brunazzo Enrico">Brunazzo Enrico</option>
                <option value="Campello Francesco">Campello Francesco</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                onClick={() => setCurrentPeriod(Math.max(0, currentPeriod - 1))}
                disabled={currentPeriod === 0}
                className={`p-1 rounded ${currentPeriod === 0 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-lg sm:text-xl font-bold text-blue-700 text-center min-w-[140px]">
                {periods[currentPeriod]}
              </div>
              <button
                onClick={() => setCurrentPeriod(Math.min(4, currentPeriod + 1))}
                disabled={currentPeriod === 4}
                className={`p-1 rounded ${currentPeriod === 4 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-1 justify-center">
              {periods.map((period, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPeriod(i)}
                  className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium transition ${
                    currentPeriod === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-3 sm:p-4 text-white mt-3">
            <div className="text-center">
              <div className="text-xs mb-1 opacity-90">VIGONTINA</div>
              <div className="text-3xl sm:text-4xl font-bold mb-2">{periodScores[currentPeriod].vigontina}</div>
              <div className="flex gap-1 justify-center">
                <button
                  onClick={() => updateScore('vigontina', -1)}
                  className="bg-white/20 hover:bg-white/30 p-1 rounded"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => updateScore('vigontina', 1)}
                  className="bg-white/20 hover:bg-white/30 p-1 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">VS</div>
            </div>

            <div className="text-center">
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                className="text-xs mb-1 bg-white/20 border border-white/30 rounded px-2 py-0.5 text-center w-full text-white placeholder-white/70"
              />
              <div className="text-3xl sm:text-4xl font-bold mb-2">{periodScores[currentPeriod].opponent}</div>
              <div className="flex gap-1 justify-center">
                <button
                  onClick={() => updateScore('opponent', -1)}
                  className="bg-white/20 hover:bg-white/30 p-1 rounded"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => updateScore('opponent', 1)}
                  className="bg-white/20 hover:bg-white/30 p-1 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-2 sm:p-3 mt-3">
            <div className="text-center mb-1 font-semibold text-green-800 text-xs sm:text-sm">RISULTATO FINALE (PUNTI)</div>
            <div className="flex justify-center items-center gap-3 sm:gap-6">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-0.5">Vigontina</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-700">{calculatePoints('vigontina')}</div>
              </div>
              <div className="text-xl font-bold text-gray-400">-</div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-0.5">{opponentName}</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-700">{calculatePoints('opponent')}</div>
              </div>
            </div>
            <div className="text-center mt-2 pt-2 border-t border-green-200">
              <div className="text-[10px] text-gray-500 mb-0.5">Gol totali (statistica)</div>
              <div className="text-sm font-semibold text-gray-700">
                {getTotalScore('vigontina')} - {getTotalScore('opponent')}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-1">
            {periods.map((period, i) => (
              <div key={i} className="bg-gray-50 rounded p-1 text-center">
                <div className="text-[9px] sm:text-[10px] font-medium text-gray-600 mb-0.5 leading-tight">{period}</div>
                <div className="text-xs font-bold text-gray-800">
                  {periodScores[i].vigontina}-{periodScores[i].opponent}
                </div>
              </div>
            ))}
          </div>

          {goals.length > 0 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <h4 className="text-xs font-bold text-gray-700 mb-2">🎯 Gol Segnati ({goals.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {goals.map((goal, idx) => (
                  <div key={idx} className="text-xs bg-white p-1.5 rounded flex justify-between items-center">
                    <div>
                      <span className="font-bold text-blue-600">{goal.minute}'</span>
                      {' - '}
                      <span className="font-semibold">{goal.scorerName}</span>
                      {goal.assistName && (
                        <span className="text-gray-600"> (ass: {goal.assistName})</span>
                      )}
                    </div>
                    <span className="text-gray-400 text-[10px]">{goal.periodName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="bg-white rounded-lg shadow p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <Target className="text-blue-500 w-4 h-4" />
              <span className="font-semibold text-xs sm:text-sm">Gol Totali</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{getTotalGoals()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <Users className="text-green-500 w-4 h-4" />
              <span className="font-semibold text-xs sm:text-sm">Giocatori</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{players.length - notCalled.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Statistiche Giocatori</h2>
          <div className="space-y-2">
            {players.map(player => {
              const isNotCalled = notCalled.includes(player.num);
              return (
              <div key={player.num} className={`border rounded-lg p-2 sm:p-3 ${
                isNotCalled 
                  ? 'bg-gray-100 border-gray-300 opacity-60' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                      isNotCalled ? 'bg-gray-400 text-gray-600' : 'bg-blue-600 text-white'
                    }`}>
                      {player.num}
                    </div>
                    <span className={`font-semibold text-xs sm:text-sm truncate ${isNotCalled ? 'text-gray-500' : ''}`}>
                      {player.name}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleNotCalled(player.num)}
                    className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                      isNotCalled
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    {isNotCalled ? 'Convoca' : 'N.Conv'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="text-center">
                    <div className="text-[10px] sm:text-xs text-gray-600 mb-1">⚽ Gol</div>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => removeLastGoal(player.num)}
                        disabled={isNotCalled || stats[player.num].goals === 0}
                        className={`p-0.5 rounded ${
                          isNotCalled || stats[player.num].goals === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-red-200 hover:bg-red-300 text-red-700'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`text-xl sm:text-2xl font-bold w-7 ${
                        isNotCalled ? 'text-gray-400' : 'text-blue-600'
                      }`}>
                        {stats[player.num].goals}
                      </span>
                      <button
                        onClick={() => addGoal(player.num)}
                        disabled={isNotCalled}
                        className={`p-0.5 rounded ${
                          isNotCalled 
                            ? 'bg-gray-300 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] sm:text-xs text-gray-600 mb-1">🎯 Assist</div>
                    <div className="flex items-center justify-center">
                      <span className={`text-xl sm:text-2xl font-bold w-7 ${
                        isNotCalled ? 'text-gray-400' : 'text-green-600'
                      }`}>
                        {stats[player.num].assists}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VigontinaStats;
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 w-16 sm:w-20">Dir. acc:</label>
              <select
                value={teamManager}
                onChange={(e) => setTeamManager(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              >
                <option value="">Seleziona...</option>
                <option value="Vendramin Enrico">Vendramin Enrico</option>
                <option value="Brunazzo Enrico">Brunazzo Enrico</option>
                <option value="Campello Francesco">
