"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/white-to-blue');
    }
  }, [isLoaded, user, router]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Don't render the sign-in UI if user exists (will redirect)
  if (user) {
    return null;
  }

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
          <SignInButton mode="modal">
            <Button size="lg" className="cursor-pointer">
              Sign In
            </Button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}