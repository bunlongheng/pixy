"use client";

// Route-level error boundary. Light theme + inline styles to match the app
// (this app ships no Tailwind, so utility classes would render as no-ops).
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                background: "#fafafa",
                color: "#1d1d1f",
                padding: 24,
                textAlign: "center",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
            }}
        >
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "rgba(0,122,255,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                aria-hidden
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.4 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: "#6e6e73", maxWidth: 360, margin: 0, lineHeight: 1.5 }}>
                The device preview hit a snag. Nothing was lost - just retry the URL.
            </p>
            <button
                onClick={() => reset()}
                style={{
                    padding: "10px 20px",
                    background: "#1d1d1f",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 14,
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: -0.2,
                }}
            >
                Try again
            </button>
        </div>
    );
}
