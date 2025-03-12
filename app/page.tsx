"use client";
import React from "react";
import dynamic from "next/dynamic";
import Chatbox from "@/components/Chatbox";
import Livepic from "@/components/Livepic";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

// Import Mapview component with SSR disabled
const Mapview = dynamic(() => import("@/components/Mapview"), { ssr: false });

const Page = () => {
  return (
    <div className="relative min-h-screen w-full bg-[#1a2a36] overflow-hidden">
      <FlickeringGrid
        className="z-0 absolute inset-0 w-full h-full"
        squareSize={4}
        gridGap={6}
        color="#428a97"
        maxOpacity={0.25}
        flickerChance={0.08}
        height={2000}
        width={2000}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="container mx-auto p-4 lg:p-6 h-screen max-w-8xl">
          <div className="flex flex-col md:flex-row gap-6 h-full md:h-[95vh] relative z-10">
            {/* Left Section - Chatbox & Liveview */}
            <div className="flex flex-col w-full md:w-1/3 gap-6">
              {/* Chatbox Section */}
              <div className="border-[3px] border-[#78C0A8] rounded-md p-4 h-3/5 bg-[#1a2a36]/80 backdrop-blur-md shadow-[5px_5px_0px_0px_rgba(66,138,151,0.5)]">
                <div className="text-white font-medium h-[calc(100%-2rem)] overflow-auto">
                  <Chatbox />
                </div>
              </div>

              {/* Liveview Section */}
              <div className="border-[3px] border-[#78C0A8] rounded-md p-4 h-2/5 bg-[#1a2a36]/80 backdrop-blur-md shadow-[5px_5px_0px_0px_rgba(66,138,151,0.5)]">
                {/* <div className="text-[#78C0A8] font-bold text-xl mb-3 flex items-center">
                  <span className="inline-block w-3 h-3 bg-[#78C0A8] rounded-full mr-2 animate-pulse"></span>
                  Live Feed
                </div> */}
                <div className="h-[calc(100%-2rem)] overflow-hidden">
                  <Livepic />
                </div>
              </div>
            </div>

            {/* Right Section - Mapview */}
            <div className="w-full md:w-2/3 h-[60vh] md:h-full">
              <div className="border-[3px] border-[#78C0A8] rounded-md p-4 h-full bg-[#1a2a36]/80 backdrop-blur-md shadow-[5px_5px_0px_0px_rgba(66,138,151,0.5)]">
                <div className="h-full">
                  <Mapview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
