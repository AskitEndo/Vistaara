"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f7] dark:bg-zinc-950 p-4">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-[#FF9933] via-blue-900 to-[#138808] bg-clip-text text-transparent">
          India Map
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-xl mb-10">
          Interactive map of India coming soon!
        </p>
        <div className="flex justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="min-w-40 border-2 bg-[#FF9933] hover:bg-[#FF9933]/80 text-zinc-950 font-bold shadow-[4px_4px_0px_0px_rgba(255,153,51,0.4)] transform transition-all hover:-translate-y-1"
          >
            <Link href="/home">Back to Home</Link>
          </Button>
        </div>
      </div>

      {/* Decorative accent lines representing Indian flag colors */}
      <div className="absolute bottom-0 left-0 right-0 flex h-2">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>
    </div>
  );
}
