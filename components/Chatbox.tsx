import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatedList } from "./ui/animated-list";
import { ChatMessage } from "../types/chat";
import EmojiDp from "./ui/EmojiDp";

const STORAGE_KEY = "temporary_chat_messages";
const AI_MESSAGE_INTERVAL = 60000; // 1 minute in milliseconds

interface EnhancedChatMessage extends ChatMessage {
  avatarSeed?: string;
  isAi?: boolean;
}

interface LocationData {
  lat: number;
  lng: number;
}

// Use a global variable to store location data from Leaflet
declare global {
  interface Window {
    leafletUserLocation?: LocationData;
  }
}

const Chatbox = () => {
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Use refs instead of state for timers
  const timersRef = useRef<Record<string, number>>({});
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const aiMessageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        const now = Date.now();
        // Filter out expired messages
        const validMessages = parsedMessages.filter(
          (msg: EnhancedChatMessage) => now - msg.timestamp < 30000
        );
        setMessages(validMessages);

        // Initialize timers for existing messages
        validMessages.forEach((msg: EnhancedChatMessage) => {
          const elapsedTime = now - msg.timestamp;
          const remainingPercentage = Math.max(
            0,
            100 - (elapsedTime / 30000) * 100
          );
          timersRef.current[msg.id] = remainingPercentage;
        });
      } catch (error) {
        console.error("Failed to parse saved messages:", error);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current);
      if (aiMessageIntervalRef.current)
        clearInterval(aiMessageIntervalRef.current);
    };
  }, []);

  // Set up timer and cleanup intervals
  useEffect(() => {
    if (messages.length === 0) return;

    // Clean up previous intervals
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current);

    // Update DOM directly for timer bars
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      let needsCleanup = false;

      messages.forEach((msg) => {
        const elapsedTime = now - msg.timestamp;
        if (elapsedTime >= 30000) {
          needsCleanup = true;
          return;
        }

        const remainingPercentage = Math.max(
          0,
          100 - (elapsedTime / 30000) * 100
        );
        const roundedPercentage = Math.round(remainingPercentage);

        timersRef.current[msg.id] = roundedPercentage;

        const timerBar = document.getElementById(`timer-${msg.id}`);
        if (timerBar) {
          timerBar.style.width = `${roundedPercentage}%`;
        }
      });

      if (needsCleanup) {
        cleanupMessages();
      }
    }, 1000);

    cleanupIntervalRef.current = setInterval(cleanupMessages, 5000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current);
    };
  }, [messages.length]);

  // Set up regular AI message interval - send message every minute
  useEffect(() => {
    // Clear any existing interval
    if (aiMessageIntervalRef.current) {
      clearInterval(aiMessageIntervalRef.current);
    }

    // Set up interval to send AI messages every minute
    aiMessageIntervalRef.current = setInterval(() => {
      sendAiMessage();
    }, AI_MESSAGE_INTERVAL);

    // Send first AI message after a short delay
    const initialDelayTimeout = setTimeout(() => {
      sendAiMessage();
    }, 5000); // Send first message after 5 seconds

    return () => {
      if (aiMessageIntervalRef.current) {
        clearInterval(aiMessageIntervalRef.current);
      }
      clearTimeout(initialDelayTimeout);
    };
  }, []);

  // Clean up messages helper function
  const cleanupMessages = () => {
    setMessages((prevMessages) => {
      const now = Date.now();
      const updatedMessages = prevMessages.filter(
        (msg) => now - msg.timestamp < 30000
      );

      if (updatedMessages.length !== prevMessages.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
      }

      return updatedMessages;
    });
  };

  // Replace your sendAiMessage function
  const sendAiMessage = async () => {
    // Don't set loading to true - this could block the UI if something fails
    try {
      console.log("Attempting to send AI message");

      // Get location from Leaflet global variable
      const location = window.leafletUserLocation || {
        lat: 12.9716, // Bangalore default
        lng: 77.5946,
      };

      // Generate message (now using our local function that doesn't need API)
      const aiResponse = await generateAiResponse(location);

      // Create AI message
      const newMessage: EnhancedChatMessage = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        timestamp: Date.now(),
        avatarSeed: "ai-assistant",
        isAi: true,
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, newMessage];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
        } catch (err) {
          console.warn("Error saving to localStorage:", err);
        }
        return updatedMessages;
      });

      // Set initial timer for AI message
      timersRef.current[newMessage.id] = 100;
      console.log("AI message sent successfully");
    } catch (error: any) {
      console.error("Error sending AI message:", error);
      // Don't show alert - just log the error
    }
  };

  // Generate AI response using Gemini API
  const generateAiResponse = async (location?: LocationData) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key not found");

      let prompt = "";

      if (location) {
        // If we have location data, use it to generate a contextual prompt
        const { lat, lng } = location;

        // Format coordinates for readability
        const latitude = parseFloat(lat.toFixed(2));
        const longitude = parseFloat(lng.toFixed(2));

        // Create a location-aware prompt
        prompt = `Generate a brief, casual message (under 100 characters) about a location near coordinates ${latitude}, ${longitude}. 
                 This could be about the weather, an interesting landmark, or a fun fact about this region.
                 Make it sound like a friendly notification that would appear in a chat app when no one is chatting.
                 Don't mention the exact coordinates.`;
      } else {
        // Generic prompt if no location data
        prompt = `Generate a brief, friendly chat message (under 100 characters) with an interesting fact about today's weather in Bangalore, 
                 technology, or a random fun fact in hindi. Make it sound like a notification in a chat app when no one is chatting, facts about bangalore and technology.`;
      }

      // UPDATED ENDPOINT AND MODEL
      const endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        // Optional config
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      };

      console.log("Sending request to:", endpoint);

      const geminiResponse = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("API error:", geminiResponse.status, errorText);
        throw new Error(`API error: ${geminiResponse.status}`);
      }

      const data = await geminiResponse.json();
      console.log("API response:", data);

      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        // Fallback messages if API structure is unexpected
        throw new Error("Unexpected API response structure");
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      // Use your existing fallback message array
      const fallbackMessages = [
        "Did you know that weather patterns can affect your mood?",
        // ... rest of your fallback messages
      ];
      return fallbackMessages[
        Math.floor(Math.random() * fallbackMessages.length)
      ];
    }
  };

  const handleSendMessage = useCallback(() => {
    if (inputValue.trim()) {
      // Check if the message starts with @
      const isAiQuery = inputValue.trim().startsWith("@");
      const messageContent = isAiQuery
        ? inputValue.trim().substring(1) // Remove @ symbol
        : inputValue.trim();

      // Create new message with random avatar seed
      const newMessage: EnhancedChatMessage = {
        id: Date.now().toString(),
        content: messageContent,
        timestamp: Date.now(),
        avatarSeed: Math.random().toString(), // Random seed for avatar
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, newMessage];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
        } catch (err) {
          console.warn("Error saving to localStorage:", err);
        }
        return updatedMessages;
      });

      // Set initial timer for new message
      timersRef.current[newMessage.id] = 100;

      // If message starts with @, send to AI for response
      if (isAiQuery) {
        respondToAiQuery(messageContent);
      }

      setInputValue("");
    }
  }, [inputValue]);

  // Add this new function to handle AI responses to queries
  const respondToAiQuery = async (query: string) => {
    try {
      // Set loading to indicate AI is generating a response
      setLoading(true);

      // Generate AI response based on the query
      const aiResponse = await generateCustomAiResponse(query);

      // Create AI message
      const newMessage: EnhancedChatMessage = {
        id: `ai-response-${Date.now()}`,
        content: aiResponse,
        timestamp: Date.now(),
        avatarSeed: "ai-assistant", // Consistent seed for AI
        isAi: true,
      };

      // Add AI response to messages
      setMessages((prev) => {
        const updatedMessages = [...prev, newMessage];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
        } catch (err) {
          console.warn("Error saving to localStorage:", err);
        }
        return updatedMessages;
      });

      // Set initial timer for AI message
      timersRef.current[newMessage.id] = 100;
    } catch (error) {
      console.error("Error generating AI response:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to generate custom AI responses based on user queries
  const generateCustomAiResponse = async (query: string) => {
    try {
      // Try to use Gemini API if available
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key not found");

      const location = window.leafletUserLocation || {
        lat: 12.9716, // Bangalore default
        lng: 77.5946,
      };

      // Create a prompt that combines the query with location context
      const prompt = `You are an AI assistant in a chat app focused on providing information about locations, weather, 
                     and interesting facts. The user is currently at coordinates ${location.lat.toFixed(
                       2
                     )}, ${location.lng.toFixed(2)} 
                     (likely in or near Bangalore, India). 
                     The user asked: "${query}"
                     
                     Please provide a helpful, concise response (under 200 characters if possible). If appropriate, you can 
                     include information about the location, but don't explicitly mention the coordinates.`;

      // UPDATED ENDPOINT AND MODEL
      const endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

      const payload = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      };

      console.log("Sending custom query to:", endpoint);

      const geminiResponse = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("API error:", geminiResponse.status, errorText);
        throw new Error(`API error: ${geminiResponse.status}`);
      }

      const data = await geminiResponse.json();
      console.log("Custom query response:", data);

      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("Error with Gemini API:", error);

      // Your existing fallback logic
      const queryLower = query.toLowerCase();

      // Weather-related queries
      if (
        queryLower.includes("weather") ||
        queryLower.includes("temperature") ||
        queryLower.includes("rain")
      ) {
        return "The current weather in Bangalore is pleasant with temperatures around 24-28°C. Expect clear skies with a gentle breeze.";
      }

      // Continue with your other fallbacks...

      // Generic response
      return (
        "I understand you're asking about \"" +
        query +
        "\". While I don't have specific information, I can share that Bangalore is known for its pleasant climate, tech industry, and gardens."
      );
    }
  };

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-hidden mb-3">
        <AnimatedList className="flex flex-col-reverse space-y-reverse space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`py-2 px-3 rounded-md shadow-md relative ${
                msg.isAi
                  ? "bg-[#1a3836] border-l-2 border-[#4ecdc4]"
                  : "bg-[#1a2a36] border-l-2 border-[#78C0A8]"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* EmojiDp avatar */}
                <EmojiDp
                  seed={msg.avatarSeed || msg.id}
                  size={32}
                  className="flex-shrink-0 mt-1"
                />

                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {msg.content}
                    {msg.isAi && (
                      <span className="ml-1 text-xs text-[#4ecdc4]">• AI</span>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      msg.isAi ? "text-[#4ecdc4]" : "text-[#78C0A8]"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Timer bar */}
              <div className="h-1 bg-[#1a2a36] w-full absolute bottom-0 left-0 rounded-b-md overflow-hidden">
                <div
                  id={`timer-${msg.id}`}
                  className={`h-1 ${
                    msg.isAi ? "bg-[#4ecdc4]" : "bg-[#78C0A8]"
                  }`}
                  style={{
                    width: `${timersRef.current[msg.id] || 0}%`,
                    transition: "width 1s linear",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </AnimatedList>
      </div>
      <div className="border border-[#428a97] rounded-md p-1 flex bg-[#1a2a36]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type here..."
          className="flex-1 p-2 text-sm bg-transparent text-white placeholder-gray-400 focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-[#78C0A8] hover:bg-[#428a97] text-[#1a2a36] text-sm px-3 py-1 rounded transition font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbox;
