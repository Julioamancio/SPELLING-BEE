export enum Difficulty {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2'
}

export interface Word {
  id: string;
  text: string;
  pronunciation: string;
  meaning: string;
  example?: string;
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
  PRELIMINARY = 'PRELIMINARY',
  QUARTERFINAL = 'QUARTERFINAL',
  SEMIFINAL = 'SEMIFINAL',
  FINAL = 'FINAL',
  COMPLETED = 'COMPLETED'
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
