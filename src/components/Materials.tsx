import React, { useState } from 'react';
import { Printer, Download, Book, List, MessageCircle, FileText, Users, School } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Word, Difficulty } from '../types';
import { RULES_PT, RULES_EN, TEACHER_PHRASES } from '../data/constants';

interface Props {
  words: Word[];
}

export default function Materials({ words }: Props) {
  const [className, setClassName] = useState('7th Grade - Group A');
  const [studentCount, setStudentCount] = useState(24);
  const [groupSize, setGroupSize] = useState(4);

  const handlePrint = () => {
    window.print();
  };

  const generateRulesPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11);
    doc.text("Spelling Bee Championship Rules", 105, y, { align: "center" });
    y += 20;

    // EN Rules
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Competition Rules (EN)", 20, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    RULES_EN.forEach((rule, i) => {
      const textLines = doc.splitTextToSize(`${i + 1}. ${rule}`, 170);
      doc.text(textLines, 20, y);
      y += 8 * textLines.length;
    });

    y += 15;

    // PT Rules
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Regras da Competição (PT)", 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    RULES_PT.forEach((rule, i) => {
      const textLines = doc.splitTextToSize(`${i + 1}. ${rule}`, 170);
      doc.text(textLines, 20, y);
      y += 8 * textLines.length;
    });

    doc.save("Spelling_Bee_Rules.pdf");
  };

  const generatePhases = (total: number, size: number) => {
    if (total <= 2) {
      return [{ phase: "Final", students: total, organization: "1 on 1", qualified: "Champion", words: "All" }];
    }
    
    let current = total;
    const phases = [];
    let phaseNum = 1;
    const phaseNames = ["1st Phase", "2nd Phase", "3rd Phase", "4th Phase", "5th Phase"];
    
    // First phases
    while (current > 6) {
      const numGroups = Math.ceil(current / size);
      const qual = numGroups * 2;
      phases.push({
        phase: phaseNames[phaseNum - 1] || `${phaseNum}th Phase`,
        students: current,
        organization: `${numGroups} groups of ~${Math.ceil(current / numGroups)}`,
        qualified: `${qual} students (2 per group)`,
        words: phaseNum === 1 ? "Easy" : "Easy & Medium"
      });
      current = qual;
      phaseNum++;
    }
    
    // Semifinal
    if (current > 2) {
      phases.push({
        phase: "Semifinal",
        students: current,
        organization: `2 groups of ~${Math.ceil(current / 2)}`,
        qualified: `2 finalists (1 per group)`,
        words: "Medium & Hard"
      });
      current = 2;
    }
    
    // Final
    phases.push({
      phase: "Final",
      students: current,
      organization: "1 on 1",
      qualified: "Champion",
      words: "Hard & Sudden Death"
    });
    
    return phases;
  };

  const dynamicPhases = generatePhases(studentCount, groupSize);

  const easyCount = words.filter(w => w.difficulty === Difficulty.A1).length;
  const mediumCount = words.filter(w => w.difficulty === Difficulty.B1).length;
  const hardCount = words.filter(w => w.difficulty === Difficulty.C1).length;

  return (
    <div className="space-y-8 pb-20 px-2 lg:px-6">
      {/* Settings Bar */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm no-print space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Document Configuration</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Adjust parameters to generate tournament brackets automatically</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <School className="w-3 h-3" /> Class Name / Turma
             </label>
             <input type="text" value={className} onChange={e => setClassName(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 font-bold text-slate-700 outline-none transition-all uppercase tracking-tight"
                placeholder="Ex: 8º Ano A"
             />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Users className="w-3 h-3" /> Total Students / Alunos
             </label>
             <input type="number" min="2" max="200" value={studentCount} onChange={e => setStudentCount(Number(e.target.value) || 2)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 font-black text-xl text-slate-900 outline-none transition-all"
             />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Users className="w-3 h-3" /> Preferred Group Size
             </label>
             <input type="number" min="2" max="10" value={groupSize} onChange={e => setGroupSize(Number(e.target.value) || 4)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 font-black text-xl text-slate-900 outline-none transition-all"
             />
          </div>
        </div>
      </div>

      {/* Action Bar - Bento Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-24 z-20 no-print gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Physical Resource Center</h3>
          <p className="text-sm text-slate-400 font-medium">Export guidelines, rules, and word lists for the physical classroom.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={generateRulesPDF}
            className="px-8 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <Download className="w-5 h-5 text-slate-400" /> Download Rules PDF
          </button>
          <button 
            onClick={handlePrint}
            className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-300"
          >
            <Printer className="w-5 h-5 text-amber-400" /> Export Championship Kit
          </button>
        </div>
      </div>

      {/* Printable Area - Polished Document Design */}
      <div className="bg-white p-16 lg:p-24 shadow-2xl rounded-[60px] border border-slate-100 print:shadow-none print:border-none print:p-0 print:m-0" id="printable-material">
        
        {/* Page Header */}
        <div className="text-center mb-24 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 z-0" />
          <div className="bg-white relative z-10 inline-block px-12">
            <h1 className="text-6xl font-black italic tracking-tighter uppercase mb-4 leading-none">Spelling Bee <span className="text-amber-500 underline decoration-8 underline-offset-8">Championship</span></h1>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] py-3 inline-block">Official Competition Guide — {className}</h2>
          </div>
        </div>

        {/* Introduction */}
        <section className="mb-20 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-px bg-slate-200" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Book className="w-4 h-4" /> Foreword / Introdução
            </h3>
          </div>
          <p className="text-slate-800 leading-[1.8] text-lg font-medium indent-12 text-justify">
            This document sets the formal stage for a high-intensity linguistic contest. Designed for {studentCount} students 
            across multiple elimination brackets, the Spelling Bee promotes phonetic accuracy, vocabulary expansion, 
            and competitive sportsmanship. Referees and participants must adhere to the standardized rules 
            outlined in this kit to ensure fair play and excellence in language mastery.
          </p>
        </section>

        {/* Overview Table - Bento Styled Table */}
        <section className="mb-20">
           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-10 border-l-4 border-amber-400 pl-6">COMPETITION ARCHITECTURE / ESTRUTURA</h3>
           <div className="border border-slate-100 rounded-[40px] overflow-hidden shadow-sm bg-slate-50/30">
             <table className="w-full text-left">
               <thead className="bg-slate-900 text-white">
                 <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">STAGE / FASE</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">STUDENTS / ALUNOS</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">BRACKETS / ORGANIZAÇÃO</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">SURVIVORS / CLASSIF.</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">TIER / DIFICULDADE</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {dynamicPhases.map((f, i) => (
                   <tr key={i} className="hover:bg-slate-50 transition-colors">
                     <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-tighter text-lg italic">{f.phase}</td>
                     <td className="px-8 py-6 text-sm font-black text-center">{f.students}</td>
                     <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-tight">{f.organization}</td>
                     <td className="px-8 py-6 text-sm font-black text-amber-500 uppercase tracking-tight">{f.qualified}</td>
                     <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{f.words}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </section>

        {/* Rules Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
           <section className="space-y-8">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-4 flex items-center justify-between">
                Championship Rules (EN) <span>01 / 07</span>
              </h3>
              <ul className="space-y-6">
                {RULES_EN.map((rule, i) => (
                  <li key={i} className="flex gap-6 group">
                    <span className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-300 border border-slate-100 group-hover:bg-amber-400 group-hover:text-amber-900 transition-colors shrink-0">
                      {i+1}
                    </span>
                    <p className="text-slate-700 leading-relaxed font-bold text-sm pt-2">{rule}</p>
                  </li>
                ))}
              </ul>
           </section>
           <section className="space-y-8">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-4 flex items-center justify-between">
                Regras do Campeonato (PT) <span>01 / 07</span>
              </h3>
              <ul className="space-y-6">
                {RULES_PT.map((rule, i) => (
                  <li key={i} className="flex gap-6 group">
                    <span className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-300 border border-slate-100 group-hover:bg-amber-400 group-hover:text-amber-900 transition-colors shrink-0">
                      {i+1}
                    </span>
                    <p className="text-slate-700 leading-relaxed font-bold text-sm pt-2">{rule}</p>
                  </li>
                ))}
              </ul>
           </section>
        </div>

        {/* Useful Phrases - Bento Card Grid */}
        <section className="mb-24 bg-slate-900 p-12 rounded-[50px] text-white">
           <h3 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.3em] mb-12 flex items-center gap-4">
             <div className="w-2 h-2 bg-amber-400 rounded-full" /> Teacher’s Arena Commands
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
              {TEACHER_PHRASES.map((p, i) => (
                <div key={i} className="flex flex-col pb-6 border-b border-slate-800 group hover:border-amber-400 transition-colors">
                  <span className="text-xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-amber-400 transition-colors">“{p.en}”</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{p.pt}</span>
                </div>
              ))}
           </div>
        </section>

        {/* Word Bank Table - Final Document Grade */}
        <section className="mb-24 break-before-page">
           <div className="flex items-center justify-between mb-12">
             <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
               <List className="w-8 h-8 text-amber-500" /> Competition Vocabulary
             </h3>
             <div className="flex gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
               <div className="flex items-center gap-3"><div className="w-2 h-2 bg-green-400 rounded-full" /><span className="text-slate-400">Easy: {easyCount}</span></div>
               <div className="flex items-center gap-3"><div className="w-2 h-2 bg-amber-400 rounded-full" /><span className="text-slate-400">Medium: {mediumCount}</span></div>
               <div className="flex items-center gap-3"><div className="w-2 h-2 bg-red-400 rounded-full" /><span className="text-slate-400">Hard: {hardCount}</span></div>
             </div>
           </div>
           
           <div className="border border-slate-100 rounded-[48px] overflow-hidden shadow-2xl">
             <table className="w-full text-left text-sm">
               <thead className="bg-[#0F172A] text-white">
                 <tr>
                    <th className="px-8 py-6 font-black border-r border-white/5 uppercase tracking-widest text-[9px] text-slate-400">REF</th>
                    <th className="px-8 py-6 font-black border-r border-white/5 uppercase tracking-widest text-[9px] text-slate-400">TARGET WORD</th>
                    <th className="px-8 py-6 font-black border-r border-white/5 uppercase tracking-widest text-[9px] text-slate-400">IPA PHONETICS</th>
                    <th className="px-8 py-6 font-black border-r border-white/5 uppercase tracking-widest text-[9px] text-slate-400">SEMANTIC MEANING</th>
                    <th className="px-8 py-6 font-black uppercase tracking-widest text-[9px] text-slate-400">LEVEL</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {words.map((w, i) => (
                   <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-8 py-5 font-black text-[10px] text-slate-300 border-r border-slate-50">{String(i + 1).padStart(2, '0')}</td>
                     <td className="px-8 py-5 font-black text-slate-900 text-xl tracking-tighter uppercase border-r border-slate-50">{w.text}</td>
                     <td className="px-8 py-5 font-mono text-xs italic text-slate-400 border-r border-slate-50">/ {w.pronunciation} /</td>
                     <td className="px-8 py-5 font-bold text-slate-600 uppercase tracking-tight border-r border-slate-50">{w.meaning}</td>
                     <td className="px-8 py-5">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm ${
                          w.difficulty === Difficulty.A1 ? 'bg-green-100 text-green-700' :
                          w.difficulty === Difficulty.B1 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {w.difficulty}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </section>

        {/* Footer for the document */}
        <footer className="text-center pt-16 border-t-2 border-slate-50 space-y-2">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Spelling Bee Arena Management Protocol — 2026</p>
           <p className="text-[9px] font-medium text-slate-200">Generated automatically for classroom excellence.</p>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-material, #printable-material * {
            visibility: visible;
          }
          #printable-material {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .break-before-page {
            page-break-before: always;
          }
           @page {
            margin: 15mm;
          }
        }
      `}} />
    </div>
  );
}
