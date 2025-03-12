"use client";

import createGlobe, { COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Optimized globe configuration for light mode
const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.5, // Changed to show more of India
  dark: 0,
  diffuse: 0.6, // Increased for better visibility
  mapSamples: 20000, // Higher resolution
  mapBrightness: 2, // Better for light mode
  baseColor: [0.8, 0.8, 0.8], // Lighter base color
  markerColor: [255 / 255, 153 / 255, 51 / 255], // #FF9933 (saffron)
  glowColor: [19 / 255, 136 / 255, 8 / 255], // #138808 (green)
  markers: [
    // India and major Indian cities
    { location: [20.5937, 78.9629], size: 0.15 }, // India - made larger
    { location: [28.7041, 77.1025], size: 0.08 }, // Delhi
    { location: [19.076, 72.8777], size: 0.08 }, // Mumbai
    { location: [12.9716, 77.5946], size: 0.07 }, // Bangalore
    { location: [17.385, 78.4867], size: 0.07 }, // Hyderabad
    { location: [22.5726, 88.3639], size: 0.07 }, // Kolkata
    { location: [13.0827, 80.2707], size: 0.07 }, // Chennai
    { location: [26.9124, 75.7873], size: 0.06 }, // Jaipur
    { location: [15.4989, 73.8278], size: 0.06 }, // Goa
    // Kept only Indian cities
  ],
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  let phi = 0;
  let width = 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef(null);
  const pointerInteractionMovement = useRef(0);
  const [r, setR] = useState(0);

  const updatePointerInteraction = (value: any) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: any) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 200);
    }
  };

  const onRender = useCallback(
    (state: Record<string, any>) => {
      // Start focused on India's approximate longitude
      if (!pointerInteracting.current) phi += 0.005;
      state.phi = phi + r + 1.3; // Offset to center on India region
      state.width = width * 2;
      state.height = width * 2;
    },
    [r]
  );

  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth;
    }
  };

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: width * 2,
      height: width * 2,
      onRender,
    });

    setTimeout(() => (canvasRef.current!.style.opacity = "1"));
    return () => {
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full h-full",
        className
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        )}
        ref={canvasRef}
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}
