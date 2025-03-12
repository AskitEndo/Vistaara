"use client";
import { useContext, useEffect, memo } from "react";
import { MapContext } from "./MapProvider";

// Only import leaflet on the client side
let L: any;
if (typeof window !== "undefined") {
  L = require("leaflet");
  require("leaflet.heat");
}

// Custom type for heat layer
declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: { [key: number]: string };
    }
  ): any;
}

const MapHeatLayer = () => {
  const mapContext = useContext(MapContext);

  if (!mapContext) return null;

  const { mapRef, heatLayerRef, markersRef, userLocations, myLocation } =
    mapContext;

  useEffect(() => {
    // Skip if map not initialized
    if (!mapRef.current) return;

    // Convert userLocations object to array
    const heatPoints = Object.values(userLocations);

    // Skip if no points
    if (heatPoints.length === 0) return;

    // Determine if we should show individual markers
    const showIndividualMarkers = heatPoints.length <= 5;

    // Handle map bounds if needed
    if (!myLocation) {
      try {
        // Create a bounds object to fit all points
        const bounds = L.latLngBounds(
          heatPoints.map((point) => [point[0], point[1]])
        );

        // Fit map to bounds
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      } catch (err) {
        console.error("Error setting bounds:", err);
      }
    }

    // Clean up existing heatmap
    if (heatLayerRef.current && mapRef.current) {
      try {
        mapRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      } catch (err) {
        console.error("Error removing heat layer:", err);
      }
    }

    try {
      // Create enhanced points array for better visualization
      let enhancedPoints: Array<[number, number, number]> = [];

      if (heatPoints.length === 1) {
        // For a single user, create a cluster effect
        const [lat, lng, intensity] = heatPoints[0];
        enhancedPoints.push([lat, lng, 1.0]);

        // Add surrounding points
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8;
          const radius = 0.0002;
          const newLat = lat + Math.sin(angle) * radius;
          const newLng = lng + Math.cos(angle) * radius;
          enhancedPoints.push([newLat, newLng, 0.8]);
        }
      } else if (heatPoints.length <= 5) {
        // For 2-5 users, boost intensity
        enhancedPoints = heatPoints.map((point) => {
          const [lat, lng, intensity] = point;
          return [lat, lng, Math.min(intensity * 3, 1.0)];
        });
      } else {
        // For many users, use normal points
        enhancedPoints = heatPoints;
      }

      // Create heat layer
      const heatLayer = L.heatLayer(enhancedPoints, {
        radius: heatPoints.length <= 5 ? 50 : 25,
        blur: heatPoints.length <= 5 ? 40 : 15,
        maxZoom: 20,
        minOpacity: heatPoints.length <= 5 ? 0.7 : 0.3,
        gradient: {
          0.2: "#304ffe",
          0.4: "#00b0ff",
          0.6: "#00e5ff",
          0.8: "#76ff03",
          1.0: "#ffea00",
        },
      });

      // Add to map
      heatLayer.addTo(mapRef.current);
      heatLayerRef.current = heatLayer;

      // User icon for other users
      const userIcon = L.divIcon({
        html: `<div class="bg-[#78C0A8] w-4 h-4 rounded-full border-2 border-[#1a2a36] relative"></div>`,
        className: "user-marker",
        iconSize: [20, 20],
      });

      // Handle individual markers visibility
      Object.entries(userLocations).forEach(([id, location]) => {
        const [lat, lng] = location;

        if (showIndividualMarkers) {
          // Show markers when few users
          if (!markersRef.current[id]) {
            try {
              const marker = L.marker([lat, lng], { icon: userIcon })
                .addTo(mapRef.current)
                .bindPopup("Active User");

              markersRef.current[id] = marker;
            } catch (err) {
              console.error("Error adding marker:", err);
            }
          } else {
            // Update position
            try {
              markersRef.current[id].setLatLng([lat, lng]);

              // Ensure it's visible
              if (!mapRef.current.hasLayer(markersRef.current[id])) {
                markersRef.current[id].addTo(mapRef.current);
              }
            } catch (err) {
              console.error("Error updating marker:", err);
            }
          }
        } else {
          // Hide markers when many users
          if (
            markersRef.current[id] &&
            mapRef.current.hasLayer(markersRef.current[id])
          ) {
            try {
              mapRef.current.removeLayer(markersRef.current[id]);
            } catch (err) {
              console.error("Error removing marker:", err);
            }
          }
        }
      });
    } catch (error) {
      console.error("Error updating heat layer:", error);
    }
  }, [userLocations, myLocation, mapRef.current]);

  return null;
};

// Memoize to prevent unnecessary re-renders
export default memo(MapHeatLayer);
