"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface Props {
  src: string;
  allowReplay?: boolean;
  maxReplays?: number;
  onFinishedPlaying?: () => void;
}

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  src,
  allowReplay = true,
  maxReplays = 1,
  onFinishedPlaying,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [replays, setReplays] = useState(0);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setReplays(0);
    setError(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(() => setError(true));
      setPlaying(true);
    }
  };

  const replay = () => {
    if (replays >= maxReplays) return;
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => setError(true));
    setPlaying(true);
    setReplays((r) => r + 1);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => {
          setPlaying(false);
          onFinishedPlaying?.();
        }}
        onError={() => setError(true)}
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (a) setDuration(a.duration || 0);
        }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a) setCurrent(a.currentTime);
        }}
        preload="auto"
      />
      {error ? (
        <p className="text-sm text-amber-700">
          Audio file not found. Please add the file to /public/audio/.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition shrink-0"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-150"
                style={{
                  width: duration > 0 ? `${(current / duration) * 100}%` : "0%",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1 tabular-nums">
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {allowReplay && (
            <button
              onClick={replay}
              disabled={replays >= maxReplays}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <RotateCcw size={16} />
              Replay ({Math.max(0, maxReplays - replays)} left)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
