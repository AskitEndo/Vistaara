import React from "react";

interface CameraPopupProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onCapture: () => void;
  onClose: () => void;
}

const CameraPopup: React.FC<CameraPopupProps> = ({
  videoRef,
  onCapture,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="relative bg-[#1a2a36] p-4 rounded-lg border-[3px] border-[#78C0A8] shadow-[5px_5px_0px_0px_rgba(66,138,151,0.5)] w-[640px]">
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-md"
          />

          {/* Action buttons container */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-3 bg-[#1a2a36]/80 border-[3px] border-red-500 rounded-full hover:bg-[#1a2a36] shadow-[3px_3px_0px_0px_rgba(220,38,38,0.5)] transition-all duration-300 transform hover:scale-105 backdrop-blur-md"
              aria-label="Cancel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="#ef4444"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Capture button */}
            <button
              onClick={onCapture}
              className="p-3 bg-[#1a2a36]/80 border-[3px] border-[#78C0A8] rounded-full hover:bg-[#1a2a36] shadow-[3px_3px_0px_0px_rgba(66,138,151,0.5)] transition-all duration-300 transform hover:scale-105 backdrop-blur-md"
              aria-label="Capture photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="#78C0A8"
                className="w-6 h-6 drop-shadow-md"
              >
                <circle cx="12" cy="12" r="9" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="3" fill="#78C0A8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPopup;
