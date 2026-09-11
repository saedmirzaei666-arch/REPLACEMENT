import type { CEFRLevel } from "@/data/questions";

export interface SkillScore {
  skill: "reading" | "listening" | "writing" | "speaking";
  rawScore: number;
  maxScore: number;
  percentage: number;
  level: CEFRLevel;
}

export interface OverallResult {
  overallLevel: CEFRLevel;
  skills: SkillScore[];
  pendingSkills?: ("writing" | "speaking")[];
  feedback: string;
  timestamp: string;
}

const levelOrder: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function percentageToLevel(pct: number): CEFRLevel {
  if (pct >= 90) return "C2";
  if (pct >= 80) return "C1";
  if (pct >= 65) return "B2";
  if (pct >= 50) return "B1";
  if (pct >= 30) return "A2";
  return "A1";
}

export function calculateReadingScore(answers: Record<string, any>): SkillScore {
  let correct = 0;
  let total = 0;

  // MCQs (A1 + B2)
  const mcqIds = ["r-mcq-1", "r-mcq-2", "r-mcq-3", "r-mcq-4", "r-mcq-5"];
  mcqIds.forEach((id) => {
    total += 1;
    if (answers[id] !== undefined && answers[id] === true) correct += 1;
  });

  // Dropdown
  if (answers["r-dd-1"]) {
    const arr = answers["r-dd-1"] as boolean[];
    total += arr.length;
    correct += arr.filter(Boolean).length;
  }

  // Drag
  if (answers["r-drag-1"]) {
    const arr = answers["r-drag-1"] as boolean[];
    total += arr.length;
    correct += arr.filter(Boolean).length;
  }

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  return {
    skill: "reading",
    rawScore: correct,
    maxScore: total,
    percentage,
    level: percentageToLevel(percentage),
  };
}

export function calculateListeningScore(answers: Record<string, any>): SkillScore {
  let correct = 0;
  let total = 0;

  // All listening MCQs (A2 car rental + B1 Stonehenge)
  ["l-mcq-1", "l-mcq-2", "l-mcq-3", "l-mcq-4", "l-mcq-5", "l-mcq-6", "l-mcq-7", "l-mcq-8"].forEach((id) => {
    total += 1;
    if (answers[id] === true) correct += 1;
  });

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  return {
    skill: "listening",
    rawScore: correct,
    maxScore: total,
    percentage,
    level: percentageToLevel(percentage),
  };
}

// Simple heuristic for writing (in production use AI)
export function estimateWritingScore(rephrase: string, shortText: string): SkillScore {
  let score = 40; // base

  // Length check
  const words = shortText.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 40 && words <= 90) score += 20;
  else if (words >= 25) score += 10;

  // Basic complexity
  if (shortText.includes(",") || shortText.includes(".")) score += 10;
  if (/\b(because|although|however|therefore|if)\b/i.test(shortText)) score += 15;
  if (rephrase.length > 10) score += 15;

  score = Math.min(100, score);
  return {
    skill: "writing",
    rawScore: score,
    maxScore: 100,
    percentage: score,
    level: percentageToLevel(score),
  };
}

// Placeholder for speaking – in production send audio to STT + AI
export function estimateSpeakingScore(hasRecordings: boolean[]): SkillScore {
  const completed = hasRecordings.filter(Boolean).length;
  const percentage = Math.round((completed / 3) * 70 + 20); // base 20 + up to 70
  return {
    skill: "speaking",
    rawScore: percentage,
    maxScore: 100,
    percentage,
    level: percentageToLevel(percentage),
  };
}

export function getOverallLevel(skills: SkillScore[]): CEFRLevel {
  const avg =
    skills.reduce((sum, s) => sum + levelOrder.indexOf(s.level), 0) / skills.length;
  const idx = Math.round(avg);
  return levelOrder[Math.max(0, Math.min(levelOrder.length - 1, idx))];
}

export function generateFeedback(result: OverallResult): string {
  const { overallLevel, skills } = result;
  const strongest = skills.reduce((a, b) => (a.percentage > b.percentage ? a : b));
  const weakest = skills.reduce((a, b) => (a.percentage < b.percentage ? a : b));

  return `Your overall estimated CEFR level is **${overallLevel}**. 
Your strongest skill appears to be **${strongest.skill}** (${strongest.level}), 
while **${weakest.skill}** (${weakest.level}) may need more practice. 
This is an automated estimate. For a more accurate assessment, especially for Writing and Speaking, 
a human reviewer or advanced AI evaluation is recommended.`;
}
