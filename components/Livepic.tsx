import React, { useState, useRef, useEffect } from "react";
import CameraPopup from "./CameraPopup";

const styles = {
  "@keyframes fadeIn": {
    from: { opacity: 0, transform: "translateY(-10px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
};

const Livepic = () => {
  const [hasImage, setHasImage] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showQueueMessage, setShowQueueMessage] = useState(false);
  const [photoQueue, setPhotoQueue] = useState<string[]>([]);
  const [imagePosition, setImagePosition] = useState(1);
  const [photoCaption, setPhotoCaption] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    if (capturedImage) {
      setShowQueueMessage(true);
      setTimeout(() => setShowQueueMessage(false), 2000); // Hide message after 2s
    }
    try {
      setShowPopup(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        setHasImage(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setShowPopup(false);
    setHasImage(false);
  };

  const startTimer = () => {
    setTimeLeft(30);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          handleNextPhoto(); // Move to next photo when timer ends
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNextPhoto = () => {
    // Clean up current photo
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }

    if (photoQueue.length > 0) {
      // Get next photo from queue
      const [nextPhoto, ...remainingPhotos] = photoQueue;

      // Show next photo
      setCapturedImage(nextPhoto);
      setPhotoQueue(remainingPhotos);
      setHasImage(true);
      setImagePosition((prev) => prev + 1);
      // Start timer for the new photo
      startTimer();
    } else {
      // No more photos in queue
      setHasImage(false);
      setImagePosition(1);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const imageUrl = URL.createObjectURL(blob);

              if (!capturedImage) {
                // First photo - display it and start timer
                setCapturedImage(imageUrl);
                setHasImage(true);
                startTimer();
              } else {
                // Add new photo to queue and show message
                setPhotoQueue((prev) => [...prev, imageUrl]);
                setShowQueueMessage(true);
                setTimeout(() => setShowQueueMessage(false), 2000);
              }

              setShowPopup(false);
              closeCamera();
            }
          },
          "image/jpeg",
          0.95
        );
      }
    }
  };

  // Add console logs to help debug the queue system
  useEffect(() => {
    console.log("Current queue:", photoQueue);
    console.log("Current image:", capturedImage);
    console.log("Time left:", timeLeft);
  }, [photoQueue, capturedImage, timeLeft]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
      // Cleanup all image URLs
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
      photoQueue.forEach((url) => URL.revokeObjectURL(url));
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [capturedImage, photoQueue]);

  return (
    <div className="relative h-full w-full">
      {capturedImage ? (
        <div className="relative h-full w-full flex flex-col">
          <div className="relative flex-1">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover rounded-t-md"
            />
            {/* Add the counter overlay */}
            <div className="absolute top-4 left-4 z-40 bg-[#1a2a36]/80 border-[3px] border-[#78C0A8] rounded-lg px-3 py-1 backdrop-blur-sm">
              <p className="text-[#78C0A8] text-sm font-medium flex items-center gap-2">
                {imagePosition}/{imagePosition + photoQueue.length}
                {photoQueue.length > 0 && (
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                      />
                    </svg>
                    {photoQueue.length}
                  </span>
                )}
              </p>
            </div>
            {timeLeft !== null && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a2a36]/30">
                <div
                  className="h-full bg-[#78C0A8] transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(timeLeft / 30) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Caption Input Section */}
          <div className="bg-[#1a2a36] border-t-[3px] border-[#78C0A8] p-4">
            <div className="relative">
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    setPhotoCaption(e.target.value);
                  }
                }}
                placeholder="Add a caption... ✨"
                className="w-full bg-[#1a2a36]/50 border-[2px] border-[#78C0A8] rounded-md px-4 py-2 text-[#78C0A8] placeholder-[#78C0A8]/50 focus:outline-none focus:ring-2 focus:ring-[#78C0A8]/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#78C0A8]/70">
                {photoCaption.length}/50
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-[#78C0A8] text-lg font-medium">
            No image uploaded
          </p>
        </div>
      )}

      {/* Camera/Retake button - shown when no popup is visible */}
      {!showPopup && (
        <button
          onClick={() => {
            if (capturedImage) {
              setCapturedImage(null);
            }
            startCamera();
          }}
          className="absolute bottom-4 right-4 z-50 p-3 bg-[#1a2a36]/80 border-[3px] border-[#78C0A8] rounded-full hover:bg-[#1a2a36] shadow-[3px_3px_0px_0px_rgba(66,138,151,0.5)] transition-all duration-300 transform hover:scale-105 backdrop-blur-md"
          aria-label={capturedImage ? "Retake" : "Camera"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="#78C0A8"
            className="w-6 h-6 drop-shadow-md"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
            />
          </svg>
        </button>
      )}

      {/* Camera popup with capture button */}
      {showPopup && (
        <CameraPopup
          videoRef={videoRef}
          onCapture={captureImage}
          onClose={closeCamera}
        />
      )}

      {/* Queue Message Popup */}
      {showQueueMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#1a2a36]/90 border-[3px] border-[#78C0A8] rounded-lg px-4 py-2 shadow-[3px_3px_0px_0px_rgba(66,138,151,0.5)] backdrop-blur-sm animate-fade-in">
          <p className="text-[#78C0A8] text-sm font-medium flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 animate-spin"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Previous photo in queue
          </p>
        </div>
      )}
    </div>
  );
};

export default Livepic;
