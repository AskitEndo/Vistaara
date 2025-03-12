"use client";
import { useContext, useEffect, useRef } from "react";
import { MapContext } from "./MapProvider";

// Only import leaflet on the client side
let L: any;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

interface MyLocationMarkerProps {
  location: [number, number];
}

const MyLocationMarker: React.FC<MyLocationMarkerProps> = ({ location }) => {
  const mapContext = useContext(MapContext);
  const markerRef = useRef<any>(null);

  if (!mapContext) return null;

  const { mapRef, markersRef, isMapInitialized } = mapContext;

  useEffect(() => {
    // Skip if not initialized
    if (!mapRef.current || !isMapInitialized) return;

    const [lat, lng] = location;

    // Create or update marker
    if (!markerRef.current) {
      // Create custom icon
      const myIcon = L.divIcon({
        html: `<div class="bg-[#dc2626] w-5 h-5 rounded-full border-2 border-[#1a2a36] pulse-animation"></div>`,
        className: "my-location-marker",
        iconSize: [24, 24],
      });

      // Create marker
      const marker = L.marker([lat, lng], { icon: myIcon })
        .addTo(mapRef.current)
        .bindPopup("You are here");

      markerRef.current = marker;
      markersRef.current["me"] = marker;
    } else {
      // Update position
      markerRef.current.setLatLng([lat, lng]);
    }

    // Clean up
    return () => {
      if (markerRef.current && mapRef.current) {
        try {
          mapRef.current.removeLayer(markerRef.current);
          markerRef.current = null;
          delete markersRef.current["me"];
        } catch (err) {
          console.error("Error removing marker:", err);
        }
      }
    };
  }, [location, mapRef.current, isMapInitialized]);

  return null;
};

export default MyLocationMarker;
