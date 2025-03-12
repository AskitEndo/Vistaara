import React, { useMemo } from "react";

interface EmojiDpProps {
  seed?: string; // Optional seed for deterministic generation
  size?: number; // Size in pixels
  className?: string;
}

const EmojiDp: React.FC<EmojiDpProps> = ({
  seed = Math.random().toString(),
  size = 40,
  className = "",
}) => {
  // Generate a pseudo-random number based on string seed
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Get random item from array based on seed
  const getRandomItem = (array: string[], seedStr: string): string => {
    const index = hashCode(seedStr) % array.length;
    return array[index];
  };

  // Memoize calculations to avoid recomputing on re-renders
  const { emoji, backgroundColor, textColor } = useMemo(() => {
    // List of fun emojis for avatars
    const emojis = [
      "😀",
      "😎",
      "🤖",
      "👽",
      "🦄",
      "🐱",
      "🐶",
      "🦊",
      "🦁",
      "🐯",
      "🐼",
      "🐨",
      "🐵",
      "🦝",
      "🦥",
      "🐙",
      "🐬",
      "🦈",
      "🦩",
      "🦚",
      "🦜",
      "🐝",
      "🦋",
      "🐢",
      "🐸",
      "🦕",
      "🌞",
      "🌜",
      "⭐",
      "🍀",
      "🌈",
      "🔥",
      "💧",
      "🌊",
      "🍎",
      "🍓",
      "🌵",
      "🌴",
      "🍄",
      "🚀",
    ];

    // Background color options - cyberpunk theme
    const bgColors = [
      "#1a2a36", // Dark blue-gray
      "#78C0A8", // Teal
      "#428a97", // Slate blue
      "#304ffe", // Indigo
      "#00b0ff", // Bright blue
      "#00e5ff", // Cyan
      "#76ff03", // Neon green
      "#ffea00", // Yellow
      "#ff5722", // Deep orange
      "#7c4dff", // Purple
    ];

    // Get emoji and color based on seed
    const selectedEmoji = getRandomItem(emojis, seed + "emoji");
    const selectedBgColor = getRandomItem(bgColors, seed + "color");

    // Determine text color based on background brightness
    // Simple algorithm to choose white or black text
    const r = parseInt(selectedBgColor.slice(1, 3), 16);
    const g = parseInt(selectedBgColor.slice(3, 5), 16);
    const b = parseInt(selectedBgColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness > 128 ? "#1a2a36" : "#ffffff";

    return {
      emoji: selectedEmoji,
      backgroundColor: selectedBgColor,
      textColor,
    };
  }, [seed]);

  return (
    <div
      className={`flex items-center justify-center rounded-full select-none ${className}`}
      style={{
        backgroundColor,
        color: textColor,
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.5}px`,
        boxShadow: `0 0 0 2px ${textColor}22`,
      }}
    >
      {emoji}
    </div>
  );
};

// Export with proper capitalization for React component
export default EmojiDp;
