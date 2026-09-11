"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import ProgressBar from "./ProgressBar";
import AudioPlayer from "./AudioPlayer";
import AudioRecorder from "./AudioRecorder";
import { convertAudioToMp3 } from "@/lib/audioToMp3";
import {
  readingMCQs,
  readingComprehension,
  readingDropdown,
  readingDrag,
  listeningMCQs,
  buildSentences,
  writingRephrase,
  writingShort,
  speakingTasks,
} from "@/data/questions";
import {
  calculateReadingScore,
  calculateListeningScore,
  getOverallLevel,
  generateFeedback,
  type OverallResult,
  type SkillScore,
} from "@/lib/scoring";

type Section = "intro" | "reading" | "listening" | "writing" | "speaking" | "result";

const SECTIONS: Section[] = ["intro", "reading", "listening", "writing", "speaking", "result"];

export default function TestApp() {
  const [section, setSection] = useState<Section>("intro");
  const [readingStep, setReadingStep] = useState(0);
  const [listeningGroupIdx, setListeningGroupIdx] = useState(0);
  const [writingStep, setWritingStep] = useState(0);
  const [speakingStep, setSpeakingStep] = useState(0);

  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [comprehensionAnswer, setComprehensionAnswer] = useState<number | null>(null);
  const [dropdownAnswers, setDropdownAnswers] = useState<string[]>(["", "", "", ""]);
  const [dragAnswers, setDragAnswers] = useState<(string | null)[]>([null, null, null, null, null]);
  const [dragBank, setDragBank] = useState<string[]>([...readingDrag.wordBank]);

  const [listeningMcqAnswers, setListeningMcqAnswers] = useState<Record<string, number>>({});

  const [rephraseText, setRephraseText] = useState("");
  const [shortWriting, setShortWriting] = useState("");
  const [builtSentences, setBuiltSentences] = useState<string[][]>(
    buildSentences.map(() => [])
  );

  const [speakingBlobs, setSpeakingBlobs] = useState<(Blob | null)[]>([null, null, null]);

  const [userName, setUserName] = useState("");
  const [userAge, setUserAge] = useState("");
  const [userExam, setUserExam] = useState("");
  const [userTelegram, setUserTelegram] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const [result, setResult] = useState<OverallResult | null>(null);

  const totalReadingSteps = 4;
  const totalWritingSteps = 3;
  const totalSpeakingSteps = speakingTasks.length;

  // Group listening questions by their shared audio file, in the order they
  // first appear, so the user listens to each audio once and then answers
  // all of that audio's questions together.
  const listeningGroups = useMemo(() => {
    const groups: { audioUrl: string; questions: typeof listeningMCQs }[] = [];
    listeningMCQs.forEach((q) => {
      let g = groups.find((g) => g.audioUrl === q.audioUrl);
      if (!g) {
        g = { audioUrl: q.audioUrl, questions: [] };
        groups.push(g);
      }
      g.questions.push(q);
    });
    return groups;
  }, []);

  // Object URLs so the speaking recordings can be downloaded from the
  // results screen (kept for the tester's own reference).
  const speakingBlobUrls = useMemo(
    () => speakingBlobs.map((b) => (b ? URL.createObjectURL(b) : null)),
    [speakingBlobs]
  );
  useEffect(() => {
    return () => {
      speakingBlobUrls.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [speakingBlobUrls]);

  const goNextSection = () => {
    const idx = SECTIONS.indexOf(section);
    if (idx < SECTIONS.length - 1) {
      setSection(SECTIONS[idx + 1]);
    }
  };

  const handleMcqSelect = (id: string, optionIdx: number) => {
    setMcqAnswers((prev) => ({ ...prev, [id]: optionIdx }));
  };

  const checkReadingAnswers = () => {
    const answers: Record<string, any> = {};
    readingMCQs.forEach((q) => {
      answers[q.id] = mcqAnswers[q.id] === q.correct;
    });
    answers[readingComprehension.id] = comprehensionAnswer === readingComprehension.correct;
    answers["r-dd-1"] = readingDropdown.correct.map((c, i) => dropdownAnswers[i] === c);
    answers["r-drag-1"] = readingDrag.correct.map((c, i) => dragAnswers[i] === c);
    return answers;
  };

  const onDragStart = (e: React.DragEvent, word: string, fromBank: boolean, idx?: number) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ word, fromBank, idx }));
  };

  const onDropBlank = (e: React.DragEvent, blankIdx: number) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const { word, fromBank, idx } = data;

    setDragAnswers((prev) => {
      const next = [...prev];
      if (next[blankIdx]) {
        setDragBank((b) => [...b, next[blankIdx]!]);
      }
      next[blankIdx] = word;
      return next;
    });

    if (fromBank) {
      setDragBank((b) => b.filter((w) => w !== word));
    } else if (typeof idx === "number") {
      setDragAnswers((prev) => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
    }
  };

  const removeFromBlank = (blankIdx: number) => {
    setDragAnswers((prev) => {
      const next = [...prev];
      if (next[blankIdx]) {
        setDragBank((b) => [...b, next[blankIdx]!]);
        next[blankIdx] = null;
      }
      return next;
    });
  };

  const finishTest = useCallback(async () => {
    setIsSubmitting(true);
    setSubmissionError("");
    const readingAns = checkReadingAnswers();
    const readingScore = calculateReadingScore(readingAns);

    const listeningAns: Record<string, any> = {};
    listeningMCQs.forEach((q) => {
      listeningAns[q.id] = listeningMcqAnswers[q.id] === q.correct;
    });
    const listeningScore = calculateListeningScore(listeningAns);

    const skills: SkillScore[] = [readingScore, listeningScore];
    const overall: OverallResult = {
      overallLevel: getOverallLevel(skills),
      skills,
      pendingSkills: ["writing", "speaking"],
      feedback: "",
      timestamp: new Date().toISOString(),
    };
    overall.feedback = generateFeedback(overall);

    try {
      const submission = {
        candidate: {
          fullName: userName.trim(),
          age: userAge,
          targetExam: userExam,
          telegramId: userTelegram.trim(),
          phone: userPhone.trim(),
        },
        reading: {
          grammarAndVocabulary: readingMCQs.map((question) => ({
            question: question.question,
            answer:
              mcqAnswers[question.id] === undefined
                ? "No answer"
                : question.options[mcqAnswers[question.id]],
            correct: mcqAnswers[question.id] === question.correct,
          })),
          comprehension: {
            question: readingComprehension.question,
            answer:
              comprehensionAnswer === null
                ? "No answer"
                : readingComprehension.options[comprehensionAnswer],
            correct: comprehensionAnswer === readingComprehension.correct,
          },
          dropdownAnswers,
          dragAndDropAnswers: dragAnswers,
        },
        listening: listeningMCQs.map((question) => ({
          question: question.question,
          answer:
            listeningMcqAnswers[question.id] === undefined
              ? "No answer"
              : question.options[listeningMcqAnswers[question.id]],
          correct: listeningMcqAnswers[question.id] === question.correct,
        })),
        writing: {
          buildSentences: builtSentences.map((sentence) => sentence.join(" ")),
          rephrase: rephraseText,
          shortWriting,
        },
        automaticResult: overall,
      };

      const formData = new FormData();
      formData.append("submission", JSON.stringify(submission));

      const mp3Recordings = await Promise.all(
        speakingBlobs.map(async (blob, index) => {
          if (!blob) return null;
          const mp3 = await convertAudioToMp3(blob);
          formData.append(
            "recordings",
            mp3,
            `${userName.trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || "candidate"}-speaking-${index + 1}.mp3`
          );
          return mp3;
        })
      );

      if (mp3Recordings.some((recording) => !recording)) {
        throw new Error("One or more speaking recordings are missing.");
      }

      const response = await fetch("/api/submit-test", {
        method: "POST",
        body: formData,
      });
      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseBody.error || "The results could not be sent.");
      }

      setResult(overall);
      setSection("result");
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "The results could not be sent. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mcqAnswers,
    dropdownAnswers,
    dragAnswers,
    listeningMcqAnswers,
    rephraseText,
    shortWriting,
    speakingBlobs,
    builtSentences,
    comprehensionAnswer,
    userName,
    userAge,
    userExam,
    userTelegram,
    userPhone,
  ]);

  if (section === "intro") {
    const canStart =
      userName.trim().length >= 2 &&
      userAge &&
      userExam &&
      userTelegram.trim().length >= 2 &&
      userPhone.trim().length >= 6;

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col items-center mb-6">
            <img
              src="/images/pteroom.jpg"
              alt="PTE ROOM"
              className="h-20 w-auto object-contain mb-3"
            />
            <h1 className="text-2xl font-bold text-slate-900 text-center">
              English Placement Test
            </h1>
            <p className="text-slate-500 text-sm text-center mt-1">
              Four skills · CEFR A1–C2 · 15–25 minutes
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Age
              </label>
              <select
                value={userAge}
                onChange={(e) => setUserAge(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none bg-white"
              >
                <option value="">Select age range</option>
                <option value="19-26">19–26</option>
                <option value="27-33">27–33</option>
                <option value="34-40">34–40</option>
                <option value="40+">40+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Exam
              </label>
              <select
                value={userExam}
                onChange={(e) => setUserExam(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none bg-white"
              >
                <option value="">Select exam</option>
                <option value="PTE">PTE</option>
                <option value="IELTS">IELTS</option>
                <option value="TOEFL">TOEFL</option>
                <option value="CELPIP">CELPIP</option>
                <option value="GENERAL ENGLISH">GENERAL ENGLISH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telegram ID
              </label>
              <input
                type="text"
                value={userTelegram}
                onChange={(e) => setUserTelegram(e.target.value)}
                placeholder="@username"
                autoComplete="off"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="Include country code, e.g. +39..."
                autoComplete="tel"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-600 mb-6">
            <p>✅ Reading & Listening scored instantly</p>
            <p>🎤 Microphone required for Speaking</p>
            <p>📱 Works on mobile and desktop</p>
          </div>

          <button
            onClick={() => setSection("reading")}
            disabled={!canStart}
            className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start the Test
          </button>
        </div>
      </div>
    );
  }

  if (section === "reading") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ProgressBar current={readingStep + 1} total={totalReadingSteps} sectionName="Reading" />

        {readingStep === 0 && (
          <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
            <h2 className="text-xl font-bold">Grammar & Vocabulary</h2>
            <p className="text-sm text-slate-500">Choose the best option for each sentence.</p>
            {readingMCQs.map((q) => (
              <div key={q.id} className="space-y-2">
                <p className="font-medium text-slate-800">{q.question}</p>
                <div className="grid gap-2">
                  {q.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        mcqAnswers[q.id] === idx
                          ? "border-primary-500 bg-primary-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={mcqAnswers[q.id] === idx}
                        onChange={() => handleMcqSelect(q.id, idx)}
                        className="accent-primary-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => setReadingStep(1)}
              disabled={Object.keys(mcqAnswers).length < readingMCQs.length}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-700"
            >
              Next →
            </button>
          </div>
        )}

        {readingStep === 1 && (
          <div className="bg-white/95 rounded-2xl shadow border p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold">Reading Comprehension</h2>
              <p className="text-sm text-slate-500 mt-1">Read the passage and choose the best answer.</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border text-slate-800 leading-7">
              {readingComprehension.passage}
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-slate-900">{readingComprehension.question}</p>
              <div className="grid gap-2">
                {readingComprehension.options.map((option, index) => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      comprehensionAnswer === index
                        ? "border-primary-500 bg-primary-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={readingComprehension.id}
                      checked={comprehensionAnswer === index}
                      onChange={() => setComprehensionAnswer(index)}
                      className="accent-primary-600"
                    />
                    <span>{String.fromCharCode(65 + index)}) {option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReadingStep(0)} className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50">
                ← Back
              </button>
              <button
                onClick={() => setReadingStep(2)}
                disabled={comprehensionAnswer === null}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {readingStep === 2 && (
          <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
            <h2 className="text-xl font-bold">Reading – Fill in the Blanks (Dropdown)</h2>
            <p className="text-sm text-slate-500">Select the best word for each blank.</p>
            <div className="leading-8 text-slate-800">
              {readingDropdown.text.split("{{blank}}").map((part, i) => (
                <span key={i}>
                  {part}
                  {i < readingDropdown.options.length && (
                    <select
                      value={dropdownAnswers[i]}
                      onChange={(e) => {
                        const next = [...dropdownAnswers];
                        next[i] = e.target.value;
                        setDropdownAnswers(next);
                      }}
                      className="mx-1 px-2 py-1 border border-slate-300 rounded-md bg-white text-primary-700 font-medium focus:ring-2 focus:ring-primary-400 outline-none"
                    >
                      <option value="">— select —</option>
                      {readingDropdown.options[i].map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReadingStep(1)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                onClick={() => setReadingStep(3)}
                disabled={dropdownAnswers.some((a) => !a)}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {readingStep === 3 && (
          <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
            <h2 className="text-xl font-bold">Reading – Drag & Drop Fill in the Blanks</h2>
            <p className="text-sm text-slate-500">
              Drag words from the bank into the blanks. Click a filled blank to remove it.
            </p>

            <div className="leading-9 text-slate-800 text-lg">
              {readingDrag.text.split("{{blank}}").map((part, i) => (
                <span key={i}>
                  {part}
                  {i < readingDrag.correct.length && (
                    <span
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDropBlank(e, i)}
                      onClick={() => removeFromBlank(i)}
                      className={`inline-block min-w-[100px] mx-1 px-3 py-1 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
                        dragAnswers[i]
                          ? "border-primary-400 bg-primary-50 text-primary-800 font-medium"
                          : "border-slate-300 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {dragAnswers[i] || "drop here"}
                    </span>
                  )}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border">
              <span className="text-sm text-slate-500 w-full mb-1">Word bank:</span>
              {dragBank.map((word) => (
                <span
                  key={word}
                  draggable
                  onDragStart={(e) => onDragStart(e, word, true)}
                  className="drag-item px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-primary-400"
                >
                  {word}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReadingStep(2)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                onClick={goNextSection}
                disabled={dragAnswers.some((a) => !a)}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
              >
                Finish Reading → Listening
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (section === "listening") {
    const group = listeningGroups[listeningGroupIdx];
    const isLastGroup = listeningGroupIdx === listeningGroups.length - 1;
    const allAnswered = group.questions.every(
      (q) => listeningMcqAnswers[q.id] !== undefined
    );

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ProgressBar
          current={listeningGroupIdx + 1}
          total={listeningGroups.length}
          sectionName="Listening"
        />

        <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
          <h2 className="text-xl font-bold">
            Listening – Part {listeningGroupIdx + 1} of {listeningGroups.length}
          </h2>
          <p className="text-sm text-slate-500">
            Listen to the audio and answer all the questions below.
          </p>

          <AudioPlayer
            key={listeningGroupIdx}
            src={group.audioUrl}
            maxReplays={1}
          />

          {group.questions.map((q, qIdx) => (
            <div key={q.id} className="space-y-2 pt-2 border-t border-slate-100">
              <p className="font-medium text-slate-800 text-lg">
                {qIdx + 1}. {q.question}
              </p>
              <div className="grid gap-2">
                {q.options.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      listeningMcqAnswers[q.id] === idx
                        ? "border-primary-500 bg-primary-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={listeningMcqAnswers[q.id] === idx}
                      onChange={() =>
                        setListeningMcqAnswers((prev) => ({
                          ...prev,
                          [q.id]: idx,
                        }))
                      }
                      className="accent-primary-600"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            {listeningGroupIdx > 0 && (
              <button
                onClick={() => setListeningGroupIdx((g) => g - 1)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => {
                if (!isLastGroup) {
                  setListeningGroupIdx((g) => g + 1);
                } else {
                  goNextSection();
                }
              }}
              disabled={!allAnswered}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-primary-700"
            >
              {!isLastGroup ? "Next Part →" : "Finish Listening → Writing"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "writing") {
    const allBuildSentencesComplete = builtSentences.every(
      (sentence, index) => sentence.length === buildSentences[index].chunks.length
    );

    const addSentenceChunk = (sentenceIndex: number, chunk: string) => {
      setBuiltSentences((previous) => {
        const next = previous.map((sentence) => [...sentence]);
        next[sentenceIndex].push(chunk);
        return next;
      });
    };

    const removeSentenceChunk = (sentenceIndex: number, chunkIndex: number) => {
      setBuiltSentences((previous) => {
        const next = previous.map((sentence) => [...sentence]);
        next[sentenceIndex].splice(chunkIndex, 1);
        return next;
      });
    };

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ProgressBar
          current={writingStep + 1}
          total={totalWritingSteps}
          sectionName="Writing"
        />

        {writingStep === 0 && (
          <div className="bg-white/95 rounded-2xl shadow border p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold">Writing – Build a Sentence</h2>
              <p className="text-sm text-slate-500 mt-1">Select the parts in the correct order to build each sentence.</p>
            </div>
            {buildSentences.map((task, sentenceIndex) => {
              const selected = builtSentences[sentenceIndex];
              const remaining = task.chunks.filter((chunk) => !selected.includes(chunk));
              return (
                <div key={task.id} className="space-y-3 pt-4 border-t border-slate-100 first:border-0 first:pt-0">
                  <p className="font-semibold text-slate-800">{sentenceIndex + 1}.</p>
                  <div className="min-h-16 p-3 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/60 flex flex-wrap gap-2 items-center">
                    {selected.length === 0 && <span className="text-sm text-slate-400">Your sentence will appear here.</span>}
                    {selected.map((chunk, chunkIndex) => (
                      <button
                        key={`${chunk}-${chunkIndex}`}
                        type="button"
                        onClick={() => removeSentenceChunk(sentenceIndex, chunkIndex)}
                        className="px-3 py-2 bg-white border border-primary-300 rounded-lg text-slate-800 hover:border-red-300"
                        title="Remove this part"
                      >
                        {chunk}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {remaining.map((chunk) => (
                      <button
                        key={chunk}
                        type="button"
                        onClick={() => addSentenceChunk(sentenceIndex, chunk)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-primary-400"
                      >
                        {chunk}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => setWritingStep(1)}
              disabled={!allBuildSentencesComplete}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {writingStep === 1 && (
          <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
            <h2 className="text-xl font-bold">Writing – Rephrase</h2>
            <p className="text-sm text-slate-500">{writingRephrase.instruction}</p>
            <div className="p-4 bg-slate-50 rounded-xl border text-slate-800 font-medium">
              {writingRephrase.original}
            </div>
            <textarea
              value={rephraseText}
              onChange={(e) => setRephraseText(e.target.value)}
              rows={3}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none resize-none"
              placeholder="Write your rephrased sentence here..."
            />
            <button
              onClick={() => setWritingStep(2)}
              disabled={rephraseText.trim().length < 5}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {writingStep === 2 && (
          <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
            <h2 className="text-xl font-bold">Writing – Short Email / Paragraph</h2>
            <p className="text-slate-700">{writingShort.prompt}</p>
            <p className="text-sm text-slate-500">
              Target: {writingShort.minWords}–{writingShort.maxWords} words
            </p>
            <textarea
              value={shortWriting}
              onChange={(e) => setShortWriting(e.target.value)}
              rows={6}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none resize-y"
              placeholder="Start writing..."
            />
            <p className="text-sm text-slate-500">
              Word count:{" "}
              {shortWriting.trim().split(/\s+/).filter(Boolean).length}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setWritingStep(1)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl"
              >
                ← Back
              </button>
              <button
                onClick={goNextSection}
                disabled={
                  shortWriting.trim().split(/\s+/).filter(Boolean).length < 25
                }
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
              >
                Finish Writing → Speaking
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (section === "speaking") {
    const task = speakingTasks[speakingStep];
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ProgressBar
          current={speakingStep + 1}
          total={totalSpeakingSteps}
          sectionName="Speaking"
        />

        <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
          <h2 className="text-xl font-bold">
            Speaking Task {speakingStep + 1}:{" "}
            {task.type === "read-aloud"
              ? "Read Aloud"
              : task.type === "picture-desc"
              ? "Picture Description"
              : task.type === "respond-situation"
              ? "Respond to a Situation"
              : "Speaking"}
          </h2>

          <AudioRecorder
            key={task.id}
            durationSec={task.durationSec}
            instruction={task.instruction}
            onComplete={(blob) => {
              setSpeakingBlobs((prev) => {
                const next = [...prev];
                next[speakingStep] = blob;
                return next;
              });
            }}
            extraContent={
              <>
                {task.promptAudioUrl && (
                  <div className="my-4 space-y-2">
                    <p className="text-sm font-medium text-slate-600">Listen to the situation first:</p>
                    <AudioPlayer src={task.promptAudioUrl} maxReplays={1} />
                  </div>
                )}
                {task.textToRead && (
                  <div className="p-4 bg-slate-50 rounded-xl border text-slate-800 leading-relaxed my-4">
                    {task.textToRead}
                  </div>
                )}
                {task.imageUrl && (
                  <div className="my-4">
                    <img
                      src={task.imageUrl}
                      alt="Describe this picture"
                      className="w-full max-h-72 object-contain rounded-xl border bg-slate-50"
                    />
                  </div>
                )}
              </>
            }
          />

          <div className="flex gap-3 pt-4">
            {speakingStep > 0 && (
              <button
                onClick={() => setSpeakingStep((s) => s - 1)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => {
                if (speakingStep < speakingTasks.length - 1) {
                  setSpeakingStep((s) => s + 1);
                } else {
                  finishTest();
                }
              }}
              disabled={!speakingBlobs[speakingStep] || isSubmitting}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
            >
              {isSubmitting
                ? "Converting audio & sending results..."
                : speakingStep < speakingTasks.length - 1
                ? "Next Speaking Task →"
                : "Finish Test & See Results"}
            </button>
          </div>
          {submissionError && (
            <div role="alert" className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
              {submissionError} Your answers are still on this page. Please try again.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === "result" && result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg border p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Results</h1>
            <p className="text-slate-500 text-sm">
              Estimated on {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="text-center py-6 bg-primary-50 rounded-2xl border border-primary-100">
            <p className="text-sm text-primary-700 mb-1">Overall CEFR Level</p>
            <p className="text-5xl font-bold text-primary-700">{result.overallLevel}</p>
          </div>

          <div className="space-y-4">
            {result.skills.map((s) => (
              <div key={s.skill} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium capitalize text-slate-800">{s.skill}</p>
                  <p className="text-sm text-slate-500">
                    {s.rawScore}/{s.maxScore} ({s.percentage}%)
                  </p>
                </div>
                <span className="px-3 py-1 bg-white border rounded-full font-semibold text-primary-700">
                  {s.level}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {result.feedback}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Writing & Speaking:</strong> These sections will be reviewed by a teacher. Results will be provided separately.
          </div>

          {speakingBlobUrls.some(Boolean) && (
            <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Speaking recordings (for teacher review):
              </p>
              {speakingBlobUrls.map(
                (url, idx) =>
                  url && (
                    <a
                      key={idx}
                      href={url}
                      download={`speaking-task-${idx + 1}.webm`}
                      className="flex items-center gap-2 text-sm text-primary-700 hover:underline"
                    >
                      Download Speaking recording {idx + 1}
                    </a>
                  )
              )}
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50"
          >
            Take the test again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
