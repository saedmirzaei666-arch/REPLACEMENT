"use client";

import { useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface Props {
  src: string;
  allowReplay?: boolean;
  maxReplays?: number;
}

export default function AudioPlayer({ src, allowReplay = true, maxReplays = 1 }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [replays, setReplays] = useState(0);
  const [error, setError] = useState(false);

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
    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
        preload="auto"
      />
      {error ? (
        <p className="text-sm text-amber-700">
          Audio file not found (placeholder). In production add real files to /public/audio/.
        </p>
      ) : (
        <>
          <button
            onClick={toggle}
            className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>
          {allowReplay && (
            <button
              onClick={replay}
              disabled={replays >= maxReplays}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} />
              Replay ({maxReplays - replays} left)
            </button>
          )}
        </>
      )}
    </div>
  );
}
