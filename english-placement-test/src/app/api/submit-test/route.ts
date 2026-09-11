import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Submission = {
  candidate: {
    fullName: string;
    age: string;
    targetExam: string;
    telegramId: string;
    phone: string;
  };
  reading: {
    grammarAndVocabulary: { question: string; answer: string; correct: boolean }[];
    comprehension: { question: string; answer: string; correct: boolean };
    dropdownAnswers: string[];
    dragAndDropAnswers: (string | null)[];
  };
  listening: { question: string; answer: string; correct: boolean }[];
  writing: {
    buildSentences: string[];
    rephrase: string;
    shortWriting: string;
  };
  automaticResult: {
    overallLevel: string;
    skills: { skill: string; rawScore: number; maxScore: number; percentage: number; level: string }[];
  };
};

const telegramRequest = async (token: string, method: string, body: FormData) => {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    body,
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram ${method} failed.`);
  }
};

const addStatus = (correct: boolean) => (correct ? "✅" : "❌");

function formatSubmission(data: Submission) {
  const readingMcqs = data.reading.grammarAndVocabulary
    .map((item, index) => `${index + 1}. ${item.question}\nAnswer: ${item.answer} ${addStatus(item.correct)}`)
    .join("\n\n");
  const listening = data.listening
    .map((item, index) => `${index + 1}. ${item.question}\nAnswer: ${item.answer} ${addStatus(item.correct)}`)
    .join("\n\n");
  const scores = data.automaticResult.skills
    .map((score) => `${score.skill}: ${score.rawScore}/${score.maxScore} (${score.percentage}%) — ${score.level}`)
    .join("\n");

  return [
    "📝 NEW PTE ROOM PLACEMENT TEST",
    "",
    `Name: ${data.candidate.fullName}`,
    `Age: ${data.candidate.age}`,
    `Target exam: ${data.candidate.targetExam}`,
    `Telegram: ${data.candidate.telegramId}`,
    `Phone: ${data.candidate.phone}`,
    "",
    `AUTOMATIC RESULT\nOverall CEFR: ${data.automaticResult.overallLevel}\n${scores}`,
    "",
    `READING — GRAMMAR & VOCABULARY\n${readingMcqs}`,
    "",
    `READING — COMPREHENSION\n${data.reading.comprehension.question}\nAnswer: ${data.reading.comprehension.answer} ${addStatus(data.reading.comprehension.correct)}`,
    "",
    `READING — DROPDOWN\n${data.reading.dropdownAnswers.join(" | ")}`,
    "",
    `READING — DRAG & DROP\n${data.reading.dragAndDropAnswers.join(" | ")}`,
    "",
    `LISTENING\n${listening}`,
    "",
    `WRITING — BUILD A SENTENCE\n1. ${data.writing.buildSentences[0]}\n2. ${data.writing.buildSentences[1]}`,
    "",
    `WRITING — REPHRASE\n${data.writing.rephrase}`,
    "",
    `WRITING — SHORT RESPONSE\n${data.writing.shortWriting}`,
  ].join("\n");
}

function splitTelegramMessage(text: string, maxLength = 3800) {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n", maxLength);
    if (splitAt < maxLength * 0.6) splitAt = maxLength;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n+/, "");
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json(
      { error: "Telegram delivery has not been configured by the administrator." },
      { status: 503 }
    );
  }

  try {
    const incoming = await request.formData();
    const rawSubmission = incoming.get("submission");
    if (typeof rawSubmission !== "string") {
      return NextResponse.json({ error: "Submission data is missing." }, { status: 400 });
    }

    const submission = JSON.parse(rawSubmission) as Submission;
    const recordings = incoming
      .getAll("recordings")
      .filter((entry): entry is File => entry instanceof File);

    for (const text of splitTelegramMessage(formatSubmission(submission))) {
      const messageBody = new FormData();
      messageBody.append("chat_id", chatId);
      messageBody.append("text", text);
      await telegramRequest(token, "sendMessage", messageBody);
    }

    for (let index = 0; index < recordings.length; index += 1) {
      const audioBody = new FormData();
      audioBody.append("chat_id", chatId);
      audioBody.append("audio", recordings[index], recordings[index].name);
      audioBody.append(
        "caption",
        `${submission.candidate.fullName} — Speaking task ${index + 1}`
      );
      await telegramRequest(token, "sendAudio", audioBody);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Test submission failed:", error);
    return NextResponse.json(
      { error: "The results could not be delivered to PTE ROOM. Please try again." },
      { status: 502 }
    );
  }
}
