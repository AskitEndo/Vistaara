import { useRef, useEffect } from "react";
import { ChatMessage } from "../types/chat";

const STORAGE_KEY = "temporary_chat_messages";
const AI_MESSAGE_INTERVAL = 60000; // 1 minute in milliseconds

interface EnhancedChatMessage extends ChatMessage {
  avatarSeed?: string;
  isAi?: boolean;
}

type SetMessagesType = React.Dispatch<
  React.SetStateAction<EnhancedChatMessage[]>
>;
type SetLoadingType = React.Dispatch<React.SetStateAction<boolean>>;

interface LocationData {
  lat: number;
  lng: number;
}

export const useAiMessages = (
  messages: EnhancedChatMessage[],
  setMessages: SetMessagesType,
  setLoading: SetLoadingType
) => {
  const aiMessageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timersRef = useRef<Record<string, number>>({});

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

  const sendAiMessage = async () => {
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
    }
  };

  const respondToAiQuery = async (query: string) => {
    try {
      setLoading(true);

      const aiResponse = await generateCustomAiResponse(query);

      const newMessage: EnhancedChatMessage = {
        id: `ai-response-${Date.now()}`,
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

      timersRef.current[newMessage.id] = 100;
    } catch (error) {
      console.error("Error generating AI response:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate AI response using Gemini API
  const generateAiResponse = async (location?: LocationData) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key not found");

      // Determine approximate area in Bangalore based on coordinates
      let area = "Bangalore";
      if (location) {
        if (location.lat > 13.0 && location.lng > 77.6) {
          area = "North-East Bangalore";
        } else if (location.lat > 13.0) {
          area = "areas like Malleshwaram";
        } else if (location.lng > 77.6) {
          area = "areas like Whitefield";
        } else if (location.lat < 12.9 && location.lng < 77.5) {
          area = "South Bangalore";
        }
      }

      // List of Bangalore landmarks and areas to mention
      const bangaloreSpots = [
        "Nandi Hills",
        "Lalbagh",
        "Cubbon Park",
        "MG Road",
        "Malleshwaram",
        "Indiranagar",
        "Koramangala",
        "Commercial Street",
        "UB City",
        "Brigade Road",
        "Bannerghatta Road",
        "Electronic City",
        "Ulsoor Lake",
        "Whitefield",
        "JP Nagar",
        "Basavanagudi",
      ];

      // Pick a random spot
      const randomSpot =
        bangaloreSpots[Math.floor(Math.random() * bangaloreSpots.length)];

      // Topics to rotate through
      const topics = [
        `shopping in ${randomSpot}`,
        `weather today in ${area}`,
        `cafes around ${randomSpot}`,
        `traffic situation in ${area}`,
        `weekend spots near ${randomSpot}`,
        `street food in ${area}`,
        `upcoming events in Bangalore`,
        `tech hub in ${area === "Bangalore" ? "Whitefield" : area}`,
        `parks and lakes in ${area}`,
        `local markets in ${randomSpot}`,
      ];

      // Pick a random topic
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];

      // Every 10th message could mention the college (10% chance)
      const mentionCollege = Math.random() < 0.1;
      const collegeContext = mentionCollege
        ? " Also, Brindavan College students often visit this area."
        : "";

      // Optimized prompt with shorter target and focus on brevity
      const prompt = `Create a short message (under 100 chars) about ${randomTopic}.${collegeContext}
      Be casual, friendly and brief as if sending a quick chat notification.`;

      const endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      const response = await fetchGeminiApi(endpoint, prompt, apiKey, 100);

      // Ensure response is under 120 characters
      if (response.length > 120) {
        return response.substring(0, 117) + "...";
      }

      return response;
    } catch (error) {
      console.error("Error generating AI response:", error);
      return getFallbackMessage();
    }
  };

  // Generate custom AI response for user queries
  const generateCustomAiResponse = async (query: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key not found");

      // Pick a random area in Bangalore for context (instead of using coordinates)
      const bangaloreAreas = [
        "Malleshwaram",
        "Indiranagar",
        "Koramangala",
        "JP Nagar",
        "Whitefield",
        "MG Road",
        "Electronic City",
        "Jayanagar",
        "BTM Layout",
      ];

      const randomArea =
        bangaloreAreas[Math.floor(Math.random() * bangaloreAreas.length)];

      // Very concise prompt for short, conversational responses
      const prompt = `You're a casual AI chatbot in ${randomArea}, Bangalore.
      Question: "${query}"
      Answer in under 70 chars. Be brief and conversational, like texting a friend.`;

      const endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      const response = await fetchGeminiApi(endpoint, prompt, apiKey, 70);

      // Strictly limit response length for @ queries
      if (response.length > 80) {
        return response.substring(0, 77) + "...";
      }

      return response;
    } catch (error) {
      console.error("Error with Gemini API:", error);
      return getFallbackResponseForQuery(query);
    }
  };

  // Helper function to fetch from Gemini API with character limit
  const fetchGeminiApi = async (
    endpoint: string,
    prompt: string,
    apiKey: string,
    charLimit: number
  ) => {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: Math.ceil(charLimit / 4), // Approximate token estimation
        topK: 40,
        topP: 0.95,
      },
    };

    const geminiResponse = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`API error: ${geminiResponse.status} - ${errorText}`);
    }

    const data = await geminiResponse.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let response = data.candidates[0].content.parts[0].text.trim();

      // Remove excessive punctuation often present in AI responses
      response = response.replace(/\.{2,}/g, "...");
      response = response.replace(/!{2,}/g, "!");

      // Remove "AI:" or similar prefixes if they appear
      response = response.replace(/^(AI:|Assistant:|Chatbot:)\s*/i, "");

      return response;
    } else {
      throw new Error("Unexpected API response structure");
    }
  };

  // Updated fallback messages with Bangalore landmarks focus
  const getFallbackMessage = () => {
    const fallbackMessages = [
      "Commercial Street has amazing shopping deals this weekend!",
      "Perfect weather for a visit to Cubbon Park today.",
      "Indiranagar's 12th Main is buzzing with new cafés and boutiques.",
      "Nandi Hills offers a spectacular sunrise view, just 60km from the city.",
      "Rainy season tip: Carry an umbrella when visiting Lalbagh Botanical Garden.",
      "UB City's luxury shopping experience is perfect for a special occasion.",
      "Traffic alert: Silk Board junction is experiencing heavy delays today.",
      "MG Road's Boulevard is great for an evening stroll with street food options.",
      "The lakes in Ulsoor and Hebbal are perfect for morning walks.",
      "किसी ने बेंगलुरु को 'गार्डन सिटी' कहा तो कोई इसे 'पब सिटी' कहता है!",
      "Brindavan College area has some great budget-friendly eateries nearby.",
      "Brigade Road comes alive on weekends with street shopping and food stalls.",
      "Today's Bangalore temperature: Just right for a hot cup of filter coffee!",
      "Fun fact: Bangalore has over 40 lakes and is at an elevation of 920m.",
      "Electronic City sees less traffic on weekends - perfect for tech museum visits.",
      "Tip: Malleshwaram's iconic CTR serves the best benne masala dosa in town!",
    ];
    return fallbackMessages[
      Math.floor(Math.random() * fallbackMessages.length)
    ];
  };

  // More concise fallback responses for @ queries
  const getFallbackResponseForQuery = (query: string) => {
    const queryLower = query.toLowerCase();

    // Weather responses - very brief
    if (
      queryLower.includes("weather") ||
      queryLower.includes("rain") ||
      queryLower.includes("temperature")
    ) {
      const temps = ["24°C", "26°C", "23°C", "25°C", "27°C"];
      const randomTemp = temps[Math.floor(Math.random() * temps.length)];
      return `It's ${randomTemp} with light breeze. Perfect Bangalore weather!`;
    }

    // Food responses
    if (
      queryLower.includes("food") ||
      queryLower.includes("eat") ||
      queryLower.includes("restaurant")
    ) {
      const areas = ["Indiranagar", "Koramangala", "JP Nagar", "MG Road"];
      const randomArea = areas[Math.floor(Math.random() * areas.length)];
      return `Try the cafés in ${randomArea}. Great food scene there!`;
    }

    // Shopping responses
    if (
      queryLower.includes("shop") ||
      queryLower.includes("mall") ||
      queryLower.includes("buy")
    ) {
      const options = [
        "Commercial St",
        "Brigade Road",
        "Phoenix Marketcity",
        "UB City",
      ];
      const randomOption = options[Math.floor(Math.random() * options.length)];
      return `Check out ${randomOption}. You'll find what you need there.`;
    }

    // Travel responses
    if (
      queryLower.includes("go") ||
      queryLower.includes("visit") ||
      queryLower.includes("travel")
    ) {
      const places = ["Nandi Hills", "Lalbagh", "Cubbon Park", "Wonderla"];
      const randomPlace = places[Math.floor(Math.random() * places.length)];
      return `${randomPlace} is worth visiting! Popular spot this time of year.`;
    }

    // College response - only if directly asked
    if (
      queryLower.includes("college") ||
      queryLower.includes("brindavan") ||
      queryLower.includes("education")
    ) {
      return `Brindavan College is in North Bangalore. Good engineering programs.`;
    }

    // Very generic response
    const genericResponses = [
      `Sure, I can help with that!`,
      `That's interesting to know.`,
      `Good question! Let me think...`,
      `I'm not entirely sure about that.`,
      `Sounds like a plan!`,
    ];

    return genericResponses[
      Math.floor(Math.random() * genericResponses.length)
    ];
  };

  // Return the functions that will be used in the Chatbox component
  return { sendAiMessage, respondToAiQuery };
};
