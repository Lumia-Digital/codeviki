import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeViki — Intelligent Code Documentation",
  description: "Experience the next generation of code documentation. CodeViki transforms complex codebases into beautiful, interactive, and AI-powered documentation tailored for premium developer experiences.",
  keywords: "code documentation, AI, github, API docs, developer tools, premium, CodeViki",
};

import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
