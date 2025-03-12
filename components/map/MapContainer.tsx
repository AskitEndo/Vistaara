"use client";
import React, { useContext } from "react";
import { MapContext } from "./MapProvider";
import MapInitializer from "./MapInitializer";
import MapHeatLayer from "./MapHeatLayer";
import MyLocationMarker from "./MyLocationMarker";
import UserCounter from "./UserCounter";
import MapStyles from "./MapStyles";

const MapContainer: React.FC = () => {
  const mapContext = useContext(MapContext);

  if (!mapContext) {
    return <div>Map context not available</div>;
  }

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden">
      {/* User Counter */}
      <UserCounter totalUsers={mapContext.totalUsers} />

      {/* Map Container */}
      <div
        id="map"
        className="w-full h-full z-0"
        style={{ height: "100%", width: "100%" }}
      />

      {/* Map Initialization Component */}
      <MapInitializer />

      {/* My Location Marker - only renders when needed */}
      {mapContext.myLocation && (
        <MyLocationMarker location={mapContext.myLocation} />
      )}

      {/* Heat Layer - only renders when map is ready */}
      {mapContext.isMapInitialized && <MapHeatLayer />}

      {/* Global styles */}
      <MapStyles />
    </div>
  );
};

export default MapContainer;
