export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface Word {
  id: string;
  text: string;
  pronunciation: string;
  meaning: string;
  difficulty: Difficulty;
}

export interface School {
  id: string;
  name: string;
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  name: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  studentIds: string[];
  classifiedIds: string[];
}

export enum CompetitionPhase {
  PHASE_1 = '1st Phase (6 Groups of 4)',
  PHASE_2 = '2nd Phase (3 Groups of 4)',
  SEMIFINAL = 'Semifinal (2 Groups of 3)',
  FINAL = 'Final (2 Finalists)',
  COMPLETED = 'Completed'
}

export interface Competition {
  id: string;
  classIds: string[];
  schoolId: string;
  currentPhase: CompetitionPhase;
  groups: Group[];
  isSuddenDeath?: boolean;
  winners?: {
    first: string;
    second: string;
    third?: string;
  };
  eliminatedStudentIds: string[];
  history: Array<{
    round: number;
    studentId: string;
    wordId: string;
    isCorrect: boolean;
    phase: CompetitionPhase;
  }>;
}
