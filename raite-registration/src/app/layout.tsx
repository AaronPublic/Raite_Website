import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/chatbot/Chatbot";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
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
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans text-foreground bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider appearance={{ theme: shadcn }}>
            <Navbar />
            <main className="flex-1">
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

