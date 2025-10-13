"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { user } = useUser();
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
        {user ? (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => router.push('/white-to-blue')} size="lg">
           Go to White To Blue 
          </Button>
        </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <SignInButton mode="modal">
              <Button size="lg" className="cursor-pointer">
                Sign In
              </Button>
            </SignInButton>
          </div>
        )}
      </div>
    </div>
  );
}