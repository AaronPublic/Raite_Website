import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/chatbot/Chatbot";
import ProfileCheckModal from "@/components/ProfileCheckModal";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { PageTransition } from "@/components/PageTransition";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#07142F" },
  ],
};

export const metadata: Metadata = {
  title: "RAITE Registration",
  description: "Event registration platform for PSITE Region III",
  icons: {
    icon: "/RAITE.png",
    apple: "/RAITE.png",
  },
};

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
            <Suspense fallback={<div className="h-20 w-full border-b bg-background animate-pulse" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1">
              <Suspense fallback={null}>
                <PageTransition>{children}</PageTransition>
              </Suspense>
            </main>
            <Suspense fallback={null}>
              <Chatbot />
            </Suspense>
            <ProfileCheckModal />
            <Toaster position="top-center" richColors />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
