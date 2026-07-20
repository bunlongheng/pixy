import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Pixy Shapes - pixel shape drawing for kids",
    description:
        "A Minecraft-pixelated shape editor for iPad and Apple Pencil. Add shapes, move and resize them, paint colors, and export your drawing to Photos.",
    openGraph: {
        title: "Pixy Shapes",
        description: "Pixel-art shape drawing for kids - iPad + Apple Pencil, export to Photos.",
        type: "website",
    },
    robots: { index: true, follow: true },
    appleWebApp: { capable: true, title: "Pixy Shapes", statusBarStyle: "default" },
};

export const viewport = {
    themeColor: "#e8eaf0",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
