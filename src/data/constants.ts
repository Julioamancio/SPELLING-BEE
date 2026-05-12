export const RULES_PT = [
  "Cada aluno soletra uma palavra por vez.",
  "O professor fala a palavra em inglês.",
  "O aluno deve repetir a palavra, soletrar e repetir a palavra no final.",
  "Se acertar, continua na competição.",
  "Se errar, é eliminado.",
  "Na 1ª e 2ª fases, passam 2 alunos por grupo.",
  "Na semifinal, passa apenas 1 aluno por grupo.",
  "Na final, vence quem acertar mais palavras.",
  "Em caso de empate na final, usar morte súbita (sudden death)."
];

export const RULES_EN = [
  "Each student spells one word at a time.",
  "The teacher says the word in English.",
  "The student must repeat the word, spell it, and repeat it at the end.",
  "If the spelling is correct, the student continues.",
  "If the spelling is incorrect, the student is eliminated.",
  "In the 1st and 2nd phases, 2 students per group qualify.",
  "In the semifinal, only 1 student per group qualifies.",
  "In the final, the winner is the one who spells the most words correctly.",
  "In case of a tie in the final, sudden death will be used."
];

export const TEACHER_PHRASES = [
  { en: "Welcome to our Spelling Bee Championship.", pt: "Bem-vindos ao nosso Campeonato de Spelling Bee." },
  { en: "Student, your word is...", pt: "Aluno, sua palavra é..." },
  { en: "Can you spell it, please?", pt: "Você pode soletrar, por favor?" },
  { en: "Correct.", pt: "Correto." },
  { en: "Incorrect.", pt: "Incorreto." },
  { en: "The correct spelling is...", pt: "A soletração correta é..." },
  { en: "You are still in the competition.", pt: "Você ainda está na competição." },
  { en: "You are eliminated.", pt: "Você foi eliminado." },
  { en: "Congratulations, you are going to the next round.", pt: "Parabéns, você vai para a próxima rodada." },
  { en: "We have a tie.", pt: "Temos um empate." },
  { en: "Now we are going to sudden death.", pt: "Agora vamos para a morte súbita." },
  { en: "The winner is...", pt: "O vencedor é..." },
  { en: "The champion is...", pt: "O campeão é..." }
];

export const PHASE_FLOW = [
  { phase: "1st Phase", students: 24, organization: "6 groups of 4", qualified: "12 students (2 per group)", words: "Easy" },
  { phase: "2nd Phase", students: 12, organization: "3 groups of 4", qualified: "6 students (2 per group)", words: "Easy & Medium" },
  { phase: "Semifinal", students: 6, organization: "2 groups of 3", qualified: "2 finalists (1 per group)", words: "Medium & Hard" },
  { phase: "Final", students: 2, organization: "1 on 1", qualified: "Champion", words: "Hard & Sudden Death" }
];
