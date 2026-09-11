"use client";

interface Props {
  current: number;
  total: number;
  sectionName: string;
}

export default function ProgressBar({ current, total, sectionName }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-sm text-slate-600 mb-1">
        <span className="font-medium">{sectionName}</span>
        <span>
          {current} / {total} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
