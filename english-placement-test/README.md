# English Placement Test (Four Skills)

A complete, production-ready **General English Placement Test** covering Reading, Listening, Writing and Speaking.

- **Duration**: 15–25 minutes
- **Levels**: CEFR A1 → C2
- **Stack**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Deploy**: Ready for Vercel / GitHub

## Features

### Reading
- 5 Grammar & Vocabulary multiple-choice questions (A2→C1)
- 1 Dropdown Fill-in-the-Blanks (PTE-style)
- 1 Drag & Drop Fill-in-the-Blanks

### Listening
- 1 Fill-in-the-blanks from audio
- 2 Multiple-choice questions from a short talk
- Audio player with limited replays

### Writing
- Sentence rephrasing
- Short email / paragraph (50–70 words)

### Speaking
- Free talk (45s) – MediaRecorder
- Read Aloud (40s)
- Picture description (40s)
- Countdown + live recording indicator + re-record option

### Scoring
- Reading & Listening: automatic
- Writing & Speaking: heuristic estimate (ready to plug AI API)
- Overall CEFR level + per-skill breakdown + feedback

## Quick Start

```bash
cd english-placement-test
npm install
npm run dev
```

Open http://localhost:3000

## Add Real Media

1. Put short MP3 files in `public/audio/`:
   - `listening1.mp3`
   - `listening2.mp3`
2. Put a picture in `public/images/speaking-picture.jpg`
3. Update paths in `src/data/questions.ts` if needed.

## Deploy to Vercel

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial English Placement Test"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/english-placement-test.git
git push -u origin main

# Then import the repo in vercel.com → Deploy
```

Or:

```bash
npx vercel
```

## Next Steps for Production

1. **AI Scoring**: Send writing text + transcribed speech to OpenAI / Claude / Gemini for accurate CEFR + feedback.
2. **Speech-to-Text**: Use Web Speech API or Whisper API for speaking evaluation.
3. **Backend**: Save results to a database (Supabase / PlanetScale) and email the user.
4. **Adaptive**: Make question difficulty change based on early answers.
5. **Admin Panel**: Review pending Writing/Speaking submissions.
6. **Analytics**: Track completion rates and average levels.

## Project Structure

```
src/
  app/           → Next.js App Router
  components/    → UI components (TestApp, AudioRecorder, etc.)
  data/          → All questions & tasks
  lib/           → Scoring logic
public/
  audio/         → Listening files
  images/        → Speaking picture
```

## License

MIT – free to use and modify.
