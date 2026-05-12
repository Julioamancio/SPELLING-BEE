import React, { useState, useMemo, useEffect } from 'react';
import { Users, Play, Pause, ChevronRight, CheckCircle2, XCircle, SkipForward, ArrowLeft, Flame, Trash2, RotateCcw } from 'lucide-react';
import { Bee } from './icons/Bee';
import { motion, AnimatePresence } from 'motion/react';
import { PrintableAssets } from './PrintableAssets';
import { 
  School, 
  ClassRoom, 
  Student, 
  Word, 
  Competition, 
  CompetitionPhase, 
  Group, 
  Difficulty 
} from '../types';

interface Props {
  schools: School[];
  classes: ClassRoom[];
  students: Student[];
  words: Word[];
  competitions: Competition[];
  setCompetitions: React.Dispatch<React.SetStateAction<Competition[]>>;
  onSelectComp: (id: string) => void;
}

export default function TournamentRunner({ 
  schools, 
  classes, 
  students, 
  words, 
  competitions, 
  setCompetitions,
  onSelectComp
}: Props) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [activeCompId, setActiveCompId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [sessionHistory, setSessionHistory] = useState<Competition['history']>([]);
  const [eliminatedStudentName, setEliminatedStudentName] = useState<string | null>(null);
  const [wordSeed, setWordSeed] = useState(0);

  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);

  // Elimination modal state
  const [studentToEliminate, setStudentToEliminate] = useState<Student | null>(null);
  const [eliminationStep, setEliminationStep] = useState<0 | 1 | 2>(0);

  const activeComp = competitions.find(c => c.id === activeCompId);
  const activeGroup = activeComp?.groups.find(g => g.id === activeGroupId);
  const currentStudents = useMemo(() => {
    if (!activeGroup || !activeComp) return [];
    return activeGroup.studentIds.filter(id => !activeComp.eliminatedStudentIds.includes(id));
  }, [activeGroup, activeComp]);

  const currentStudent = currentStudents[currentStudentIndex] 
    ? students.find(s => s.id === currentStudents[currentStudentIndex])
    : null;

  const currentWord = useMemo(() => {
    const difficultyLevel = 
      activeComp?.currentPhase === CompetitionPhase.PHASE_1 ? Difficulty.EASY :
      activeComp?.currentPhase === CompetitionPhase.FINAL ? Difficulty.HARD :
      Difficulty.MEDIUM;
    
    const pool = words.filter(w => w.difficulty === difficultyLevel);
    if (pool.length === 0) return null;
    
    // Use wordSeed to change the word
    return pool[(wordSeed + Math.floor(Math.random() * pool.length)) % pool.length];
  }, [activeComp?.currentPhase, words, wordSeed, activeGroupId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && activeGroupId && currentStudent && timeLeft > 0 && eliminationStep === 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeGroupId, currentStudent, timeLeft, eliminationStep]);

  useEffect(() => {
    setTimeLeft(30);
    setIsPlaying(false);
  }, [currentStudent?.id, activeGroup?.id, wordSeed]);

  const initTournament = () => {
    if (selectedClassIds.length === 0) return;
    const classStudents = students.filter(s => selectedClassIds.includes(s.classId));
    
    // We need at least 2 students for a tournament
    if (classStudents.length < 2) {
      alert("Para este formato, você precisa de pelo menos 2 alunos cadastrados no total das turmas selecionadas.");
      return;
    }

    // Fisher-Yates Shuffle
    const shuffled = [...classStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Dynamic grouping: max 4 per group
    const size = 4;
    const numGroups = Math.ceil(shuffled.length / size);
    
    const groups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
        id: crypto.randomUUID(),
        name: `Group ${String.fromCharCode(65 + i)}`,
        studentIds: [],
        classifiedIds: []
    }));

    shuffled.forEach((student, index) => {
        groups[index % numGroups].studentIds.push(student.id);
    });

    const newComp: Competition = {
        id: crypto.randomUUID(),
        classIds: selectedClassIds,
        schoolId: classes.find(c => c.id === selectedClassIds[0])?.schoolId || schools[0]?.id || '',
        currentPhase: CompetitionPhase.PHASE_1 as any, // using string logic next
        groups: groups,
        eliminatedStudentIds: [],
        history: []
    };

    setCompetitions([...competitions, newComp]);
    setActiveCompId(newComp.id);
    onSelectComp(newComp.id);
  };

  const deleteCompetition = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this competition?')) {
      setCompetitions(c => c.filter(comp => comp.id !== id));
      if (activeCompId === id) {
        setActiveCompId(null);
      }
    }
  };

  const clearHistory = () => {
    if(window.confirm('Are you sure you want to clear all tournament history?')) {
      setCompetitions([]);
      setActiveCompId(null);
    }
  };

  const getPhaseColors = (phase: any) => {
    if (phase === CompetitionPhase.PHASE_1) return { text: 'text-green-500', bg: 'bg-green-500', shadow: 'shadow-green-500', pulse: 'bg-green-400 shadow-green-400' };
    if (phase === CompetitionPhase.FINAL) return { text: 'text-red-500', bg: 'bg-red-500', shadow: 'shadow-red-500', pulse: 'bg-red-400 shadow-red-400' };
    if (phase === CompetitionPhase.COMPLETED) return { text: 'text-amber-500', bg: 'bg-amber-500', shadow: 'shadow-amber-500', pulse: 'bg-amber-400 shadow-amber-400' };
    return { text: 'text-orange-500', bg: 'bg-orange-500', shadow: 'shadow-orange-500', pulse: 'bg-orange-400 shadow-orange-400' };
  };

  const toggleSuddenDeath = () => {
      if (!activeComp) return;
      const updatedComp = { ...activeComp, isSuddenDeath: !activeComp.isSuddenDeath };
      const newComps = competitions.map(c => c.id === activeComp.id ? updatedComp : c);
      setCompetitions(newComps);
  };

  const requestEliminate = (student: Student) => {
    setStudentToEliminate(student);
    setEliminationStep(1);
  };

  const confirmElimination = () => {
    if (eliminationStep === 1) {
      setEliminationStep(2); // Ask a second time
    } else if (eliminationStep === 2 && studentToEliminate && activeComp && activeGroup) {
      // Execute elimination
      executeElimination(studentToEliminate);
      setEliminationStep(0);
      setStudentToEliminate(null);
    }
  };

  const executeElimination = (student: Student) => {
    if (!activeComp || !activeGroup) return;

    setEliminatedStudentName(student.name);
    setTimeout(() => setEliminatedStudentName(null), 2500);

    const historyItem = {
        round,
        studentId: student.id,
        wordId: currentWord?.id || 'skipped',
        isCorrect: false,
        phase: activeComp.currentPhase
    };

    let updatedEliminated = [...activeComp.eliminatedStudentIds];
    updatedEliminated.push(student.id);

    // Check if group is finished
    const remainingInGroup = activeGroup.studentIds.filter(id => !updatedEliminated.includes(id));
    
    let updatedGroups = activeComp.groups.map(g => {
        if (g.id === activeGroupId) {
            // Target is 2 students per group, except for the final which is 1
            const target = activeComp.groups.length === 1 ? 1 : 2;
            if (remainingInGroup.length <= target) {
                return { ...g, classifiedIds: remainingInGroup };
            }
        }
        return g;
    });

    const isGroupFinished = updatedGroups.find(g => g.id === activeGroupId)?.classifiedIds.length !== undefined && updatedGroups.find(g => g.id === activeGroupId)!.classifiedIds.length > 0;

    const updatedComp = {
        ...activeComp,
        history: [...activeComp.history, historyItem],
        eliminatedStudentIds: updatedEliminated,
        groups: updatedGroups
    };

    const newComps = competitions.map(c => c.id === activeCompId ? updatedComp : c);
    setCompetitions(newComps);

    if (isGroupFinished) {
        setActiveGroupId(null);
        setCurrentStudentIndex(0);
        setRound(1);
        setWordSeed(0);
    } else {
        const eliminatedIdx = currentStudents.findIndex(id => id === student.id);
        const isCurrentStudentEliminated = eliminatedIdx === currentStudentIndex;
        
        if (isCurrentStudentEliminated) {
            if (currentStudentIndex >= currentStudents.length - 1) {
                setCurrentStudentIndex(0);
                setRound(r => r + 1);
            }
            setWordSeed(s => s + 1);
        } else {
            if (eliminatedIdx < currentStudentIndex) {
                setCurrentStudentIndex(currentStudentIndex - 1);
            }
        }
    }
  };

  const handleCorrect = () => {
      // Manual tick for next round / next student
      const nextIdx = (currentStudentIndex + 1) % currentStudents.length;
      setCurrentStudentIndex(nextIdx);
      if (nextIdx === 0) setRound(r => r + 1);
      setWordSeed(s => s + 1);
  };

  const advancePhase = () => {
    if (!activeComp) return;

    let nextPhase: any;
    let nextGroups: Group[] = [];
    const qualified = activeComp.groups.flatMap(g => g.classifiedIds);

    // Fisher-Yates Shuffle the qualified students so the new groups are arranged randomly!
    const shuffledQualified = [...qualified];
    for (let i = shuffledQualified.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQualified[i], shuffledQualified[j]] = [shuffledQualified[j], shuffledQualified[i]];
    }

    if (activeComp.currentPhase === CompetitionPhase.FINAL) {
        nextPhase = CompetitionPhase.COMPLETED;
        nextGroups = activeComp.groups;
    } else {
        const size = 4;
        const numGroups = Math.ceil(shuffledQualified.length / size);

        if (numGroups > 1) {
            nextPhase = numGroups === 2 ? CompetitionPhase.SEMIFINAL : `Phase (Top ${shuffledQualified.length})` as any;
            
            const newGroups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
                id: crypto.randomUUID(),
                name: numGroups === 2 ? `Semifinal ${i + 1}` : `Group ${String.fromCharCode(65 + i)}`,
                studentIds: [],
                classifiedIds: []
            }));

            shuffledQualified.forEach((studentId, index) => {
                newGroups[index % numGroups].studentIds.push(studentId);
            });
            nextGroups = newGroups;
        } else {
            nextPhase = CompetitionPhase.FINAL;
            nextGroups.push({
                id: crypto.randomUUID(),
                name: 'Grand Final',
                studentIds: shuffledQualified,
                classifiedIds: []
            });
        }
    }

    const updatedComp: Competition = {
        ...activeComp,
        currentPhase: nextPhase,
        groups: nextGroups,
        winners: nextPhase === CompetitionPhase.COMPLETED ? {
            first: qualified[0],
            second: activeComp.eliminatedStudentIds[activeComp.eliminatedStudentIds.length - 1]
        } : undefined
    };

    setCompetitions(competitions.map(c => c.id === activeCompId ? updatedComp : c));
  };

  if (!activeCompId) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 md:space-y-12 pb-20">
        <div className="text-center space-y-4 md:space-y-6">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-100 text-amber-500 rounded-[24px] md:rounded-[32px] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-amber-50">
            <Bee className="w-10 h-10 md:w-12 md:h-12" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">Launch Arena</h2>
          <p className="text-slate-400 font-medium leading-relaxed px-4">Select one or more classes to start the Spelling Bee. The system will generate groups dynamically based on the total number of students.</p>
        </div>

        <div className="bento-card p-6 md:p-10 space-y-8 md:space-y-10">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 md:mb-5 tracking-widest px-2">Select Active Classes</label>
            <div className="space-y-3 md:space-y-4">
              {classes.map(cls => {
                const isSelected = selectedClassIds.includes(cls.id);
                return (
                <button
                  key={cls.id}
                  onClick={() => {
                      if (isSelected) {
                          setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                      } else {
                          setSelectedClassIds([...selectedClassIds, cls.id]);
                      }
                  }}
                  className={`w-full flex items-center justify-between p-4 md:p-6 rounded-[24px] md:rounded-[28px] border-2 transition-all group ${
                    isSelected
                    ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-50' 
                    : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="text-left">
                    <p className={`font-black uppercase tracking-tight ${isSelected ? 'text-amber-900' : 'text-slate-900'}`}>{cls.name}</p>
                    <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`}>
                      {students.filter(s => s.classId === cls.id).length} Students Enrolled
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-amber-400 text-white' : 'bg-slate-50 text-slate-200'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </button>
              )})}
            </div>
          </div>
          <button 
            disabled={selectedClassIds.length === 0}
            onClick={initTournament}
            className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 disabled:opacity-20 disabled:shadow-none transition-all shadow-2xl shadow-slate-300 flex items-center justify-center gap-4 group"
          >
            <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" /> Initialize Arena
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
           <div className="p-4 lg:p-6 bg-amber-400 rounded-3xl border-b-4 border-amber-600">
             <p className="text-[10px] font-black text-amber-800 uppercase mb-2 tracking-widest">Dynamic Format</p>
             <p className="text-base lg:text-lg font-black text-amber-900 uppercase tracking-tight">Auto-balanced Grid</p>
           </div>
           <div className="p-4 lg:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">System Status</p>
             <p className="text-base lg:text-lg font-black text-slate-900 uppercase tracking-tight">Stage Ready</p>
           </div>
        </div>

        {competitions.length > 0 && (
          <div className="bento-card p-6 lg:p-10 space-y-6">
            <div className="border-b border-slate-100 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                 <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Tournament History</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Past and Ongoing Competitions</p>
               </div>
               <button
                 onClick={clearHistory}
                 className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full sm:w-auto"
               >
                 <Trash2 className="w-4 h-4" /> Clear All
               </button>
            </div>
            
            <div className="space-y-4">
              {[...competitions].reverse().map(comp => {
                const clsName = comp.classIds.map(id => classes.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'Unknown Class';
                const isCompleted = comp.currentPhase === CompetitionPhase.COMPLETED;
                const winner = isCompleted ? students.find(s => s.id === comp.winners?.first)?.name : null;

                return (
                  <div key={comp.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[24px] hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 transition-all">
                    <div className="mb-4 sm:mb-0">
                      <p className="font-black text-slate-900 uppercase tracking-tight text-lg">{clsName}</p>
                      <p className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${getPhaseColors(comp.currentPhase).text}`}>{comp.currentPhase}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {isCompleted ? (
                        <div className="flex flex-col sm:items-end">
                          <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1 flex items-center gap-1.5">
                            <Bee className="w-3.5 h-3.5" /> Champion
                          </span>
                          <span className="font-black text-sm text-slate-900 uppercase tracking-tight bg-amber-100 px-4 py-1.5 rounded-full inline-block">
                            {winner || 'Unknown'}
                          </span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setActiveCompId(comp.id);
                            onSelectComp(comp.id);
                          }}
                          className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-colors flex items-center gap-3 shadow-xl shadow-slate-200"
                        >
                          <Play className="w-3 h-3 fill-current" /> Resume 
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => deleteCompetition(e, comp.id)}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                        title="Delete Competition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeComp.currentPhase === CompetitionPhase.COMPLETED) {
      const winner = students.find(s => s.id === activeComp.winners?.first);
      return (
          <div className="max-w-2xl mx-auto text-center space-y-12 py-20 pb-40">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-amber-400 blur-[80px] opacity-30" />
                  <Bee className="w-48 h-48 text-amber-500 mx-auto drop-shadow-2xl relative z-10" />
                </div>
              </motion.div>
              <div className="space-y-6">
                  <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">The Ultimate <br/><span className="text-amber-500 underline decoration-4 md:decoration-8 underline-offset-8">Champion</span></h2>
                  <div className="py-10 bg-slate-900 border-4 border-slate-900 rounded-[40px] inline-block px-12 md:px-24 shadow-2xl shadow-slate-300">
                      <p className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">{winner?.name}</p>
                  </div>
              </div>
              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={() => setActiveCompId(null)}
                  className="px-12 py-6 bg-slate-100 text-slate-900 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all border border-slate-200"
                >
                  Return to Dashboard
                </button>
              </div>
          </div>
      );
  }

  const allGroupsFinished = activeComp.groups.every(g => g.classifiedIds.length > 0);

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-2 lg:px-6 print:hidden">
        <AnimatePresence>
        {eliminatedStudentName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-red-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative z-10 bg-slate-900 border-4 border-red-500 p-16 rounded-[60px] text-center shadow-[0_0_100px_rgba(239,68,68,0.4)] flex flex-col items-center max-w-2xl w-full"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="w-32 h-32 bg-red-500/20 rounded-[32px] flex items-center justify-center mb-8 rotate-12"
              >
                 <XCircle className="w-16 h-16 text-red-500" />
              </motion.div>
              <p className="text-red-500 font-black tracking-[0.2em] sm:tracking-[0.4em] uppercase text-xs sm:text-sm mb-4 bg-red-500/10 px-4 sm:px-6 py-2 rounded-full">Eliminated</p>
              <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter mb-4 italic px-4">{eliminatedStudentName}</h3>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-6">Great effort, but the word was misspelled.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tournament Progress Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm sticky top-24 z-10 print:hidden">
        <div className="flex items-center gap-6">
           <button 
            onClick={() => setActiveCompId(null)}
            className="p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100"
           >
              <ArrowLeft className="w-6 h-6 text-slate-400" />
           </button>
           <div>
             <div className="flex items-center gap-3 mb-1">
               <div className={`w-2 h-2 rounded-full animate-pulse shadow-sm ${getPhaseColors(activeComp.currentPhase).pulse}`} />
               <h2 className={`text-2xl font-black uppercase tracking-tighter ${getPhaseColors(activeComp.currentPhase).text}`}>{activeComp.currentPhase}</h2>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arena Live Stream • Match Controller</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
          {activeComp.currentPhase === CompetitionPhase.FINAL && (
            <button
              onClick={toggleSuddenDeath}
              className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${
                activeComp.isSuddenDeath 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse' 
                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              {activeComp.isSuddenDeath ? 'Sudden Death Active' : 'Sudden Death'}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            Export PDF
          </button>
          
          {allGroupsFinished && (
             <button 
              onClick={advancePhase}
              className="px-8 py-4 bg-amber-400 text-amber-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 shadow-xl shadow-amber-100 flex items-center gap-3 border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all"
             >
               Advance Arena <SkipForward className="w-4 h-4" />
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Groups List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Competition Brackets</h3>
            <span className="text-[10px] font-black text-amber-500 uppercase">{activeComp.groups.length} Groups</span>
          </div>
          <div className="space-y-4">
            {activeComp.groups.map(group => (
              <div 
                key={group.id}
                onClick={() => group.classifiedIds.length === 0 && setActiveGroupId(group.id)}
                className={`p-6 rounded-[36px] border-2 transition-all cursor-pointer group ${
                  activeGroupId === group.id ? 'border-amber-400 bg-amber-50 shadow-2xl shadow-amber-100' : 
                  group.classifiedIds.length > 0 ? 'bg-slate-900 text-white border-transparent' : 'bg-white hover:border-slate-200 border-slate-50'
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <span className="font-black text-xl uppercase tracking-tight">{group.name}</span>
                  {group.classifiedIds.length > 0 ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Finished</span>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeGroupId === group.id ? 'text-amber-600' : 'text-slate-300'}`}>
                      {group.studentIds.length} Participants
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                   {group.studentIds.map(sid => {
                     const s = students.find(x => x.id === sid);
                     const isEliminated = activeComp.eliminatedStudentIds.includes(sid);
                     const isClassified = group.classifiedIds.includes(sid);
                     return (
                       <div key={sid} className="flex items-center justify-between">
                         <span className={`text-sm font-bold uppercase tracking-tight ${
                           isEliminated ? 'text-slate-300 line-through opacity-50' : 
                           isClassified ? 'text-amber-400' : 
                           activeGroupId === group.id ? 'text-slate-900' : 
                           group.classifiedIds.length > 0 ? 'text-slate-500' : 'text-slate-700'
                         }`}>
                           {s?.name}
                         </span>
                         {isClassified && <div className="w-2 h-2 bg-amber-400 rounded-full" />}
                         {isEliminated && <XCircle className="w-4 h-4 text-red-500/30" />}
                       </div>
                     );
                   })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competition Area */}
        <div className="lg:col-span-8">
           {activeGroup ? (
              <div className={`bento-card p-12 lg:p-20 text-center space-y-12 sticky top-60 text-white border border-transparent shadow-2xl overflow-hidden transition-all duration-700 ${
                activeComp.isSuddenDeath 
                  ? 'bg-red-950 shadow-[0_0_80px_rgba(239,68,68,0.3)] shadow-red-500/20' 
                  : 'bg-slate-900 shadow-slate-400'
              }`}>
                <div className={`absolute top-0 right-0 w-80 h-80 opacity-10 blur-[120px] pointer-events-none transition-colors duration-700 ${
                  activeComp.isSuddenDeath ? 'bg-red-500' : 'bg-amber-400'
                }`} />
                <div className={`absolute bottom-0 left-0 w-80 h-80 opacity-10 blur-[120px] pointer-events-none transition-colors duration-700 ${
                  activeComp.isSuddenDeath ? 'bg-orange-500' : 'bg-transparent'
                }`} />
                
                <div className="space-y-4 relative z-10">
                  <div className={`text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full w-fit mx-auto mb-6 transition-colors ${
                    activeComp.isSuddenDeath ? 'bg-red-500/20 text-red-400' : 'bg-amber-400/10 text-amber-400'
                  }`}>
                    {activeGroup.name} • Control Board
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none">Select to Eliminate</h3>
                  <p className="text-slate-400 font-medium">Click on a student below if they misspell the word.</p>
                </div>

                {/* Random word display */}
                <div className="py-8 bg-slate-800/50 rounded-3xl border-2 border-slate-700 relative z-10 flex flex-col sm:flex-row items-center justify-between px-8 gap-4">
                  <div className="text-left flex-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Suggestion Word</p>
                    {currentWord ? (
                      <div>
                        <h4 className="text-3xl font-black uppercase text-amber-400 tracking-tighter">{currentWord.text}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-mono text-slate-400">/{currentWord.pronunciation}/</p>
                          <span className="w-1 h-1 bg-slate-600 rounded-full" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[200px]">{currentWord.meaning}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No words available for this difficulty.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setTimeLeft(30);
                        setIsPlaying(false);
                      }}
                      className="shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-slate-700/50 hover:bg-slate-700 hover:text-white text-slate-400 transition-all border-2 border-transparent hover:border-slate-500"
                      title="Reset Timer"
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl transition-all border-2 ${
                        isPlaying 
                        ? 'bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-200' 
                        : 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200'
                      }`}
                      title={isPlaying ? "Pause Timer" : "Start Timer"}
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>
                    <div className={`flex flex-col items-center justify-center w-16 h-16 shrink-0 rounded-2xl border-2 transition-colors ${timeLeft <= 10 ? 'bg-red-900/50 text-red-400 border-red-500/50' : 'bg-slate-700/50 text-slate-300 border-slate-600/50'}`}>
                      <span className="text-2xl font-black">{timeLeft}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider">sec</span>
                    </div>
                    <button 
                      onClick={handleCorrect}
                      className="shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-slate-700/50 hover:bg-slate-700 hover:text-white text-slate-400 transition-all border-2 border-transparent hover:border-slate-500"
                      title="Next Turn"
                    >
                      <SkipForward className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Students list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  {activeGroup.studentIds.map(sid => {
                    const student = students.find(s => s.id === sid);
                    const isEliminated = activeComp.eliminatedStudentIds.includes(sid);
                    const isCurrent = currentStudent?.id === sid && !isEliminated;
                    
                    return (
                      <button
                        key={sid}
                        disabled={isEliminated}
                        onClick={() => student && requestEliminate(student)}
                        className={`p-6 rounded-3xl border-2 text-left transition-all ${
                          isEliminated 
                          ? 'border-red-900/30 bg-red-900/10 opacity-50 cursor-not-allowed' 
                          : isCurrent
                          ? 'border-amber-400 bg-slate-800 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/50 scale-105'
                          : 'border-slate-700 bg-slate-800 hover:border-amber-400 hover:bg-slate-800 hover:scale-105 active:scale-95'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isEliminated ? 'bg-red-900/50 text-red-400' 
                            : isCurrent ? 'bg-amber-400 text-amber-900'
                            : 'bg-slate-700 text-slate-300'
                          }`}>
                            {isEliminated ? <XCircle className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className={`font-black uppercase tracking-tight ${
                              isEliminated ? 'text-red-300 line-through' 
                              : isCurrent ? 'text-amber-400'
                              : 'text-slate-100'
                            }`}>
                              {student?.name || 'Unknown'}
                            </p>
                            <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mt-1">
                              {isEliminated ? 'Eliminated' : isCurrent ? 'Spelling Now' : 'Active'}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Confirm Elimination Modal */}
                <AnimatePresence>
                  {eliminationStep > 0 && studentToEliminate && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm rounded-[56px] border border-slate-700">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-slate-800 border-2 border-red-500/50 p-8 rounded-[40px] text-center max-w-sm w-full shadow-2xl"
                      >
                        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8" />
                        </div>
                        
                        {eliminationStep === 1 ? (
                          <>
                            <h4 className="text-2xl font-black uppercase text-white tracking-tight mb-2">Eliminate Student?</h4>
                            <p className="text-slate-400 text-sm mb-8">Are you sure you want to eliminate <span className="text-amber-400 font-bold">{studentToEliminate.name}</span>?</p>
                          </>
                        ) : (
                          <>
                            <h4 className="text-2xl font-black uppercase text-red-400 tracking-tight mb-2">Final Confirmation</h4>
                            <p className="text-slate-400 text-sm mb-8">Please confirm again. <span className="text-amber-400 font-bold">{studentToEliminate.name}</span> will be permanently eliminated from this phase.</p>
                          </>
                        )}
                        
                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={confirmElimination}
                            className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                              eliminationStep === 1 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                            }`}
                          >
                            {eliminationStep === 1 ? 'Yes, Eliminate' : 'Confirm Disqualification'}
                          </button>
                          <button 
                            onClick={() => { setEliminationStep(0); setStudentToEliminate(null); }}
                            className="py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between pt-10 border-t border-slate-800/50 text-slate-500 font-black uppercase text-[9px] tracking-widest relative z-10 transition-colors">
                   <span className={activeComp.isSuddenDeath ? 'text-red-400' : ''}>
                     Match Arena Live {activeComp.isSuddenDeath && '• SUDDEN DEATH'}
                   </span>
                   <div className="flex items-center gap-4">
                      <span className={activeComp.currentPhase === CompetitionPhase.FINAL ? (activeComp.isSuddenDeath ? "text-red-500 font-bold animate-pulse" : "text-amber-500 font-bold") : ""}>
                        {activeComp.currentPhase === CompetitionPhase.FINAL ? "Finale" : `Round ${round}`}
                      </span>
                   </div>
                </div>
              </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center bg-white rounded-[60px] border-4 border-dashed border-slate-100 p-20 text-center text-slate-300 group hover:border-amber-100 transition-all">
               <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                 <Play className="w-12 h-12 text-slate-200 group-hover:text-amber-300" />
               </div>
               <p className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-4 opacity-10 group-hover:opacity-100 transition-opacity">Select an Active Bracket</p>
               <p className="max-w-xs font-medium text-slate-400">Click on a group on the left to start the spelling match for those participants.</p>
             </div>
           )}
        </div>
      </div>
    </div>
    <PrintableAssets 
      competition={activeComp}
      students={students}
      words={words}
      classes={classes}
    />
    </>
  );
}
