"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
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
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => router.push('/white-to-blue')} className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
           Go to White To Blue 
          </button>
        </div>
      </div>
    </div>
  );
}