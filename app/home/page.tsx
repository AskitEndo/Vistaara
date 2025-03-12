"use client";
import { Globe } from "@/components/ui/globe";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-start py-12 bg-[#f5f5f7] dark:bg-zinc-950 overflow-hidden relative">
      {/* Hero text - centered in upper half */}
      <div className="w-full text-center mb-12 md:mb-8 mt-12 md:mt-20">
        <h1 className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-[#FF9933] via-blue-900 to-[#138808] bg-clip-text text-center text-7xl md:text-8xl lg:text-9xl font-bold leading-none text-transparent z-10 px-4">
          Vistara
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-4 text-xl md:text-2xl max-w-2xl mx-auto px-4">
          Discover India's vibrant heritage and breathtaking landscapes
        </p>
      </div>

      {/* Globe container positioned in lower half */}
      <div className="relative w-full max-w-4xl aspect-[16/9] mt-4 md:mt-0">
        <div className="relative w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] mx-auto">
          <Globe className="scale-110" />
          <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0),rgba(245,245,247,0.2))]" />
        </div>

        {/* Buttons hovering over the globe */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center gap-6 z-20">
          <Button
            asChild
            size="lg"
            className="min-w-40 border-2 bg-[#FF9933] hover:bg-[#FF9933]/80 text-zinc-950 font-bold shadow-[4px_4px_0px_0px_rgba(255,153,51,0.4)] transform transition-all hover:-translate-y-1 hover:scale-105"
          >
            <Link href="/">Home</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="min-w-40 border-2 bg-[#138808] hover:bg-[#138808]/80 text-white font-bold shadow-[4px_4px_0px_0px_rgba(19,136,8,0.4)] transform transition-all hover:-translate-y-1 hover:scale-105"
          >
            <Link href="/map">Map</Link>
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
