"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/data/categories";
import type { CategoryId } from "@/types";

interface CategoryBarProps {
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
  counts: Record<string, number>;
}

export default function CategoryBar({ selected, onSelect, counts }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-[84px] md:top-[88px] z-40 bg-cream/95 backdrop-blur-md border-b-2 border-ink py-3 px-2">
      <div ref={scrollRef} className="hide-scrollbar max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-1 px-2">
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.id;
          const count = counts[cat.id] || 0;
          return (
            <motion.button
              key={cat.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border-2 border-ink transition-all ${
                isActive ? "shadow-brut-md" : "shadow-brut-xs hover:shadow-brut-sm"
              }`}
              style={{
                backgroundColor: isActive ? cat.color : "#FFFFFF",
                color: isActive ? cat.textColor : "#121212",
              }}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className="font-black text-sm uppercase whitespace-nowrap">{cat.name}</span>
              {count > 0 && (
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-ink"
                  style={{
                    backgroundColor: isActive ? "#FFFFFF" : cat.color,
                    color: "#121212",
                  }}
                >
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
