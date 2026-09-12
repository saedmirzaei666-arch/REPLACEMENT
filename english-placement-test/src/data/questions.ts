

export interface MCQQuestion {
  id: string;
  type: "mcq";
  level: CEFRLevel;
  question: string;
  options: string[];
  correct: number; // index
}

export interface DropdownFIB {
  id: string;
  type: "dropdown-fib";
  level: CEFRLevel;
  text: string; // with {{blank}} placeholders
  options: string[][]; // options for each blank
  correct: string[];
}

export interface DragFIB {
  id: string;
  type: "drag-fib";
  level: CEFRLevel;
  text: string; // with {{blank}} 
  wordBank: string[];
  correct: string[];
}

export interface ListeningFIB {
  id: string;
  type: "listening-fib";
  level: CEFRLevel;
  audioUrl: string;
  transcriptHint?: string;
  blanks: { before: string; after: string; correct: string }[];
}

export interface ListeningMCQ {
  id: string;
  type: "listening-mcq";
  level: CEFRLevel;
  audioUrl: string;
  question: string;
  options: string[];
  correct: number;
}

export interface WritingRephrase {
  id: string;
  type: "rephrase";
  level: CEFRLevel;
  original: string;
  instruction: string;
}

export interface WritingShort {
  id: string;
  type: "short-writing";
  level: CEFRLevel;
  prompt: string;
  minWords: number;
  maxWords: number;
}

export interface ReadingComprehension {
  id: string;
  level: CEFRLevel;
  passage: string;
  question: string;
  options: string[];
  correct: number;
}

export interface BuildSentence {
  id: string;
  level: CEFRLevel;
  chunks: string[];
  correct: string[];
}

export interface SpeakingTask {
  id: string;
  type: "free-talk" | "read-aloud" | "picture-desc" | "respond-situation";
  level: CEFRLevel;
  instruction: string;
  durationSec: number;
  textToRead?: string;
  imageUrl?: string;
  promptAudioUrl?: string; // for respond-to-situation
}

export type Question =
  | MCQQuestion
  | DropdownFIB
  | DragFIB
  | ListeningFIB
  | ListeningMCQ
  | WritingRephrase
  | WritingShort
  | SpeakingTask;

// ========== READING ==========
export const readingMCQs: MCQQuestion[] = [
  // --- Introductory grammar questions ---
  {
    id: "r-mcq-family",
    type: "mcq",
    level: "A1",
    question: "Joe's mum has two brothers. His mum's brothers are Joe's _____.",
    options: ["aunts", "cousins", "uncles", "nephews"],
    correct: 2,
  },
  {
    id: "r-mcq-past-negative",
    type: "mcq",
    level: "A1",
    question: "What did Helen do yesterday? She went to the shopping mall, but she _____ any clothes.",
    options: ["doesn't buy", "didn't buy", "no buys", "didn't bought"],
    correct: 1,
  },
  {
    id: "r-mcq-preposition",
    type: "mcq",
    level: "A1",
    question: "Where do you live? I live _____ London.",
    options: ["into", "on", "at", "in"],
    correct: 3,
  },
  // --- Intermediate vocabulary ---
  {
    id: "r-mcq-vocab-1",
    type: "mcq",
    level: "B1",
    question: "Because the instructions were ambiguous, several students asked for clarification. What does ‘ambiguous’ mean?",
    options: ["unclear", "detailed", "helpful", "brief"],
    correct: 0,
  },
  {
    id: "r-mcq-vocab-2",
    type: "mcq",
    level: "B1",
    question: "The company decided to expand its services after demand increased. What does ‘expand’ mean?",
    options: ["reduce", "advertise", "make larger", "replace"],
    correct: 2,
  },
  // --- Intermediate spelling ---
  {
    id: "r-mcq-spelling-1",
    type: "mcq",
    level: "B1",
    question: "Choose the correctly spelled word.",
    options: ["accomodation", "accommodation", "acommodation", "accommadation"],
    correct: 1,
  },
  {
    id: "r-mcq-spelling-2",
    type: "mcq",
    level: "B1",
    question: "Choose the correctly spelled word.",
    options: ["maintanance", "maintenence", "maintenance", "maintainance"],
    correct: 2,
  },
  // --- A1 level ---
  {
    id: "r-mcq-1",
    type: "mcq",
    level: "A1",
    question: "He always cried when he ----- a baby.",
    options: ["got", "was", "were", "is"],
    correct: 1, // was
  },
  {
    id: "r-mcq-2",
    type: "mcq",
    level: "A1",
    question: "I ----- an e-mail at the moment.",
    options: ["type", "typing", "am typing", "typed"],
    correct: 2, // am typing
  },
  {
    id: "r-mcq-3",
    type: "mcq",
    level: "A1",
    question: "----- you do any work before you came here?",
    options: ["Did", "Do", "Have", "Can"],
    correct: 0, // Did
  },
  // --- B2 level ---
  {
    id: "r-mcq-4",
    type: "mcq",
    level: "B2",
    question: "Dan ...... attention to the road when he ...... into a hole in the ground.",
    options: [
      "wasn't paying / fell",
      "hadn't paid / was falling",
      "didn't pay / has fallen",
      "hasn't been paying / would fall",
      "won't have paid / had fallen",
    ],
    correct: 0, // wasn't paying / fell
  },
  {
    id: "r-mcq-5",
    type: "mcq",
    level: "B2",
    question: "...... Sofia passes the class ...... depends on her grade on the final essay.",
    options: [
      "Both / and",
      "Not only / but also",
      "Hardly / when",
      "Whether / or not",
      "Neither / nor",
    ],
    correct: 3, // Whether / or not
  },
];

export const readingComprehension: ReadingComprehension = {
  id: "r-comp-1",
  level: "B1",
  passage:
    "Many plants have developed mechanisms to survive periods of drought. One common adaptation is the ability to reduce water loss through their leaves. Some plants close tiny openings called stomata during hot or dry conditions. Although this helps conserve water, it also limits the amount of carbon dioxide entering the plant, which can reduce photosynthesis. Other plants have developed deeper root systems that allow them to obtain water from deeper layers of soil.",
  question: "According to the passage, why do some plants close their stomata during dry conditions?",
  options: [
    "To increase photosynthesis",
    "To absorb more carbon dioxide",
    "To reduce water loss",
    "To develop deeper roots",
  ],
  correct: 2,
};

// RWFIB style (dropdown per blank) – Wrinkle Cure
export const readingDropdown: DropdownFIB = {
  id: "r-dd-1",
  type: "dropdown-fib",
  level: "C1",
  text: "Barrie Finning's, a professor at Monash University's college of pharmacy in Melbourne, and PhD student Anita Schneider, recently tested a new wrinkle cure. Twice daily, 20 male and female volunteers applied a liquid containing Myoxinol, a patented {{blank}} of okra (Hibiscus esculentus) seed, to one side of their faces. On the other side they applied a similar liquid without Myoxinol. Every week for a month their wrinkles were tested by self-assessment, photography and the size of depressions made in silicon moulds. The results were impressive. After a month the {{blank}} and number of wrinkles on the Myoxinol-treated side were reduced by approximately 27 per cent. But Finnin's research, commissioned by a cosmetics company, is unlikely to be published in a scientific {{blank}}. It's hard to even find studies that show the active ingredients in cosmetics penetrate the skin, let alone more comprehensive research on their effects. Even when {{blank}} studies are commissioned, companies usually control whether the work is published in the traditional scientific literature.",
  options: [
    ["example", "exertion", "explanation", "extract"],
    ["prowess", "concentration", "depth", "strength"],
    ["encyclopedia", "publicity", "publication", "enclosure"],
    ["rigorous", "rough", "erratic", "ritual"],
  ],
  correct: ["extract", "depth", "publication", "rigorous"],
};

// RFIB style (drag from word bank) – Critical Role of University
export const readingDrag: DragFIB = {
  id: "r-drag-1",
  type: "drag-fib",
  level: "C1",
  text: "Universities are, of course, the primary centers of intellectual life in modern society. Therefore, they are a {{blank}} center of criticism: criticism of society and of the dominant {{blank}} in it, especially its politics, by sections of both the {{blank}} and the student bodies. This critical {{blank}} of the university, as the place where ideas are born and where support for criticism is {{blank}} among students, who form the mass base for many protest movements, has been true for a long time and in many countries.",
  wordBank: ["semester", "revealed", "key", "found", "staff", "trends", "participation", "role"],
  correct: ["key", "trends", "staff", "role", "found"],
};

// ========== LISTENING ==========
// listening1.mp3 = Stonehenge audio (put the real file in /public/audio/listening1.mp3)

export const listeningFIB: ListeningFIB = {
  id: "l-fib-1",
  type: "listening-fib",
  level: "B1",
  audioUrl: "/audio/listening1.mp3",
  blanks: [], // not used anymore – kept for type compatibility
};

export const listeningMCQs: ListeningMCQ[] = [
  // --- A2: Car rental (listening2.mp3) ---
  {
    id: "l-mcq-1",
    type: "listening-mcq",
    level: "A2",
    audioUrl: "/audio/listening2.mp3",
    question: "Karen...",
    options: [
      "wants to rent a car today.",
      "didn't book a car.",
      "can choose from two different types of cars.",
    ],
    correct: 1, // B
  },
  {
    id: "l-mcq-2",
    type: "listening-mcq",
    level: "A2",
    audioUrl: "/audio/listening2.mp3",
    question: "Which car does she choose?",
    options: [
      "The small car.",
      "The medium car.",
      "The large car.",
    ],
    correct: 1, // B
  },
  {
    id: "l-mcq-3",
    type: "listening-mcq",
    level: "A2",
    audioUrl: "/audio/listening2.mp3",
    question: "How much longer will the woman be on holiday here?",
    options: [
      "Two days.",
      "Three days.",
      "Five days.",
    ],
    correct: 2, // C
  },
  {
    id: "l-mcq-4",
    type: "listening-mcq",
    level: "A2",
    audioUrl: "/audio/listening2.mp3",
    question: "Who will drive the car?",
    options: [
      "The woman and her husband.",
      "The woman and her son.",
      "The woman only.",
    ],
    correct: 2, // C
  },
  // --- B1: Stonehenge (listening1.mp3) ---
  {
    id: "l-mcq-5",
    type: "listening-mcq",
    level: "B1",
    audioUrl: "/audio/listening1.mp3",
    question: "Why was Stonehenge built here?",
    options: [
      "Because it’s a strategic point.",
      "We don't know.",
      "Because there are rivers near the place.",
    ],
    correct: 1, // B
  },
  {
    id: "l-mcq-6",
    type: "listening-mcq",
    level: "B1",
    audioUrl: "/audio/listening1.mp3",
    question: "Stonehenge was built ...",
    options: [
      "5,000 years ago",
      "2,500 BC",
      "2,500 years ago",
    ],
    correct: 1, // B
  },
  {
    id: "l-mcq-7",
    type: "listening-mcq",
    level: "B1",
    audioUrl: "/audio/listening1.mp3",
    question: "What do we know about the people who built it?",
    options: [
      "The place where they lived.",
      "Nothing.",
      "We know a little about their rituals.",
    ],
    correct: 0, // A
  },
  {
    id: "l-mcq-8",
    type: "listening-mcq",
    level: "B1",
    audioUrl: "/audio/listening1.mp3",
    question: "How did they carry the stones?",
    options: [
      "Probably using animals.",
      "Probably a lot of men were needed.",
      "Using advanced technology for that time.",
    ],
    correct: 1, // B
  },
];

// ========== WRITING ==========
export const buildSentences: BuildSentence[] = [
  {
    id: "w-build-1",
    level: "B1",
    chunks: [
      "the government",
      "introduced",
      "in order to reduce",
      "several new policies",
      "air pollution",
    ],
    correct: [
      "the government",
      "introduced",
      "several new policies",
      "in order to reduce",
      "air pollution",
    ],
  },
  {
    id: "w-build-2",
    level: "C1",
    chunks: [
      "the extent to which",
      "depends largely on",
      "individuals",
      "can adapt",
      "how quickly",
      "changing circumstances",
    ],
    correct: [
      "the extent to which",
      "individuals",
      "can adapt",
      "depends largely on",
      "how quickly",
      "changing circumstances",
    ],
  },
];

export const writingRephrase: WritingRephrase = {
  id: "w-rep-1",
  type: "rephrase",
  level: "B1",
  original: "Despite the heavy rain, they decided to go hiking.",
  instruction: "Rewrite the sentence using 'although'. Keep the same meaning.",
};

export const writingShort: WritingShort = {
  id: "w-short-1",
  type: "short-writing",
  level: "B1",
  prompt:
    "Write a short email (50–70 words) to a friend explaining why you cannot meet this weekend. Suggest another time to meet.",
  minWords: 40,
  maxWords: 80,
};

// ========== SPEAKING ==========
export const speakingTasks: SpeakingTask[] = [
  {
    id: "s-read-1",
    type: "read-aloud",
    level: "B1",
    instruction: "Read the following text aloud clearly and naturally. You have 40 seconds.",
    durationSec: 40,
    textToRead:
      "A recent study has shown that physiological measurements from wearable sensors, may reveal abnormal changes linked to infections. Continuous monitoring of health through these devices, is also believed to help prevent and contain different strains of influenza. This approach could provide individuals and healthcare systems with valuable early warnings.",
  },
  {
    id: "s-pic-1",
    type: "picture-desc",
    level: "B1",
    instruction:
      "Look at the picture and describe what you see. You have 40 seconds.",
    durationSec: 40,
    imageUrl: "/images/di1.jpg",
  },
  {
    id: "s-rts-1",
    type: "respond-situation",
    level: "B1",
    instruction:
      "Listen to the situation, then respond. Speak for up to 40 seconds.",
    durationSec: 40,
    promptAudioUrl: "/audio/rts1.mp3",
  },
];

export const allQuestions = {
  reading: [...readingMCQs, readingComprehension, readingDropdown, readingDrag],
  listening: [...listeningMCQs],
  writing: [...buildSentences, writingRephrase, writingShort],
  speaking: speakingTasks,
};
