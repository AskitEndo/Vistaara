"use client";
import React from "react";
import dynamic from "next/dynamic";
import MapProvider from "./map/MapProvider";
import MapContainer from "./map/MapContainer";

// The core component implementation
const MapviewComponent = () => {
  return (
    <MapProvider>
      <MapContainer />
    </MapProvider>
  );
};

// Dynamic import with SSR disabled
const Mapview = dynamic(() => Promise.resolve(MapviewComponent), {
  ssr: false,
});

export default Mapview;
