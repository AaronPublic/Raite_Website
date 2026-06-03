import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/chatbot/Chatbot";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RAITE Registration",
  description: "Event registration platform for PSITE Region III",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

import { PageTransition } from "@/components/PageTransition";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("RootLayout: Rendering");
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col transition-colors duration-300 bg-white dark:bg-gray-950">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider appearance={{ theme: shadcn }}>
            <Navbar />
            <main className="flex-1 overflow-hidden">
              <PageTransition>{children}</PageTransition>
            </main>
            <Chatbot />
            <Toaster position="top-center" richColors />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
