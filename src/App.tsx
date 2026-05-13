import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  BookOpen, 
  School as SchoolIcon, 
  ChevronRight, 
  LayoutDashboard,
  Printer,
  Settings,
  LogOut,
  FileText,
  BarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Bee } from './components/icons/Bee';
import { 
  School, 
  ClassRoom, 
  Student, 
  Word, 
  Competition, 
  Difficulty 
} from './types';
import { DEFAULT_WORDS } from './data/wordBank';

// --- Firebase Backend ---
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from './hooks/useAuth';
import { useFirestoreCollection } from './hooks/useFirestore';

// --- Views ---
import Management from './components/Management';
import WordBank from './components/WordBank';
import TournamentRunner from './components/TournamentRunner';
import Materials from './components/Materials';
import Login from './components/Login';

import Reports from './components/Reports';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'words' | 'tournament' | 'materials' | 'reports'>('dashboard');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);

  // --- Persistent State from Firestore ---
  const [schools, setSchools, schoolsLoading] = useFirestoreCollection<School>('schools', [{ id: 'csj-1', name: 'CSJ' }]);
  const [classes, setClasses, classesLoading] = useFirestoreCollection<ClassRoom>('classes', [
    { id: 'c1', schoolId: 'csj-1', name: '9° ANO A' },
    { id: 'c2', schoolId: 'csj-1', name: '9° ANO B' },
    { id: 'c3', schoolId: 'csj-1', name: '1° SÉRIE' },
    { id: 'c4', schoolId: 'csj-1', name: '2° SÉRIE' },
  ]);
  const [students, setStudents, studentsLoading] = useFirestoreCollection<Student>('students', []);
  const [words, setWords, wordsLoading] = useFirestoreCollection<Word>('words', DEFAULT_WORDS);
  const [competitions, setCompetitions, competitionsLoading] = useFirestoreCollection<Competition>('competitions', []);

  // --- Helpers ---
  const activeCompetition = useMemo(() => 
    competitions.find(c => c.id === selectedCompetitionId), 
    [competitions, selectedCompetitionId]
  );

  const stats = useMemo(() => ({
    totalSchools: schools.length,
    totalClasses: classes.length,
    totalStudents: students.length,
    totalWords: words.length,
    activeCompetitions: competitions.filter(c => c.currentPhase !== 'Completed').length
  }), [schools, classes, students, words, competitions]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'Schools & Classes', icon: SchoolIcon },
    { id: 'words', label: 'Word Bank', icon: BookOpen },
    { id: 'tournament', label: 'Tournament', icon: Trophy },
    { id: 'materials', label: 'Class Material', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart },
  ];

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-sm">Carregando Aplicação...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (schoolsLoading || classesLoading || studentsLoading || wordsLoading || competitionsLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-sm">Carregando Banco de Dados...</div>;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar - Bento Style */}
      <aside className="w-16 sm:w-20 lg:w-68 bg-white border-r border-slate-200 flex flex-col m-2 lg:m-4 rounded-[24px] lg:rounded-[40px] shadow-sm transition-all overflow-hidden shrink-0 z-30 relative">
        <div className="p-3 sm:p-4 lg:p-8 border-b border-slate-100 flex justify-center lg:justify-start">
          <div className="flex items-center justify-center gap-3 text-amber-500 lg:mb-2 w-full">
            <div className="bg-amber-400 p-2 lg:p-3 rounded-xl text-white shadow-lg shadow-amber-100 shrink-0">
              <Bee className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div className="hidden lg:block flex-1">
              <h1 className="font-black text-xl tracking-tighter text-slate-900 uppercase leading-none">SPELLING BEE</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Championship</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 sm:p-3 lg:p-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-5 lg:py-4 rounded-xl lg:rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 lg:translate-x-2' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block font-bold text-sm uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 lg:p-6 hidden lg:block">
          <div className="bg-amber-400 text-amber-900 p-6 rounded-3xl shadow-lg border-b-4 border-amber-600 mb-4">
            <p className="text-[10px] text-amber-800 font-black uppercase mb-1 tracking-widest">Active Status</p>
            <p className="text-sm font-black truncate uppercase">
              {activeCompetition ? activeCompetition.currentPhase : 'Waiting Start'}
            </p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-3 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block truncate">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pt-2 lg:pt-4 pr-2 lg:pr-4 pb-4 w-full">
        <header className="shrink-0 bg-white border border-slate-200 mx-2 lg:mx-4 mb-4 mt-0 px-4 lg:px-8 py-3 lg:py-5 flex items-center justify-between z-20 rounded-3xl shadow-sm gap-2">
          <div className="flex items-center gap-3 lg:gap-4 flex-1 overflow-hidden">
            <div className="w-2 h-6 lg:h-8 bg-amber-400 rounded-full shrink-0" />
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 uppercase tracking-tighter truncate">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
             <div className="hidden sm:flex flex-col items-end">
               <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Active School</span>
               <span className="text-sm font-bold text-slate-900">{schools[0]?.name || 'N/A'}</span>
             </div>
             <div className="hidden sm:block w-px h-8 bg-slate-100 mx-1 lg:mx-2" />
             <button className="p-2 lg:p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-100 hover:border-slate-300">
               <Settings className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2 lg:px-4 pb-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-12 gap-6"
              >
                {/* Stats Bento Grid */}
                <div className="col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-6">
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="bento-card p-6 flex flex-col justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-4">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Hero Section */}
                <div className="col-span-12 lg:col-span-8 bento-card p-6 lg:p-10 relative overflow-hidden group">
                  <div className="relative z-10 max-w-lg">
                    <div className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-3 py-1 rounded-full w-fit mb-4 tracking-widest">Tournament Center</div>
                    <h3 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 lg:mb-6 tracking-tighter uppercase leading-none">Ready to start the <span className="text-amber-500">Championship?</span></h3>
                    <p className="text-slate-500 mb-8 lg:mb-10 font-medium leading-relaxed text-sm lg:text-base">
                      Transform your classroom into an arena of language mastery. 
                      Track progress of your students down to the ultimate champion 
                      with professional dynamic brackets and tiered difficulty words.
                    </p>
                    <button 
                      onClick={() => setActiveTab('tournament')}
                      className="w-full sm:w-auto px-6 lg:px-10 py-4 lg:py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] lg:text-xs hover:bg-slate-800 transition-all shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 group/btn"
                    >
                      Start Tournament <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  <div className="absolute -bottom-16 -right-16 w-60 h-60 lg:w-80 lg:h-80 bg-slate-50 rounded-full flex items-center justify-center -rotate-12 transition-transform group-hover:scale-110 duration-700 opacity-50 lg:opacity-100">
                    <Bee className="w-32 h-32 lg:w-48 lg:h-48 text-slate-100" />
                  </div>
                </div>

                {/* Word Distribution Bento */}
                <div className="col-span-12 lg:col-span-4 bento-card p-8 bg-slate-900 text-white border-none shadow-2xl shadow-slate-400 flex flex-col">
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-8 text-amber-400">Phase Difficulty</h3>
                  <div className="space-y-8 flex-1">
                     {[
                       { label: 'Easy Phase', count: words.filter(w => w.difficulty === Difficulty.EASY).length, color: 'bg-green-400', textColor: 'text-green-400', shadowColor: 'shadow-[0_0_12px_rgba(74,222,128,0.3)]', total: 40 },
                       { label: 'Medium Phase', count: words.filter(w => w.difficulty === Difficulty.MEDIUM).length, color: 'bg-orange-500', textColor: 'text-orange-500', shadowColor: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]', total: 35 },
                       { label: 'Hard Phase', count: words.filter(w => w.difficulty === Difficulty.HARD).length, color: 'bg-red-500', textColor: 'text-red-500', shadowColor: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]', total: 25 },
                     ].map(diff => (
                       <div key={diff.label}>
                          <div className="flex justify-between text-[10px] font-black mb-3 tracking-widest uppercase">
                            <span className="text-slate-400">{diff.label}</span>
                            <span className={diff.textColor}>{diff.count} / {diff.total}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(diff.count / diff.total) * 100}%` }}
                              className={`h-full ${diff.color} ${diff.shadowColor}`} 
                            />
                          </div>
                       </div>
                     ))}
                  </div>
                  <button 
                    onClick={() => setActiveTab('words')}
                    className="w-full mt-10 py-4 bg-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-300 hover:text-white transition-colors border border-slate-700"
                  >
                    Manage Repository
                  </button>
                </div>

                {/* Sub Bento Items */}
                <div className="col-span-12 lg:col-span-7 bento-card p-8">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-black uppercase tracking-tighter">Recent Activities</h3>
                      <button 
                        onClick={() => setActiveTab('tournament')}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors underline underline-offset-4"
                      >
                        See All
                      </button>
                   </div>
                   {competitions.length === 0 ? (
                     <div className="text-center py-20 text-slate-200">
                       <LayoutDashboard className="w-16 h-16 mx-auto mb-4" />
                       <p className="font-black uppercase tracking-widest text-[10px]">No history available</p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        {competitions.slice(0, 4).map(c => (
                          <div key={c.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group transition-all cursor-pointer hover:bg-white hover:border-amber-200">
                            <div className="flex items-center gap-5">
                              <div className={`w-3 h-3 rounded-full ${c.currentPhase === 'Completed' ? 'bg-green-500' : 'bg-amber-500'} shadow-sm shadow-amber-200`} />
                              <div>
                                <p className="font-black text-slate-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{
                                  c.classIds.map(id => classes.find(cl => cl.id === id)?.name).filter(Boolean).join(', ') || 'Unknown Class'
                                }</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.currentPhase}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        ))}
                     </div>
                   )}
                </div>

                <div className="col-span-12 lg:col-span-5 bento-card p-8 bg-amber-400 border-none shadow-2xl shadow-amber-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-amber-900 uppercase tracking-tighter mb-4">Printable Assets</h3>
                    <p className="text-amber-800 text-sm font-medium leading-relaxed mb-8">
                      Need physical materials for the class? Export rules, word lists, 
                      and the tournament bracket to a high-quality PDF.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('materials')}
                    className="w-full py-5 bg-amber-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-950 transition-all flex items-center justify-center gap-3"
                  >
                    <Printer className="w-5 h-5" /> Export Material
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'classes' && (
              <Management 
                schools={schools} 
                setSchools={setSchools}
                classes={classes}
                setClasses={setClasses}
                students={students}
                setStudents={setStudents}
              />
            )}

            {activeTab === 'words' && (
              <WordBank 
                words={words}
                setWords={setWords}
              />
            )}

            {activeTab === 'tournament' && (
              <TournamentRunner 
                schools={schools}
                classes={classes}
                students={students}
                words={words}
                competitions={competitions}
                setCompetitions={setCompetitions}
                onSelectComp={setSelectedCompetitionId}
              />
            )}

            {activeTab === 'materials' && (
              <Materials 
                words={words}
              />
            )}

            {activeTab === 'reports' && (
              <Reports
                competitions={competitions}
                students={students}
                classes={classes}
                schools={schools}
                words={words}
              />
            )}
          </AnimatePresence>
          <footer className="pt-8 pb-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Feito por Júlio Amâncio @todos os direitos reservados - 2026
          </footer>
        </div>
      </main>
    </div>
  );
}
