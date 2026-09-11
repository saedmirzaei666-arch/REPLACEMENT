import TestApp from "@/components/TestApp";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-primary-700 text-lg">English Placement Test</span>
          <span className="text-xs text-slate-500 hidden sm:inline">CEFR A1–C2 · 15–25 min</span>
        </div>
      </header>
      <TestApp />
    </main>
  );
}
