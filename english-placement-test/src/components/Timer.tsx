"use client";

import { useEffect, useState } from "react";

interface Props {
  seconds: number;
  onTimeUp?: () => void;
  label?: string;
}

export default function Timer({ seconds, onTimeUp, label = "Time remaining" }: Props) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp?.();
      return;
    }
    const t = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [remaining, onTimeUp]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining <= 10;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        isLow ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
      }`}
    >
      <span>{label}:</span>
      <span className="tabular-nums">
        {mins}:{secs.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
