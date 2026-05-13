import { Competition, CompetitionPhase, Group, Student } from "../types";

export function getPhaseName(phase: CompetitionPhase) {
    const names = {
        [CompetitionPhase.PRELIMINARY]: 'Preliminary Round',
        [CompetitionPhase.QUARTERFINAL]: 'Quarterfinals',
        [CompetitionPhase.SEMIFINAL]: 'Semifinals',
        [CompetitionPhase.FINAL]: 'Grand Final',
        [CompetitionPhase.COMPLETED]: 'Completed'
    };
    return names[phase];
}

export function buildInitialCompetition(classIds: string[], schoolId: string, classStudents: Student[]): Competition {
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

  const initialPhase = numGroups === 1 ? CompetitionPhase.FINAL : 
                       numGroups === 2 ? CompetitionPhase.SEMIFINAL : 
                       CompetitionPhase.PRELIMINARY;

  return {
      id: crypto.randomUUID(),
      classIds: classIds,
      schoolId: schoolId,
      currentPhase: initialPhase,
      groups: groups,
      eliminatedStudentIds: [],
      history: []
  };
}

export interface EliminationResult {
    updatedComp: Competition;
    isGroupFinished: boolean;
    nextGroupId: string | null;
}

export function handleStudentElimination(
    activeComp: Competition, 
    activeGroupId: string, 
    student: Student, 
    round: number,
    wordId?: string
): EliminationResult {
    let updatedEliminated = [...activeComp.eliminatedStudentIds];
    updatedEliminated.push(student.id);

    const activeGroup = activeComp.groups.find(g => g.id === activeGroupId);
    if (!activeGroup) {
        throw new Error("Active group not found");
    }

    const remainingInGroup = activeGroup.studentIds.filter(id => !updatedEliminated.includes(id));
    
    // Target is 2 students per group, except for the final which usually has a winner when 1 is left.
    // If it's the final, standard rule says 1 remains.
    const target = activeComp.currentPhase === CompetitionPhase.FINAL ? 1 : 2;
    
    let isGroupFinished = false;

    let updatedGroups = activeComp.groups.map(g => {
        if (g.id === activeGroupId) {
            if (activeComp.isSuddenDeath) {
                // In Sudden death, eliminate anyone who gets it wrong. If target is reached, group finishes.
                 if (remainingInGroup.length <= target) {
                     isGroupFinished = true;
                     return { ...g, classifiedIds: remainingInGroup };
                 } 
            } else {
                 if (remainingInGroup.length <= target) {
                     isGroupFinished = true;
                     return { ...g, classifiedIds: remainingInGroup };
                 }
            }
        }
        return g;
    });

    const updatedComp: Competition = {
        ...activeComp,
        history: [...activeComp.history, {
            round,
            studentId: student.id,
            wordId: wordId || 'skipped',
            isCorrect: false,
            phase: activeComp.currentPhase
        }],
        eliminatedStudentIds: updatedEliminated,
        groups: updatedGroups
    };

    return { 
        updatedComp, 
        isGroupFinished,
        nextGroupId: isGroupFinished ? null : activeGroupId
    };
}

export function buildNextPhase(activeComp: Competition): Competition {
    const qualified = activeComp.groups.flatMap(g => g.classifiedIds);
    let nextPhase: CompetitionPhase;
    let nextGroups: Group[] = [];

    // Fisher-Yates Shuffle
    const shuffledQualified = [...qualified];
    for (let i = shuffledQualified.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQualified[i], shuffledQualified[j]] = [shuffledQualified[j], shuffledQualified[i]];
    }

    if (activeComp.currentPhase === CompetitionPhase.FINAL) {
        nextPhase = CompetitionPhase.COMPLETED;
        nextGroups = activeComp.groups; // Keep the same for display
    } else {
        const size = 4;
        const numGroups = Math.ceil(shuffledQualified.length / size);

        if (numGroups > 2) {
            nextPhase = CompetitionPhase.QUARTERFINAL;
            nextGroups = Array.from({ length: numGroups }, (_, i) => ({
                id: crypto.randomUUID(),
                name: `Group ${String.fromCharCode(65 + i)}`,
                studentIds: [],
                classifiedIds: []
            }));
        } else if (numGroups === 2) {
            nextPhase = CompetitionPhase.SEMIFINAL;
            nextGroups = Array.from({ length: numGroups }, (_, i) => ({
                id: crypto.randomUUID(),
                name: `Semifinal ${i + 1}`,
                studentIds: [],
                classifiedIds: []
            }));
        } else {
            nextPhase = CompetitionPhase.FINAL;
            nextGroups = [{
                id: crypto.randomUUID(),
                name: 'Grand Final',
                studentIds: shuffledQualified,
                classifiedIds: []
            }];
        }

        if (numGroups > 0 && nextPhase !== CompetitionPhase.FINAL) {
            shuffledQualified.forEach((studentId, index) => {
                nextGroups[index % numGroups].studentIds.push(studentId);
            });
        }
    }

    return {
        ...activeComp,
        currentPhase: nextPhase,
        groups: nextGroups,
        isSuddenDeath: false, // Reset sudden death for the new phase
        winners: nextPhase === CompetitionPhase.COMPLETED && qualified.length > 0 ? {
            first: qualified[0],
            second: activeComp.eliminatedStudentIds[activeComp.eliminatedStudentIds.length - 1]
        } : undefined
    };
}
