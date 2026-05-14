import React, { useState } from 'react';
import { Plus, Trash2, Search, Filter, BookOpen, FileText, Loader2, ListPlus, Edit3, CheckSquare, Square, X, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Word, Difficulty } from '../types';
import { processBulkWords } from '../services/geminiService';
import { useSpellCheck } from '../hooks/useSpellCheck';

interface Props {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
}

export default function WordBank({ words, setWords }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');
  const [sortOption, setSortOption] = useState<'A-Z' | 'Z-A' | 'Easy-Hard' | 'Hard-Easy'>('A-Z');
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Selection & Editing State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const [newWord, setNewWord] = useState<Partial<Word>>({
    difficulty: Difficulty.A1
  });

  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');

  // Spell Checkers
  const addWordSpellCheck = useSpellCheck(newWord.text || '');
  const editWordSpellCheck = useSpellCheck(editingWord?.text || '');

  const filteredWords = words.filter(w => {
    const matchesSearch = w.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.meaning.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'All' || w.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyWeight = (diff: Difficulty) => {
    if (diff === Difficulty.A1) return 1;
    if (diff === Difficulty.A2) return 2;
    if (diff === Difficulty.B1) return 3;
    if (diff === Difficulty.B2) return 4;
    if (diff === Difficulty.C1) return 5;
    if (diff === Difficulty.C2) return 6;
    return 0;
  };

  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortOption === 'Easy-Hard') {
      return getDifficultyWeight(a.difficulty) - getDifficultyWeight(b.difficulty) || a.text.localeCompare(b.text);
    }
    if (sortOption === 'Hard-Easy') {
      return getDifficultyWeight(b.difficulty) - getDifficultyWeight(a.difficulty) || a.text.localeCompare(b.text);
    }
    if (sortOption === 'Z-A') {
      return b.text.localeCompare(a.text);
    }
    return a.text.localeCompare(b.text); // A-Z
  });

  const handleAdd = () => {
    setAddError('');
    if (!newWord.text?.trim() || !newWord.meaning?.trim()) {
      setAddError('Word and Meaning fields cannot be empty.');
      return;
    }
    const word: Word = {
      id: crypto.randomUUID(),
      text: newWord.text.trim(),
      meaning: newWord.meaning.trim(),
      pronunciation: newWord.pronunciation?.trim() || '',
      example: newWord.example?.trim() || '',
      difficulty: (newWord.difficulty as Difficulty) || Difficulty.A1
    };
    setWords([...words, word]);
    setIsAdding(false);
    setNewWord({ difficulty: Difficulty.A1 });
  };

  const handleUpdate = () => {
    if (!editingWord) return;
    setEditError('');
    if (!editingWord.text?.trim() || !editingWord.meaning?.trim()) {
      setEditError('Word and Meaning fields cannot be empty.');
      return;
    }
    const updated = {
      ...editingWord,
      text: editingWord.text.trim(),
      meaning: editingWord.meaning.trim(),
      pronunciation: editingWord.pronunciation?.trim() || '',
      example: editingWord.example?.trim() || '',
    };
    setWords(words.map(w => w.id === updated.id ? updated : w));
    setEditingWord(null);
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setIsProcessing(true);
    try {
      const wordList = bulkText
        .split(/[\n,]/)
        .map(w => w.trim())
        .filter(w => w.length > 0);
      
      const processedWords = await processBulkWords(wordList);
      
      const completeWords = processedWords.map(w => ({
        id: crypto.randomUUID(),
        text: w.text || '',
        meaning: w.meaning || '',
        pronunciation: w.pronunciation || '',
        example: w.example || '',
        difficulty: (w.difficulty as Difficulty) || Difficulty.A1
      }));

      setWords(prev => [...prev, ...completeWords]);
      setIsBulkAdding(false);
      setBulkText('');
    } catch (error) {
      console.error("Bulk import failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeWord = (id: string) => {
    setWords(words.filter(w => w.id !== id));
    setSelectedIds(selectedIds.filter(sid => sid !== id));
  };

  const deleteSelected = () => {
    setWords(words.filter(w => !selectedIds.includes(w.id)));
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedWords.length && sortedWords.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedWords.map(w => w.id));
    }
  };

  const toggleSelectWord = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 px-2 pb-20">
      {/* Header & Stats - Bento Input Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex-1 group focus-within:border-amber-400 transition-all">
          <Search className="w-6 h-6 text-slate-300 group-focus-within:text-amber-500" />
          <input 
            type="text" 
            placeholder="Search words by text or meaning..."
            className="flex-1 focus:outline-none font-bold text-slate-900 placeholder:text-slate-300 uppercase tracking-tight"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-end">
           <div className="relative group">
             <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
               <Filter className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
             </div>
             <select 
               className="pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-3xl font-black uppercase text-[10px] tracking-widest text-slate-500 focus:outline-none shadow-sm cursor-pointer hover:border-slate-300 appearance-none"
               value={filterDifficulty}
               onChange={(e) => setFilterDifficulty(e.target.value as any)}
             >
               <option value="All">All Difficulty Levels</option>
               <option value={Difficulty.A1}>A1 - Beginner</option>
               <option value={Difficulty.A2}>A2 - Elementary</option>
               <option value={Difficulty.B1}>B1 - Intermediate</option>
               <option value={Difficulty.B2}>B2 - Upper Intermediate</option>
               <option value={Difficulty.C1}>C1 - Advanced</option>
               <option value={Difficulty.C2}>C2 - Proficient</option>
             </select>
           </div>
           <div className="relative group">
             <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
               <ArrowUpDown className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
             </div>
             <select 
               className="pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-3xl font-black uppercase text-[10px] tracking-widest text-slate-500 focus:outline-none shadow-sm cursor-pointer hover:border-slate-300 appearance-none"
               value={sortOption}
               onChange={(e) => setSortOption(e.target.value as any)}
             >
               <option value="A-Z">A-Z</option>
               <option value="Z-A">Z-A</option>
               <option value="Easy-Hard">Difficulty: Easy to Hard</option>
               <option value="Hard-Easy">Difficulty: Hard to Easy</option>
             </select>
           </div>
           <button 
             onClick={() => setIsBulkAdding(true)}
             className="px-8 py-5 bg-amber-50 text-amber-700 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-100 transition-all flex items-center gap-3 border border-amber-200"
           >
             <ListPlus className="w-4 h-4" /> Bulk Import
           </button>
           <button 
             onClick={() => { setIsAdding(true); setAddError(''); }}
             className="px-8 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 shadow-xl shadow-slate-200 flex items-center gap-3"
           >
             <Plus className="w-4 h-4" /> New Word
           </button>
        </div>
      </div>

      {/* Selection Control Bar */}
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-amber-400 transition-all"
          >
            {selectedIds.length === sortedWords.length && sortedWords.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-amber-500" />
            ) : (
              <Square className="w-4 h-4 text-slate-300" />
            )}
            Select All
          </button>
          
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, x: -20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.9, opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <div className="h-6 w-px bg-slate-200 mx-1" />
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  {selectedIds.length} Selected
                </span>
                <button 
                  onClick={deleteSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 className="w-3 h-3" /> Delete Selected
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button 
          onClick={() => {
            if(confirm("Are you sure you want to delete ALL words?")) setWords([]);
          }}
          className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2 px-4 py-2"
        >
          <X className="w-3 h-3" /> Clear Repository
        </button>
      </div>

      {/* Word Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedWords.map(word => (
          <div 
            key={word.id} 
            className={`bento-card p-6 md:p-8 flex flex-col group relative overflow-hidden transition-all border-2 min-h-[300px] ${
              selectedIds.includes(word.id) ? 'border-indigo-400 shadow-xl shadow-indigo-50 bg-indigo-50/40' : 
              word.difficulty === Difficulty.A1 || word.difficulty === Difficulty.A2 ? 'border-green-100 bg-green-50/50 hover:border-green-200' :
              word.difficulty === Difficulty.B1 || word.difficulty === Difficulty.B2 ? 'border-amber-100 bg-amber-50/50 hover:border-amber-200' :
              'border-red-100 bg-red-50/50 hover:border-red-200'
            }`}
          >
            {/* Background Decorative Accents */}
            <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 rounded-bl-[40px] ${
              word.difficulty === Difficulty.A1 || word.difficulty === Difficulty.A2 ? 'bg-green-500' :
              word.difficulty === Difficulty.B1 || word.difficulty === Difficulty.B2 ? 'bg-amber-500' :
              'bg-red-500'
            }`} />

            <div className="flex justify-between items-start mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleSelectWord(word.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedIds.includes(word.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-100 bg-white group-hover:border-slate-300'
                  }`}
                >
                  {selectedIds.includes(word.id) && <CheckSquare className="w-4 h-4" />}
                </button>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                  word.difficulty === Difficulty.A1 || word.difficulty === Difficulty.A2 ? 'bg-green-100 text-green-700' :
                  word.difficulty === Difficulty.B1 || word.difficulty === Difficulty.B2 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {word.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => { setEditingWord(word); setEditError(''); }}
                  className="p-2 text-slate-200 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-50 rounded-lg"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => removeWord(word.id)}
                  className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 mb-6">
              <h4 className="text-2xl xl:text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase leading-none break-words hyphens-auto">{word.text}</h4>
              <p className="text-xs text-slate-400 font-bold font-mono tracking-widest break-words">/ {word.pronunciation} /</p>
            </div>
            
            <div className="pt-6 border-t border-slate-200/50 flex flex-col gap-1 shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meaning</span>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-tight mb-4 leading-snug break-words">{word.meaning}</p>
              
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 shrink-0">Example</span>
              {word.example ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-sm font-semibold text-slate-600 italic leading-relaxed break-words">"{word.example}"</p>
                </div>
              ) : (
                <button 
                  onClick={() => { setEditingWord(word); setEditError(''); }}
                  className="text-left bg-slate-50 border border-dashed border-slate-300 p-3 rounded-xl hover:bg-slate-100 hover:border-amber-300 transition-colors group/edit w-full"
                >
                  <p className="text-xs font-medium text-slate-400 group-hover/edit:text-amber-600 flex items-center justify-between">
                    <span>No example provided.</span>
                    <span className="text-amber-500 font-bold uppercase text-[10px] tracking-widest ml-2">Add Example</span>
                  </p>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Word Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Add New Word</h3>
                    <p className="text-slate-400 mt-1 font-medium italic">Expanding the linguistic arsenal.</p>
                 </div>
                 <BookOpen className="w-10 h-10 text-amber-400 opacity-20" />
              </div>
              <div className="p-10 space-y-8">
                 <div className="group">
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest transition-colors group-focus-within:text-amber-500">Word (English)</label>
                   <input 
                    type="text" 
                    className={`w-full px-6 py-4 bg-slate-50 border ${addWordSpellCheck.isValid === false ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:ring-amber-100'} rounded-2xl focus:ring-4 focus:bg-white focus:outline-none font-black text-xl uppercase tracking-tighter transition-all`}
                    value={newWord.text || ''}
                    onChange={(e) => setNewWord({...newWord, text: e.target.value})}
                   />
                   
                   {/* Real-time spell check feedback */}
                   <AnimatePresence>
                     {addWordSpellCheck.isChecking && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 mt-2 ml-2 overflow-hidden">
                         <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Checking spelling...</span>
                       </motion.div>
                     )}
                     {addWordSpellCheck.isValid === false && !addWordSpellCheck.isChecking && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 bg-red-50 p-4 rounded-xl border border-red-100 overflow-hidden">
                         <div className="flex items-center gap-2">
                           <AlertTriangle className="w-4 h-4 text-red-500" />
                           <span className="text-xs font-black text-red-600 uppercase tracking-tight">Possible spelling mistake</span>
                         </div>
                         {addWordSpellCheck.suggestions.length > 0 && (
                           <div className="mt-2 flex flex-wrap gap-2">
                             <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center">Suggestions:</span>
                             {addWordSpellCheck.suggestions.map(sug => (
                               <button 
                                 key={sug}
                                 onClick={() => setNewWord({...newWord, text: sug})}
                                 className="px-2 py-1 bg-white border border-red-200 rounded text-[10px] font-black text-red-700 uppercase hover:bg-red-100 transition-colors"
                               >
                                 {sug}
                               </button>
                             ))}
                           </div>
                         )}
                       </motion.div>
                     )}
                   </AnimatePresence>

                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="group">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors group-focus-within:text-amber-500">IPA Pronunciation</label>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-1">Intl. Phonetic Alphabet</p>
                     <input 
                      type="text" 
                      placeholder="e.g. /ˈmaʊntɪn/"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:outline-none font-mono text-sm group-focus-within:bg-white transition-all"
                      value={newWord.pronunciation || ''}
                      onChange={(e) => setNewWord({...newWord, pronunciation: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Difficulty Tier</label>
                     <div className="flex items-center gap-4">
                       <select 
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:outline-none font-bold text-sm uppercase tracking-tight"
                        value={newWord.difficulty}
                        onChange={(e) => setNewWord({...newWord, difficulty: e.target.value as any})}
                       >
                         <option value={Difficulty.A1}>A1</option>
                         <option value={Difficulty.A2}>A2</option>
                         <option value={Difficulty.B1}>B1</option>
                         <option value={Difficulty.B2}>B2</option>
                         <option value={Difficulty.C1}>C1</option>
                         <option value={Difficulty.C2}>C2</option>
                       </select>
                       <div className={`w-4 h-4 rounded-full shadow-sm shrink-0 ${
                         newWord.difficulty === Difficulty.A1 || newWord.difficulty === Difficulty.A2 ? 'bg-green-500 shadow-green-200' :
                         newWord.difficulty === Difficulty.B1 || newWord.difficulty === Difficulty.B2 ? 'bg-orange-500 shadow-orange-200' :
                         'bg-red-500 shadow-red-200'
                       }`} />
                     </div>
                   </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Meaning (Portuguese)</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:outline-none font-bold mb-4"
                      value={newWord.meaning || ''}
                      onChange={(e) => setNewWord({...newWord, meaning: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Example Sentence (English)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. He climbed the highest mountain."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:outline-none font-bold"
                      value={newWord.example || ''}
                      onChange={(e) => setNewWord({...newWord, example: e.target.value})}
                    />
                 </div>
                 {addError && <p className="text-red-500 font-bold text-xs">{addError}</p>}
              </div>
              <div className="px-10 py-8 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => { setIsAdding(false); setAddError(''); }}
                  className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAdd}
                  className="flex-2 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 shadow-2xl shadow-slate-300"
                >
                  Register Word
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Word Modal */}
        {editingWord && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Edit Lexicon</h3>
                    <p className="text-slate-400 mt-1 font-medium italic">Refining target word: <span className="text-amber-500 font-bold">{editingWord.text}</span></p>
                 </div>
                 <Edit3 className="w-10 h-10 text-amber-400 opacity-20" />
              </div>
              <div className="p-10 space-y-8">
                 <div className="group">
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Word (English)</label>
                   <input 
                    type="text" 
                    className={`w-full px-6 py-4 bg-slate-50 border ${editWordSpellCheck.isValid === false ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:ring-amber-100'} rounded-2xl focus:ring-4 focus:bg-white focus:outline-none font-black text-xl uppercase tracking-tighter transition-all`}
                    value={editingWord.text}
                    onChange={(e) => setEditingWord({...editingWord, text: e.target.value})}
                   />
                   
                   {/* Real-time spell check feedback */}
                   <AnimatePresence>
                     {editWordSpellCheck.isChecking && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 mt-2 ml-2 overflow-hidden">
                         <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Checking spelling...</span>
                       </motion.div>
                     )}
                     {editWordSpellCheck.isValid === false && !editWordSpellCheck.isChecking && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 bg-red-50 p-4 rounded-xl border border-red-100 overflow-hidden">
                         <div className="flex items-center gap-2">
                           <AlertTriangle className="w-4 h-4 text-red-500" />
                           <span className="text-xs font-black text-red-600 uppercase tracking-tight">Possible spelling mistake</span>
                         </div>
                         {editWordSpellCheck.suggestions.length > 0 && (
                           <div className="mt-2 flex flex-wrap gap-2">
                             <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center">Suggestions:</span>
                             {editWordSpellCheck.suggestions.map(sug => (
                               <button 
                                 key={sug}
                                 onClick={() => setEditingWord({...editingWord, text: sug})}
                                 className="px-2 py-1 bg-white border border-red-200 rounded text-[10px] font-black text-red-700 uppercase hover:bg-red-100 transition-colors"
                               >
                                 {sug}
                               </button>
                             ))}
                           </div>
                         )}
                       </motion.div>
                     )}
                   </AnimatePresence>

                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="group">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors group-focus-within:text-amber-500">IPA Pronunciation</label>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-1">Intl. Phonetic Alphabet</p>
                     <input 
                      type="text" 
                      placeholder="e.g. /ˈmaʊntɪn/"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:outline-none font-mono text-sm group-focus-within:bg-white transition-all"
                      value={editingWord.pronunciation}
                      onChange={(e) => setEditingWord({...editingWord, pronunciation: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Difficulty Tier</label>
                     <div className="flex items-center gap-4">
                       <select 
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:outline-none font-bold text-sm uppercase tracking-tight"
                        value={editingWord.difficulty}
                        onChange={(e) => setEditingWord({...editingWord, difficulty: e.target.value as any})}
                       >
                         <option value={Difficulty.A1}>A1</option>
                         <option value={Difficulty.A2}>A2</option>
                         <option value={Difficulty.B1}>B1</option>
                         <option value={Difficulty.B2}>B2</option>
                         <option value={Difficulty.C1}>C1</option>
                         <option value={Difficulty.C2}>C2</option>
                       </select>
                       <div className={`w-4 h-4 rounded-full shadow-sm shrink-0 ${
                         editingWord.difficulty === Difficulty.A1 || editingWord.difficulty === Difficulty.A2 ? 'bg-green-500 shadow-green-200' :
                         editingWord.difficulty === Difficulty.B1 || editingWord.difficulty === Difficulty.B2 ? 'bg-orange-500 shadow-orange-200' :
                         'bg-red-500 shadow-red-200'
                       }`} />
                     </div>
                   </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Meaning (Portuguese)</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:outline-none font-bold mb-4"
                      value={editingWord.meaning}
                      onChange={(e) => setEditingWord({...editingWord, meaning: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Example Sentence (English)</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:outline-none font-bold"
                      value={editingWord.example || ''}
                      onChange={(e) => setEditingWord({...editingWord, example: e.target.value})}
                    />
                 </div>
                 {editError && <p className="text-red-500 font-bold text-xs">{editError}</p>}
              </div>
              <div className="px-10 py-8 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => { setEditingWord(null); setEditError(''); }}
                  className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleUpdate}
                  className="flex-2 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 shadow-2xl shadow-slate-300"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {isBulkAdding && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Bulk linguistic import</h3>
                    <p className="text-slate-400 mt-1 font-medium italic">Gemini AI will handle the phonetics, meanings, and tiers.</p>
                 </div>
                 <FileText className="w-10 h-10 text-amber-500 opacity-20" />
              </div>
              <div className="p-10 space-y-6">
                 <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Word List (One per line or comma separated)</label>
                    <textarea 
                      className="w-full h-64 px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-amber-100 focus:bg-white focus:outline-none font-bold text-lg uppercase tracking-tight transition-all resize-none"
                      placeholder="Example:&#10;Mountain&#10;Adventure&#10;Knowledge..."
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      disabled={isProcessing}
                    />
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Loader2 className={`w-5 h-5 text-amber-600 ${isProcessing ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">AI Classification Protocol</p>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                        Our system will automatically analyze complexity, determine IPA pronunciation tokens, and translate semantic meanings.
                      </p>
                    </div>
                 </div>
              </div>
              <div className="px-10 py-8 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => setIsBulkAdding(false)}
                  className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkImport}
                  disabled={isProcessing || !bulkText.trim()}
                  className="flex-2 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing words...
                    </>
                  ) : (
                    <>
                      <ListPlus className="w-4 h-4" /> Process & Import List
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
