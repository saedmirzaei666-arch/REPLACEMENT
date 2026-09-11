"use client";

import { useRef, useState, useEffect } from "react";
import { Mic, Square, RotateCcw, Check } from "lucide-react";
import Timer from "./Timer";

interface Props {
  durationSec: number;
  onComplete: (blob: Blob | null) => void;
  instruction: string;
  extraContent?: React.ReactNode;
}

export default function AudioRecorder({
  durationSec,
  onComplete,
  instruction,
  extraContent,
}: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<"idle" | "recording" | "done" | "error">("idle");
  const [countdown, setCountdown] = useState(3);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const startCountdown = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasPermission(true);
      setStatus("idle");
      setCountdown(3);

      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            beginRecording(stream);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      setHasPermission(false);
      setStatus("error");
    }
  };

  const beginRecording = (stream: MediaStream) => {
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setStatus("done");
      onComplete(blob);
      stream.getTracks().forEach((t) => t.stop());
    };

    mr.start();
    setStatus("recording");
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const reset = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setStatus("idle");
    setCountdown(3);
    onComplete(null);
  };

  if (hasPermission === false || status === "error") {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        Microphone access is required. Please allow microphone permission and refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-700 leading-relaxed">{instruction}</p>
      {extraContent}

      {status === "idle" && countdown === 3 && (
        <button
          onClick={startCountdown}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition"
        >
          <Mic size={20} />
          Start Recording
        </button>
      )}

      {status === "idle" && countdown < 3 && countdown > 0 && (
        <div className="text-center py-8">
          <div className="text-5xl font-bold text-primary-600">{countdown}</div>
          <p className="text-slate-500 mt-2">Get ready...</p>
        </div>
      )}

      {status === "recording" && (
        <div className="flex flex-col items-center gap-4 p-6 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center gap-2 text-red-600 font-medium">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Recording...
          </div>
          <Timer
            seconds={durationSec}
            onTimeUp={stopRecording}
            label="Time left"
          />
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Square size={18} />
            Stop
          </button>
        </div>
      )}

      {status === "done" && blobUrl && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <Check size={18} />
            Recording saved
          </div>
          <audio src={blobUrl} controls className="w-full" />
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary-600"
          >
            <RotateCcw size={16} />
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}
