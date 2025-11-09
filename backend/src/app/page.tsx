import Link from "next/link";
import React from "react";

const steps = [
  "POST /api/syllabus/parse with course metadata + PDF(s) to create a study map",
  "POST /api/quiz with selected topics to receive a quiz payload",
  "GET  /api/health for simple uptime + configuration details"
];

const containerStyle: React.CSSProperties = {
  maxWidth: 880,
  margin: "0 auto",
  minHeight: "100vh",
  padding: "4rem 1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
};

const cardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid #e2e8f0",
  padding: "1.5rem",
  background: "#fff",
  boxShadow: "0 10px 40px rgba(15, 23, 42, 0.08)",
  listStyle: "decimal inside",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem"
};

export default function Home() {
  return (
    <main style={containerStyle}>
      <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#3b82f6" }}>
        StudyMap API
      </p>
      <h1 style={{ fontSize: 40, fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>
        Backend services powering the Syllabus {"->"} StudyMap experience.
      </h1>
      <p style={{ fontSize: 18, color: "#475569", lineHeight: 1.6 }}>
        Deploy this Next.js app to expose all Claude + syllabus parsing endpoints used by the Vite
        frontend. Endpoints return JSON and are designed to be hosted on Vercel alongside the UI.
      </p>
      <ol style={cardStyle}>
        {steps.map((step) => (
          <li key={step} style={{ color: "#334155", fontSize: 16 }}>
            {step}
          </li>
        ))}
      </ol>
      <div style={{ fontSize: 14, color: "#64748b" }}>
        Frontend repo lives in <code style={{ background: "#f1f5f9", padding: "0 0.5rem" }}>/frontend</code>. Read the
        root README for full instructions.
      </div>
      <Link
        style={{
          display: "inline-flex",
          width: "fit-content",
          textDecoration: "none",
          background: "#0f172a",
          color: "white",
          padding: "0.85rem 1.75rem",
          borderRadius: 9999,
          fontSize: 14,
          fontWeight: 600
        }}
        href="https://console.anthropic.com/"
        target="_blank"
      >
        Configure Claude API key
      </Link>
    </main>
  );
}
