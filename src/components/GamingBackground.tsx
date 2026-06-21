"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FloatingItem {
  id: number;
  type: "coin" | "sparkle" | "ticket" | "star";
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

export default function GamingBackground() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    // Generate floating items
    const newItems: FloatingItem[] = [];
    const types: FloatingItem["type"][] = ["coin", "sparkle", "ticket", "star"];

    for (let i = 0; i < 60; i++) {
      newItems.push({
        id: i,
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 20,
        size: 16 + Math.random() * 24,
        rotation: Math.random() * 360,
      });
    }
    setItems(newItems);
  }, []);

  const getIcon = (type: string, size: number) => {
    const iconSize = size;

    switch (type) {
      case "coin":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
            />
            <circle
              cx="12"
              cy="12"
              r="6"
              stroke="currentColor"
              strokeWidth="1"
              fill="currentColor"
              opacity="0.3"
            />
            <text
              x="9"
              y="16"
              fontSize="10"
              fill="currentColor"
              fontWeight="bold"
              opacity="0.8"
            >
              $
            </text>
          </svg>
        );
      case "sparkle":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              opacity="0.5"
            />
            <path
              d="M12 4L13 8L17 9L13 10L12 14L11 10L7 9L11 8L12 4Z"
              fill="currentColor"
              opacity="0.8"
            />
          </svg>
        );
      case "ticket":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="6"
              width="18"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
              opacity="0.6"
            />
            <line
              x1="8"
              y1="10"
              x2="16"
              y2="10"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
            <line
              x1="8"
              y1="14"
              x2="14"
              y2="14"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
          </svg>
        );
      case "star":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L15 9H22L16 14L19 21L12 16.5L5 21L8 14L2 9H9L12 2Z"
              stroke="currentColor"
              strokeWidth="1"
              fill="currentColor"
              opacity="0.5"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden opacity-50">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950" />

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: ["0%", "100%", "0%"],
          y: ["0%", "50%", "0%"],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl"
      />
      <motion.div
        animate={{
          x: ["100%", "0%", "100%"],
          y: ["100%", "0%", "100%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-3xl"
      />

      {/* Floating items */}
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{
            x: `${item.x}vw`,
            y: `${item.y}vh`,
            rotate: item.rotation,
            opacity: 0,
          }}
          animate={{
            y: [
              `${item.y}vh`,
              `${(item.y + 20) % 100}vh`,
              `${(item.y + 40) % 100}vh`,
              `${(item.y + 20) % 100}vh`,
              `${item.y}vh`,
            ],
            rotate: [item.rotation, item.rotation + 360],
            opacity: [0, 0.4, 0.6, 0.4, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute pointer-events-none"
          style={{
            color:
              item.type === "coin"
                ? "#FBBF24"
                : item.type === "sparkle"
                  ? "#A78BFA"
                  : item.type === "ticket"
                    ? "#34D399"
                    : "#F472B6",
            filter: "blur(0.5px)",
          }}
        >
          {getIcon(item.type, item.size)}
        </motion.div>
      ))}

      {/* Slot machine pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="slots"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="40"
                cy="40"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <text x="35" y="45" fontSize="12" fill="currentColor">
                7
              </text>
              <line
                x1="25"
                y1="40"
                x2="55"
                y2="40"
                stroke="currentColor"
                strokeWidth="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#slots)" />
        </svg>
      </div>
    </div>
  );
}
