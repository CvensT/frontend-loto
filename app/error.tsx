"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
        <h2>Une erreur est survenue</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {error?.message || "Erreur inconnue"}
        </pre>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 12,
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        >
          Recharger
        </button>
      </body>
    </html>
  );
}
