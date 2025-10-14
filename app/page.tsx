"use client";

import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            BJJ Progress
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track your Brazilian Jiu-Jitsu journey and techniques
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <SignedOut>
            <SignUpButton mode="modal" forceRedirectUrl="/white-to-blue">
              <Button size="lg" className="cursor-pointer">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/white-to-blue">
              <Button size="lg" className="cursor-pointer">
                Go to White to Blue
              </Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}