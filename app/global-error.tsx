"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#fffaf4",
          color: "#3d2521",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#765f59", lineHeight: 1.6, margin: "0 0 24px" }}>
            The page failed to load. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "0 24px",
              borderRadius: 999,
              border: "1px solid #ef665f",
              background: "#ef665f",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
