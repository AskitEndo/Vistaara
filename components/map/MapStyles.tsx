import React from "react";

const MapStyles = () => {
  return (
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
  );
};

export default React.memo(MapStyles);
