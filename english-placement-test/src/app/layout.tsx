import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Placement Test | تعیین سطح زبان انگلیسی",
  description: "A free, fast and accurate four-skills English placement test (Reading, Listening, Writing, Speaking). CEFR aligned. 15-25 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
