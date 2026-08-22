"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CONFETTI_COUNT = 60;
const COLORS = ["#FF66B2", "#33CCFF", "#D4FF33", "#FFFFFF", "#121212"];

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

interface ConfettiProps {
  active: boolean;
}

export default function Confetti({ active }: ConfettiProps) {
  const [dimensions, setDimensions] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(CONFETTI_COUNT)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -50, x: Math.random() * dimensions.width, rotate: 0, opacity: 1 }}
              animate={{
                y: dimensions.height + 100,
                x: Math.random() * dimensions.width,
                rotate: Math.random() * 720 - 360,
                opacity: 0,
              }}
              transition={{ duration: randomBetween(2.5, 4), ease: "easeOut" }}
              className="absolute"
              style={{
                width: `${randomBetween(8, 16)}px`,
                height: `${randomBetween(8, 16)}px`,
                backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
