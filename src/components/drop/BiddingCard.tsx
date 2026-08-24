"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "@/components/ui/Confetti";
import { ArrowRightIcon, BadgeCheckIcon, HeartIcon, TrendingUpIcon, ShareIcon, StarIcon } from "@/components/ui/Icons";
import { CATEGORIES } from "@/data/categories";
import { formatTimeFull, formatBid } from "@/utils/formatters";
import type { Product } from "@/types";

const BID_INCREMENT = 50;

export default function BiddingCard({ product }: { product: Product }) {
  const [time, setTime] = useState(product.time);
  const [liked, setLiked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bidPlaced, setBidPlaced] = useState(false);
  const [currentBid, setCurrentBid] = useState(product.bid);
  const [viewers, setViewers] = useState(product.viewers);

  useEffect(() => {
    setTime(product.time);
    setCurrentBid(product.bid);
    setViewers(product.viewers);
    setBidPlaced(false);
  }, [product.id, product.time, product.bid, product.viewers]);

  useEffect(() => {
    const timer = setInterval(() => setTime((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setViewers((prev) => Math.max(50, prev + Math.floor(Math.random() * 7) - 3));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handlePlaceBid = () => {
    setCurrentBid((prev) => prev + BID_INCREMENT);
    setShowConfetti(true);
    setBidPlaced(true);
    setTimeout(() => setShowConfetti(false), 3500);
    setTimeout(() => setBidPlaced(false), 2000);
  };

  const nextBid = currentBid + BID_INCREMENT;
  const category = CATEGORIES.find((c) => c.id === product.category);

  return (
    <>
      <section className="relative max-w-7xl mx-auto pt-10 pb-10 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-block bg-ink text-acid px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border-2 border-ink">
            ⚡ Featured Drop · {category?.emoji} {category?.name}
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-6">
            {product.name.split(" ")[0]}
            <br />
            <span className="relative inline-block">
              {product.name.split(" ").slice(1).join(" ")}
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M2,8 Q50,2 100,6 T198,5" stroke="#FF66B2" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
        </motion.div>

        <div className="relative flex justify-center items-center">
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 w-56 h-56 md:w-80 md:h-80 border-2 border-ink rounded-[2rem] shadow-brut-xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: product.bg }}
          >
            <div className="text-8xl md:text-9xl opacity-80 select-none">{product.emoji}</div>
          </motion.div>

          {product.hot && (
            <motion.div
              animate={{ rotate: [0, 10, 0], y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 left-4 md:left-16 z-20"
            >
              <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-brutal">
                <polygon points="50,5 61,38 95,38 67,59 78,92 50,71 22,92 33,59 5,38 39,38" fill="#FF66B2" stroke="#121212" strokeWidth="4" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase text-center px-4 text-white">
                🔥<br />HOT
              </span>
            </motion.div>
          )}

          {product.verified && (
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-8 right-4 md:right-16 z-20 bg-acid border-2 border-ink rounded-full px-4 py-2 shadow-brut-md flex items-center gap-2"
            >
              <BadgeCheckIcon />
              <span className="font-black uppercase text-sm">Verified</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => setLiked(!liked)}
            aria-label={liked ? "Unlike drop" : "Like drop"}
            className="absolute top-6 right-6 md:right-24 z-20 bg-white border-2 border-ink rounded-full p-3 shadow-brut-md"
          >
            <HeartIcon filled={liked} />
          </motion.button>
        </div>
      </section>

      <section className="relative z-30 max-w-3xl mx-auto px-4 pb-16" id="bid-card">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-ink shadow-brut-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b-2 border-dashed border-ink">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Current Bid</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <motion.span
                  key={currentBid}
                  initial={{ scale: 1.3, color: "#D4FF33" }}
                  animate={{ scale: 1, color: "#FF66B2" }}
                  className="text-4xl md:text-5xl font-black tabular-nums"
                >
                  ₹{formatBid(currentBid)}
                </motion.span>
                <div className="flex items-center gap-1 bg-acid px-2 py-1 rounded border-2 border-ink">
                  <TrendingUpIcon />
                  <span className="text-[10px] font-black">+12%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{product.bids} bids · {viewers} watching</p>
            </div>

            <div className="bg-ink text-white p-4 rounded-2xl border-2 border-ink text-center w-full md:w-auto min-w-[160px]">
              <p className="text-[10px] uppercase mb-1 tracking-widest text-acid">Auction Ends In</p>
              <span className="text-2xl md:text-3xl font-black font-mono tabular-nums">{formatTimeFull(time)}</span>
            </div>
          </div>

          <motion.button
            whileHover={bidPlaced ? { x: 4, y: 4, boxShadow: "0px 0px 0px 0px #121212" } : { x: 4, y: 4 }}
            whileTap={bidPlaced ? { x: 8, y: 8, boxShadow: "0px 0px 0px 0px #121212" } : { x: 8, y: 8 }}
            onClick={handlePlaceBid}
            className={`w-full border-2 border-ink shadow-brut-lg font-black uppercase text-lg md:text-2xl py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${
              bidPlaced ? "bg-acid text-ink" : "bg-ink text-white cursor-pointer shine-btn"
            }`}
          >
            {bidPlaced ? "✓ BID PLACED!" : `PLACE BID · ₹${formatBid(nextBid)}`}
            {!bidPlaced && <ArrowRightIcon />}
          </motion.button>

          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-white border-2 border-ink shadow-brut-sm py-2.5 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#121212] transition-all">
              <ShareIcon /> Share
            </button>
            <button className="flex-1 bg-white border-2 border-ink shadow-brut-sm py-2.5 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#121212] transition-all">
              <StarIcon /> Save
            </button>
          </div>
        </motion.div>
      </section>

      <Confetti active={showConfetti} />
    </>
  );
}
