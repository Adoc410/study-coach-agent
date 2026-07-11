import "./globals.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "AI Study Coach",
  description:
    "Your personal AI-powered study assistant. Get explanations, take quizzes, and track your learning progress.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
