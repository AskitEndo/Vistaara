"use client";
import { useContext, useEffect } from "react";
import { MapContext } from "./MapProvider";

// Only import leaflet on the client side
let L: any;
if (typeof window !== "undefined") {
  L = require("leaflet");
  require("leaflet.heat");
}

const MapInitializer = () => {
  const mapContext = useContext(MapContext);

  if (!mapContext) return null;

  const { mapRef, socketRef, setMyLocation, setIsMapInitialized } = mapContext;

  useEffect(() => {
    // Skip if already initialized or not in browser
    if (typeof window === "undefined" || mapRef.current) return;

    try {
      // Initialize map with dark mode settings
      const map = L.map("map", {
        zoomControl: false,
        attributionControl: true,
        minZoom: 2,
        maxZoom: 18,
      }).setView([20, 0], 3);

      mapRef.current = map;

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "Map data © OpenStreetMap contributors",
        maxZoom: 19,
        subdomains: "abc",
      }).addTo(map);

      // Add zoom controls
      L.control
        .zoom({
          position: "topright",
        })
        .addTo(map);

      // Mark map as initialized
      setIsMapInitialized(true);

      // Request user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            // Set location in context
            setMyLocation([latitude, longitude]);

            // Center map on user
            map.setView([latitude, longitude], 13);

            // Store for chat component
            window.leafletUserLocation = {
              lat: latitude,
              lng: longitude,
            };

            // Send to server
            if (socketRef.current) {
              socketRef.current.emit("send-location", { latitude, longitude });
            }

            // Set up watchPosition for location updates
            const watchId = navigator.geolocation.watchPosition(
              (posUpdate) => {
                const { latitude: newLat, longitude: newLng } =
                  posUpdate.coords;

                // Update location
                setMyLocation([newLat, newLng]);

                // Update global reference
                window.leafletUserLocation = {
                  lat: newLat,
                  lng: newLng,
                };

                // Send updated location
                if (socketRef.current) {
                  socketRef.current.emit("send-location", {
                    latitude: newLat,
                    longitude: newLng,
                  });
                }
              },
              (error) => {
                console.error("Error watching position:", error);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
              }
            );

            // Clean up watch on component unmount
            return () => {
              navigator.geolocation.clearWatch(watchId);
            };
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

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);

  return null;
};

export default MapInitializer;
