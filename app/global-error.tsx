"use client";

// Root (html-level) error boundary. Light theme to match the app; self-contained
// inline styles since globals.css may not have loaded when this renders.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "18px",
                    background: "#fafafa",
                    color: "#1d1d1f",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    textAlign: "center",
                    padding: "24px",
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
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    </svg>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>Something went wrong</h2>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: "10px 20px",
                        background: "#1d1d1f",
                        color: "#fff",
                        fontWeight: 600,
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Try again
                </button>
            </body>
        </html>
    );
}
