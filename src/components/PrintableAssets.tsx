import React from 'react';
import { Competition, Student, Word, ClassRoom, CompetitionPhase, Difficulty } from '../types';

interface Props {
  competition: Competition;
  students: Student[];
  words: Word[];
  classes: ClassRoom[];
}

export function PrintableAssets({ competition, students, words, classes }: Props) {
  const compClasses = competition.classIds.map(id => classes.find(c => c.id === id)?.name).filter(Boolean).join(', ');
  const numStudents = competition.groups.reduce((acc, g) => acc + g.studentIds.length, 0);

  // Helper to get formatted date
  const today = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date());

  // Collect the words
  const easyWords = words.filter(w => w.difficulty === Difficulty.EASY);
  const mediumWords = words.filter(w => w.difficulty === Difficulty.MEDIUM);

  // Description text
  const getDescription = () => {
    const numGroups = competition.groups.length;
    let description = `This Spelling Bee Tournament features ${numStudents} participating students from ${compClasses}. `;
    
    if (numGroups > 1) {
      description += `The tournament begins with an initial phase consisting of ${numGroups} groups. `;
      description += `Each group will have their spelling skills tested until only the top candidates remain. `;
      description += `The successful clearers from these groups will advance to the subsequent elimination rounds, leading up to the Grand Final. `;
    } else {
      description += `The tournament immediately begins with a Grand Final, as the number of participants fits within a single group. `;
    }

    description += `Participants will face entirely random words scaled by difficulty based on the current phase of the tournament (Easy for initial phases, Medium for Finals).`;

    return description;
  };

  return (
    <div className="hidden print:block w-full text-black bg-white p-8">
      {/* Page 1: Overview and Rules */}
      <div className="page-break-after-always min-h-screen">
        <h1 className="text-4xl font-black uppercase text-center mb-2">Spelling Bee Tournament Guide</h1>
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-600 border-b border-gray-300 pb-4">
          {compClasses}
        </h2>

        <div className="mb-12">
          <h3 className="text-xl font-bold uppercase border-b-2 border-black inline-block mb-4">Event Overview</h3>
          <p className="text-lg leading-relaxed text-justify">
            {getDescription()}
          </p>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-bold uppercase border-b-2 border-black inline-block mb-4">Official Rules</h3>
          <ol className="list-decimal pl-6 space-y-4 text-justify text-lg leading-relaxed">
            <li><strong>Pronunciation:</strong> The announcer will state the word, its pronunciation, and its meaning.</li>
            <li><strong>Clarification:</strong> The participant may ask for the word to be repeated before starting to spell.</li>
            <li><strong>Spelling:</strong> Once the participant begins, they may not stop and restart. They must spell continuously.</li>
            <li><strong>Elimination:</strong> A participant is eliminated upon misplacing a letter or failing to complete the spelling.</li>
            <li><strong>Advancement:</strong> In group stages, participants keep spelling round by round until the target number of remaining participants is reached.</li>
            <li><strong>Winner:</strong> The final remaining participant is declared the Grand Champion.</li>
          </ol>
        </div>
      </div>

      {/* Page 2: Tournament Bracket / Groups */}
      <div className="page-break-after-always min-h-screen">
        <h1 className="text-4xl font-black uppercase text-center mb-8 border-b-4 border-black pb-4">Tournament Bracket</h1>
        
        <div className="grid grid-cols-2 gap-8">
          {competition.groups.map(group => (
            <div key={group.id} className="border-2 border-black rounded-lg p-6 flex flex-col">
              <h3 className="text-2xl font-black uppercase mb-4 text-center bg-gray-100 py-2 border border-gray-300">{group.name}</h3>
              <ul className="space-y-2 flex-1">
                {group.studentIds.map(sid => {
                  const s = students.find(x => x.id === sid);
                  return (
                    <li key={sid} className="text-lg flex justify-between border-b border-gray-200 pb-1">
                      <span>{s?.name || 'Unknown'}</span>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 border border-gray-400 rounded-sm"></div>
                        <div className="w-6 h-6 border border-gray-400 rounded-sm"></div>
                        <div className="w-6 h-6 border border-gray-400 rounded-sm"></div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="text-sm mt-4 text-gray-500 italic text-center">
                * Checkboxes for tracking correct rounds
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Page 3: Word Lists */}
      <div className="min-h-screen">
        <h1 className="text-4xl font-black uppercase text-center mb-8 border-b-4 border-black pb-4">Official Word List</h1>

        <div className="mb-12">
          <h3 className="text-2xl font-bold uppercase mb-4 bg-gray-200 p-2 border border-gray-400">Phase 1 & 2 (Easy Words)</h3>
          <table className="w-full text-left border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 font-black w-1/3">Word</th>
                <th className="border border-black p-2 font-black w-1/3">Pronunciation</th>
                <th className="border border-black p-2 font-black">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {easyWords.map(w => (
                <tr key={w.id}>
                  <td className="border border-black p-2 font-bold font-mono">{w.text.toUpperCase()}</td>
                  <td className="border border-black p-2">/{w.pronunciation}/</td>
                  <td className="border border-black p-2">{w.meaning}</td>
                </tr>
              ))}
              {easyWords.length === 0 && (
                <tr>
                  <td colSpan={3} className="border border-black p-4 text-center italic text-gray-500">No easy words found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-2xl font-bold uppercase mb-4 bg-gray-200 p-2 border border-gray-400">Final Phases (Medium Words)</h3>
          <table className="w-full text-left border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 font-black w-1/3">Word</th>
                <th className="border border-black p-2 font-black w-1/3">Pronunciation</th>
                <th className="border border-black p-2 font-black">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {mediumWords.map(w => (
                <tr key={w.id}>
                  <td className="border border-black p-2 font-bold font-mono">{w.text.toUpperCase()}</td>
                  <td className="border border-black p-2">/{w.pronunciation}/</td>
                  <td className="border border-black p-2">{w.meaning}</td>
                </tr>
              ))}
              {mediumWords.length === 0 && (
                <tr>
                  <td colSpan={3} className="border border-black p-4 text-center italic text-gray-500">No medium words found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Print styles inserted directly to avoid cluttering global CSS */}
      <style>{`
        @media print {
          .page-break-after-always {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
