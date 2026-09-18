"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { BadgeCheckIcon, EyeIcon } from "@/components/ui/Icons";
import { formatTime, formatBid } from "@/utils/formatters";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  index: number;
}

export default function ProductCard({ product, onClick, index }: ProductCardProps) {
  const [time, setTime] = useState(product.time);

  useEffect(() => {
    const timer = setInterval(() => setTime((prev) => Math.max(0, prev - 10)), 10000);
    return () => clearInterval(timer);
  }, []);

  const isEndingSoon = time < 1800;
  const isRetail = product.listingMode === "RETAIL" || product.listingMode === "BOTH";
  const price = isRetail ? (product.buyNowPrice ?? product.bid) : product.bid;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.15) }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(product)}
      className="group bg-white border-2 border-ink shadow-brut-lg rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-brut-xl"
    >
      {/* Image */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden" style={{ backgroundColor: product.bg }}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 300px"
            className="object-cover"
          />
        ) : (
          <div className="text-7xl md:text-8xl group-hover:scale-110 transition-transform duration-300">{product.emoji}</div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <div className="flex flex-col gap-1 items-start">
            {isRetail && (
              <div className="bg-bubblegum border-2 border-ink rounded-full px-2 py-0.5">
                <span className="text-[9px] font-black uppercase text-white">🛍️ Buy Now</span>
              </div>
            )}
            {product.featured && (
              <div className="bg-acid border-2 border-ink rounded-full px-2 py-0.5">
                <span className="text-[9px] font-black uppercase text-ink">⚡ Featured</span>
              </div>
            )}
            {product.hot && (
              <div className="bg-bubblegum border-2 border-ink rounded-full px-2 py-0.5 flex items-center gap-1">
                <span className="text-xs">🔥</span>
                <span className="text-[9px] font-black uppercase text-white">HOT</span>
              </div>
            )}
          </div>
          {product.verified && (
            <div className="bg-white border-2 border-ink rounded-full p-1">
              <BadgeCheckIcon size={14} />
            </div>
          )}
        </div>

        {/* Live indicator */}
        <div className="absolute bottom-2 left-2 bg-ink text-white rounded-full px-2 py-0.5 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-acid rounded-full live-dot"></div>
          <span className="text-[10px] font-black uppercase">Live</span>
        </div>

        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur border-2 border-ink rounded-full px-2 py-0.5 flex items-center gap-1">
          <EyeIcon size={10} />
          <span className="text-[10px] font-black">{product.viewers}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 md:p-4">
        <h3 className="font-black text-sm md:text-base leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>

        <div className="flex flex-wrap items-start justify-end gap-2">
          <div>
            <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">{isRetail ? "Price" : "Current"}</p>
            <p className={`font-black text-lg md:text-xl tabular-nums ${isRetail ? "text-acid" : "text-bubblegum"}`}>₹{formatBid(price)}</p>
          </div>
          {!isRetail && (
            <div className={`text-right ${isEndingSoon ? "text-red-500" : ""}`}>
              <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">{isEndingSoon ? "🔥 Ending" : "Ends in"}</p>
              <p className="font-black text-sm md:text-base font-mono tabular-nums">{formatTime(time)}</p>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t-2 border-dashed border-ink/30 flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-500">
            {isRetail ? "instant" : `${product.bids} bids`}
          </span>
          <span className="text-[10px] font-black uppercase text-ink group-hover:text-bubblegum transition-colors">
            {isRetail ? "Buy now →" : "Bid now →"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
