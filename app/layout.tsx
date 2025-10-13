import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; 
import { ConvexClientProvider } from "./ConvexClientProvider";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "White to Blue Belt - BJJ Progress Tracker",
  description: "Track your Brazilian Jiu-Jitsu technique mastery from white to blue belt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <ClerkProvider dynamic>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-end items-center p-4 gap-4 h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>
                  Sign Up
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
        </ClerkProvider>
  );
}
