"use client";
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";

// Only import leaflet on the client side
let L: any;
if (typeof window !== "undefined") {
  L = require("leaflet");
  require("leaflet.heat");
}

// Dynamic socket URL determination
const getSocketUrl = () => {
  // In development with tunnels, use the public tunnel URL
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  // In local development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000";
  }

  // In production, use relative URL for same-origin deployment
  // or specified production URL
  return (
    process.env.NEXT_PUBLIC_PRODUCTION_SOCKET_URL || "http://localhost:4000"
  );
};

// Define custom type for heat layer
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

const MapviewComponent = () => {
  const mapRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [userLocations, setUserLocations] = useState<{
    [key: string]: [number, number, number];
  }>({});
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map after component mounts
  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    // Initialize socket with robust connection options
    socketRef.current = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
    });

    // Log connection events for debugging
    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("connect_error", (error: any) => {
      console.error("Socket connection error:", error);
    });

    socketRef.current.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
    });

    // Create custom marker icons with updated styling
    const userIcon = L.divIcon({
      html: `<div class="bg-[#78C0A8] w-4 h-4 rounded-full border-2 border-[#1a2a36] relative"></div>`,
      className: "user-marker",
      iconSize: [20, 20],
    });

    const myIcon = L.divIcon({
      html: `<div class="bg-[#dc2626] w-5 h-5 rounded-full border-2 border-[#1a2a36] pulse-animation"></div>`,
      className: "my-location-marker",
      iconSize: [24, 24],
    });

    // Initialize map with dark mode settings
    const map = L.map("map", {
      zoomControl: false, // We'll add custom positioned zoom controls
      attributionControl: true,
      minZoom: 2,
      maxZoom: 18,
    }).setView([20, 0], 3);

    mapRef.current = map;
    setIsMapReady(true);

    // Add tile layer with custom options for better dark mode compatibility
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "Map data © OpenStreetMap contributors",
      maxZoom: 19,
      subdomains: "abc",
    }).addTo(map);

    // Add zoom controls to top right with custom styling
    L.control
      .zoom({
        position: "topright",
      })
      .addTo(map);

    // Request user's location with device permission
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Set my location for map centering
          if (!myLocation) {
            setMyLocation([latitude, longitude]);
            map.setView([latitude, longitude], 13); // Zoom closer to user location (level 13)

            // Add a marker for user's location
            const marker = L.marker([latitude, longitude], { icon: myIcon })
              .addTo(map)
              .bindPopup("You are here")
              .openPopup();

            markersRef.current["me"] = marker;
          } else {
            // Update marker position if it exists
            if (markersRef.current["me"]) {
              markersRef.current["me"].setLatLng([latitude, longitude]);
            }
          }

          // Send location to server
          socketRef.current.emit("send-location", { latitude, longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("To use this feature, please enable location access.");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    // Add this to Mapview.tsx where you get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;

        // Store location in window object for Chatbox to access
        window.leafletUserLocation = {
          lat: latitude,
          lng: longitude,
        };

        // Rest of your location handling code...
      });
    }

    // Listen for location updates from other users
    socketRef.current.on(
      "received-location",
      (data: { id: string; latitude: number; longitude: number }) => {
        const { id, latitude, longitude } = data;

        // Add or update user location with intensity value (1.0)
        setUserLocations((prev) => ({
          ...prev,
          [id]: [latitude, longitude, 1.0],
        }));

        // Add or update marker for this user
        if (markersRef.current[id]) {
          markersRef.current[id].setLatLng([latitude, longitude]);
        } else if (Object.keys(userLocations).length < 5) {
          // Only show individual markers when there are fewer than 5 users
          const marker = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup("Active User");

          markersRef.current[id] = marker;
        }
      }
    );

    // Listen for user disconnection
    socketRef.current.on("user-disconnected", (id: string) => {
      // Remove user location from state
      setUserLocations((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      // Remove marker if it exists
      if (markersRef.current[id]) {
        mapRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Listen for total users count update
    socketRef.current.on("total-users", (count: number) => {
      setTotalUsers(count);
    });

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Update heatmap when user locations change
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Convert object to array for heat layer
    const heatPoints = Object.values(userLocations);

    // Show markers instead of heatmap when few users (but still show heatmap)
    const showIndividualMarkers = heatPoints.length <= 5;

    // Adjust map view based on user count
    if (heatPoints.length > 0) {
      // Create a bounds object to fit all points
      const bounds = L.latLngBounds(
        heatPoints.map((point) => [point[0], point[1]])
      );

      // If we have users but no location yet, center on them
      if (!myLocation && heatPoints.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }

    // Remove existing heat layer if it exists
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    // Add new heat layer with enhanced intensity
    if (heatPoints.length > 0) {
      // For better visibility with few users, duplicate points and increase intensity
      let enhancedPoints: Array<[number, number, number]> = [];

      if (heatPoints.length === 1) {
        // For a single user, create multiple points in a small radius
        const [lat, lng, intensity] = heatPoints[0];
        enhancedPoints.push([lat, lng, 1.0]); // Original point at max intensity

        // Add 8 points in a circle around the user for better visibility
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8;
          const radius = 0.0002; // Very small radius (about 20 meters)
          const newLat = lat + Math.sin(angle) * radius;
          const newLng = lng + Math.cos(angle) * radius;
          enhancedPoints.push([newLat, newLng, 0.8]); // High intensity
        }
      } else if (heatPoints.length <= 5) {
        // For 2-5 users, boost intensity significantly
        enhancedPoints = heatPoints.map((point) => {
          const [lat, lng, intensity] = point;
          return [lat, lng, Math.min(intensity * 3, 1.0)];
        });
      } else {
        // For many users, use normal points
        enhancedPoints = heatPoints;
      }

      const heatLayer = L.heatLayer(enhancedPoints, {
        radius: heatPoints.length <= 5 ? 50 : 25,
        blur: heatPoints.length <= 5 ? 40 : 15,
        maxZoom: 20,
        minOpacity: heatPoints.length <= 5 ? 0.7 : 0.3,
        // Updated gradient colors for better visibility on dark map
        gradient: {
          0.2: "#304ffe", // Deep blue
          0.4: "#00b0ff", // Bright blue
          0.6: "#00e5ff", // Cyan
          0.8: "#76ff03", // Bright lime
          1.0: "#ffea00", // Yellow
        },
      }).addTo(mapRef.current);

      heatLayerRef.current = heatLayer;
    }

    // Manage markers visibility based on user count
    Object.keys(markersRef.current).forEach((id) => {
      if (id !== "me") {
        // Don't hide user's own marker
        if (showIndividualMarkers) {
          // Show markers when few users
          if (!mapRef.current.hasLayer(markersRef.current[id])) {
            markersRef.current[id].addTo(mapRef.current);
          }
        } else {
          // Hide markers when many users
          if (mapRef.current.hasLayer(markersRef.current[id])) {
            mapRef.current.removeLayer(markersRef.current[id]);
          }
        }
      }
    });
  }, [userLocations, isMapReady, myLocation]);

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden">
      {/* User Counter */}
      <div className="absolute top-5 right-12 z-50 p-2 px-3 bg-[#1a2a36]/90 backdrop-blur-md border-2 border-[#78C0A8] rounded-md shadow-md">
        <div className="text-[#78C0A8] font-medium">
          <span className="font-bold">{totalUsers}</span> Live Users
        </div>
      </div>

      {/* Map Container */}
      <div
        id="map"
        className="w-full h-full z-0"
        style={{ height: "100%", width: "100%" }}
      ></div>

      {/* Advanced styling for map and markers */}
      <style jsx global>{`
        /* Pulsing animation for user marker */
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(120, 192, 168, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(120, 192, 168, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(120, 192, 168, 0);
          }
        }
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }

        /* Dark theme for the map tiles */
        .leaflet-tile {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg)
            saturate(0.3) brightness(0.7) !important;
        }

        /* Dark theme for map controls */
        .leaflet-bar,
        .leaflet-control-layers {
          border: none !important;
          background-color: rgba(26, 42, 54, 0.9) !important;
        }

        .leaflet-touch .leaflet-bar a {
          border-color: #78c0a8 !important;
          background-color: rgba(26, 42, 54, 0.9) !important;
          color: #78c0a8 !important;
        }

        .leaflet-touch .leaflet-bar a:hover {
          background-color: rgba(120, 192, 168, 0.3) !important;
        }

        /* Hide attribution text but keep required attribution */
        .leaflet-control-attribution {
          background-color: rgba(26, 42, 54, 0.7) !important;
          color: rgba(120, 192, 168, 0.7) !important;
          font-size: 8px !important;
          max-width: 80px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 2px 5px !important;
        }

        /* Marker popup styling */
        .leaflet-popup-content-wrapper {
          background-color: rgba(26, 42, 54, 0.9) !important;
          color: #78c0a8 !important;
          border: 1px solid #78c0a8;
        }

        .leaflet-popup-tip {
          background-color: #78c0a8 !important;
        }

        /* Custom zoom controls */
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out {
          border-radius: 4px !important;
          border: 1px solid #78c0a8 !important;
        }

        /* Make heat gradient more visible on dark theme */
        .leaflet-heatmap-layer {
          opacity: 0.8 !important;
        }

        /* Better shadows for the map elements */
        .leaflet-shadow-pane {
          filter: brightness(0.5) saturate(0);
        }
      `}</style>
    </div>
  );
};

// Use dynamic import with SSR disabled
const Mapview = dynamic(() => Promise.resolve(MapviewComponent), {
  ssr: false,
});

export default Mapview;
