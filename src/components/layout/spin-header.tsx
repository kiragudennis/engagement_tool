"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Gift, ArrowRight, Zap, Star } from "lucide-react";

// Prize data for the spinning animation
const prizes = [
  {
    id: 1,
    name: "50% OFF",
    icon: "🎉",
    color: "from-yellow-400 to-orange-500",
    value: "50%",
  },
  {
    id: 2,
    name: "1000 Points",
    icon: "⭐",
    color: "from-blue-400 to-indigo-500",
    value: "1000",
  },
  {
    id: 3,
    name: "Free Gift",
    icon: "🎁",
    color: "from-pink-400 to-rose-500",
    value: "Gift",
  },
  {
    id: 4,
    name: "20% OFF",
    icon: "✨",
    color: "from-green-400 to-emerald-500",
    value: "20%",
  },
  {
    id: 5,
    name: "500 Points",
    icon: "🌟",
    color: "from-purple-400 to-violet-500",
    value: "500",
  },
  {
    id: 6,
    name: "Free Shipping",
    icon: "🚚",
    color: "from-cyan-400 to-blue-500",
    value: "Free",
  },
];

export default function SpinHero() {
  const [spinningIndex, setSpinningIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-rotate prizes for continuous excitement
  useEffect(() => {
    const interval = setInterval(() => {
      setSpinningIndex((prev) => (prev + 1) % prizes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-16 relative z-10">
        {/* Three Column Layout for Large Devices */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          {/* Left Column - Prize Showcase */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Today's Top Prizes
                </h3>
                <div className="space-y-2">
                  {prizes.slice(0, 3).map((prize, idx) => (
                    <motion.div
                      key={prize.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 bg-white/10 rounded-lg p-3"
                    >
                      <span className="text-2xl">{prize.icon}</span>
                      <span className="font-medium">{prize.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Center Column - Main Content */}
          <div className="text-center lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">Win Amazing Prizes</span>
              </motion.div>

              {/* Title with animation */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
                animate={{
                  textShadow: isHovering
                    ? ["0 0 0px #fff", "0 0 20px #fff", "0 0 0px #fff"]
                    : "0 0 0px #fff",
                }}
                transition={{ duration: 1, repeat: isHovering ? Infinity : 0 }}
              >
                Spin &{" "}
                <motion.span
                  className="inline-block"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  Win
                </motion.span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg opacity-90 max-w-md mx-auto mb-8"
              >
                Try your luck on our prize wheel! Every spin gives you a chance
                to win points, discounts, and amazing products.
              </motion.p>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => setIsHovering(true)}
                onHoverEnd={() => setIsHovering(false)}
                className="group relative bg-white text-purple-600 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <span className="flex items-center gap-2">
                  Spin the Wheel Now!
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 rounded-full bg-white"
                  initial={{ scale: 1 }}
                  animate={{ scale: isHovering ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ zIndex: -1 }}
                />
              </motion.button>
            </motion.div>
          </div>

          {/* Right Column - Spinning Wheel Preview */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="relative w-48 h-48 mx-auto">
                  {/* Spinning Wheel Animation */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-white/30"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                  </motion.div>

                  {/* Prize Segments */}
                  {prizes.map((prize, idx) => (
                    <motion.div
                      key={prize.id}
                      className="absolute w-full h-full"
                      style={{ transform: `rotate(${idx * 60}deg)` }}
                    >
                      <div
                        className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br ${prize.color} flex items-center justify-center text-2xl shadow-lg`}
                      >
                        {prize.icon}
                      </div>
                    </motion.div>
                  ))}

                  {/* Center pointer */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 w-12 h-12 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Zap className="h-6 w-6 text-purple-600" />
                  </motion.div>
                </div>

                {/* Current Prize Highlight */}
                <motion.div
                  key={spinningIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 text-center"
                >
                  <p className="text-sm opacity-80">Featured Prize</p>
                  <motion.p
                    className="text-xl font-bold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    {prizes[spinningIndex].name}
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile: Horizontal Scrolling Prizes */}
        <div className="lg:hidden mt-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
          >
            {prizes.map((prize, idx) => (
              <motion.div
                key={prize.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className={`flex-shrink-0 bg-gradient-to-br ${prize.color} rounded-xl p-4 text-center min-w-[100px]`}
              >
                <div className="text-3xl mb-2">{prize.icon}</div>
                <p className="text-sm font-semibold">{prize.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Floating particles for excitement */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, -100, -200],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
