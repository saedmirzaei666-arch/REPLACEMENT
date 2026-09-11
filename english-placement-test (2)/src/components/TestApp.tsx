"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import ProgressBar from "./ProgressBar";
import AudioPlayer from "./AudioPlayer";
import AudioRecorder from "./AudioRecorder";
import {
  readingMCQs,
  readingDropdown,
  readingDrag,
  listeningMCQs,
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
  const [dropdownAnswers, setDropdownAnswers] = useState<string[]>(["", "", "", ""]);
  const [dragAnswers, setDragAnswers] = useState<(string | null)[]>([null, null, null, null, null]);
  const [dragBank, setDragBank] = useState<string[]>([...readingDrag.wordBank]);

  const [listeningMcqAnswers, setListeningMcqAnswers] = useState<Record<string, number>>({});

  const [rephraseText, setRephraseText] = useState("");
  const [shortWriting, setShortWriting] = useState("");

  const [speakingBlobs, setSpeakingBlobs] = useState<(Blob | null)[]>([null, null, null]);

  const [result, setResult] = useState<OverallResult | null>(null);

  const totalReadingSteps = 3;
  const totalWritingSteps = 2;
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

  const finishTest = useCallback(() => {
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
    setResult(overall);
    setSection("result");
  }, [
    mcqAnswers,
    dropdownAnswers,
    dragAnswers,
    listeningMcqAnswers,
    rephraseText,
    shortWriting,
    speakingBlobs,
  ]);

  if (section === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            English Placement Test
          </h1>
          <p className="text-slate-600 mb-6">
            Four-skills English placement test (Reading, Listening, Writing, Speaking)
          </p>

          <div className="space-y-3 text-sm text-slate-700 mb-8">
            <p>⏱️ Approximate duration: <strong>15–25 minutes</strong></p>
            <p>📊 CEFR levels from A1 to C2</p>
            <p>✅ Reading and Listening are scored instantly</p>
            <p>🎤 Microphone required for Speaking</p>
            <p>📱 Works on mobile and desktop</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-8">
            <strong>Note:</strong> Make sure audio files are placed in <code>public/audio/</code> before taking the test.
          </div>

          <button
            onClick={() => setSection("reading")}
            className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition shadow-md"
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
                onClick={() => setReadingStep(0)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                onClick={() => setReadingStep(2)}
                disabled={dropdownAnswers.some((a) => !a)}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {readingStep === 2 && (
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
                onClick={() => setReadingStep(1)}
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
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ProgressBar
          current={writingStep + 1}
          total={totalWritingSteps}
          sectionName="Writing"
        />

        {writingStep === 0 && (
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
              onClick={() => setWritingStep(1)}
              disabled={rephraseText.trim().length < 5}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {writingStep === 1 && (
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
                onClick={() => setWritingStep(0)}
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
              disabled={!speakingBlobs[speakingStep]}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium disabled:opacity-40"
            >
              {speakingStep < speakingTasks.length - 1
                ? "Next Speaking Task →"
                : "Finish Test & See Results"}
            </button>
          </div>
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
