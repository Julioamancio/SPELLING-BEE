import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, AlertCircle, CheckCircle } from 'lucide-react';
import { Competition, Student, ClassRoom, School, Word } from '../types';

interface Props {
  competitions: Competition[];
  students: Student[];
  classes: ClassRoom[];
  schools: School[];
  words: Word[];
}

export default function Reports({ competitions, students, classes, schools, words }: Props) {
  
  // Calculate rankings and stats
  const studentStats = useMemo(() => {
    const stats: Record<string, {
      student: Student;
      className: string;
      schoolName: string;
      totalWords: number;
      correctWords: number;
      tournamentsPlayed: number;
      tournamentsWon: number;
      runnerUp: number;
    }> = {};

    students.forEach(s => {
      const c = classes.find(cls => cls.id === s.classId);
      const sch = schools.find(sch => sch.id === c?.schoolId);
      stats[s.id] = {
        student: s,
        className: c?.name || 'Unknown',
        schoolName: sch?.name || 'Unknown',
        totalWords: 0,
        correctWords: 0,
        tournamentsPlayed: 0,
        tournamentsWon: 0,
        runnerUp: 0
      };
    });

    competitions.forEach(comp => {
      // Find students who participated (any history or in a group initially)
      const participants = new Set<string>();
      
      comp.history.forEach(h => {
        participants.add(h.studentId);
        if (stats[h.studentId]) {
          stats[h.studentId].totalWords += 1;
          if (h.isCorrect) stats[h.studentId].correctWords += 1;
        }
      });

      // Those who never got a turn but were in groups? 
      // It's safer to just iterate through initial group students.
      if (comp.groups.length > 0) {
        comp.groups.forEach(g => {
           g.studentIds.forEach(id => participants.add(id));
        });
      }

      participants.forEach(id => {
        if (stats[id]) {
          stats[id].tournamentsPlayed += 1;
        }
      });

      if (comp.winners && comp.currentPhase === 'COMPLETED') {
        if (stats[comp.winners.first]) stats[comp.winners.first].tournamentsWon += 1;
        if (stats[comp.winners.second]) stats[comp.winners.second].runnerUp += 1;
      }
    });

    return Object.values(stats).sort((a, b) => {
       // Sort by wins, then runner ups, then accuracy
       if (a.tournamentsWon !== b.tournamentsWon) return b.tournamentsWon - a.tournamentsWon;
       if (a.runnerUp !== b.runnerUp) return b.runnerUp - a.runnerUp;
       const accA = a.totalWords > 0 ? a.correctWords / a.totalWords : 0;
       const accB = b.totalWords > 0 ? b.correctWords / b.totalWords : 0;
       return accB - accA;
    });

  }, [competitions, students, classes, schools]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bento-card p-6 lg:p-10 flex items-center justify-between bg-amber-400 border-none shadow-xl shadow-amber-200">
        <div>
          <h2 className="text-3xl font-black text-amber-900 uppercase tracking-tighter mb-2">Pedagogical Reports</h2>
          <p className="text-amber-800 font-medium">Rankings, accuracy history, and student tracking.</p>
        </div>
        <Trophy className="w-16 h-16 text-amber-600 opacity-50 hidden sm:block" />
      </div>

      <div className="bento-card p-6 lg:p-10">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-2">
          <Medal className="w-5 h-5 text-amber-500" /> Global Student Ranking
        </h3>
        
        {studentStats.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-sm">
            Nenhum aluno cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Class</th>
                  <th className="p-4 text-[10px] font-black justify-center text-center text-slate-400 uppercase tracking-widest">Wins</th>
                  <th className="p-4 text-[10px] font-black text-center text-slate-400 uppercase tracking-widest hidden md:table-cell">Spelling Acc.</th>
                </tr>
              </thead>
              <tbody>
                {studentStats.map((stat, i) => (
                  <tr key={stat.student.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-900">#{i + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-sm text-slate-900">{stat.student.name}</div>
                      <div className="text-[10px] text-slate-400 sm:hidden">{stat.className}</div>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-xs font-bold text-slate-500">{stat.className}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-600 px-2 py-1 rounded-md text-xs font-bold">
                        <Trophy className="w-3 h-3" /> {stat.tournamentsWon}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-center">
                      {stat.totalWords > 0 ? (
                        <div className="flex items-center justify-center gap-2">
                          {stat.correctWords / stat.totalWords > 0.5 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-orange-500" />}
                          <span className="font-bold text-slate-700">{Math.round((stat.correctWords / stat.totalWords) * 100)}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs font-bold">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
