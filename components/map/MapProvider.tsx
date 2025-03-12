"use client";
import React, {
  createContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { io } from "socket.io-client";

// Dynamic socket URL determination
const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000";
  }
  return (
    process.env.NEXT_PUBLIC_PRODUCTION_SOCKET_URL || "http://localhost:4000"
  );
};

interface UserLocation {
  [key: string]: [number, number, number];
}

interface MapContextType {
  mapRef: React.MutableRefObject<any>;
  heatLayerRef: React.MutableRefObject<any>;
  socketRef: React.MutableRefObject<any>;
  markersRef: React.MutableRefObject<{ [key: string]: any }>;
  userLocations: UserLocation;
  myLocation: [number, number] | null;
  totalUsers: number;
  isMapInitialized: boolean;
  setIsMapInitialized: (value: boolean) => void;
  updateUserLocation: (id: string, lat: number, lng: number) => void;
  removeUserLocation: (id: string) => void;
  setMyLocation: (location: [number, number]) => void;
  setTotalUsers: (count: number) => void;
}

export const MapContext = createContext<MapContextType | null>(null);

interface MapProviderProps {
  children: ReactNode;
}

const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const mapRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  const [userLocations, setUserLocations] = useState<UserLocation>({});
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);

  // Memoized update functions to prevent unnecessary re-renders
  const updateUserLocation = useCallback(
    (id: string, lat: number, lng: number) => {
      setUserLocations((prev) => ({
        ...prev,
        [id]: [lat, lng, 1.0],
      }));
    },
    []
  );

  const removeUserLocation = useCallback((id: string) => {
    setUserLocations((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }, []);

  // Socket connection management
  useEffect(() => {
    // Only run client-side
    if (typeof window === "undefined") return;

    // Initialize socket connection
    socketRef.current = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
    });

    // Socket event listeners
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (error: any) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on(
      "received-location",
      (data: { id: string; latitude: number; longitude: number }) => {
        const { id, latitude, longitude } = data;
        updateUserLocation(id, latitude, longitude);
      }
    );

    socket.on("user-disconnected", (id: string) => {
      removeUserLocation(id);

      // Only remove marker here if it exists,
      // map layer manipulation happens in the MapHeatLayer component
      if (markersRef.current[id] && mapRef.current) {
        try {
          mapRef.current.removeLayer(markersRef.current[id]);
        } catch (err) {
          console.error("Error removing marker:", err);
        }
        delete markersRef.current[id];
      }
    });

    socket.on("total-users", (count: number) => {
      setTotalUsers(count);
    });

    // Clean up on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [updateUserLocation, removeUserLocation]);

  const value = {
    mapRef,
    heatLayerRef,
    socketRef,
    markersRef,
    userLocations,
    myLocation,
    totalUsers,
    isMapInitialized,
    setIsMapInitialized,
    updateUserLocation,
    removeUserLocation,
    setMyLocation,
    setTotalUsers,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export default MapProvider;
