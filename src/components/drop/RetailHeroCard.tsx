"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheckIcon } from "@/components/ui/Icons";
import { CATEGORIES } from "@/data/categories";
import { formatBid } from "@/utils/formatters";
import type { Product } from "@/types";

export default function RetailHeroCard({ product }: { product: Product }) {
  const category = CATEGORIES.find((c) => c.id === product.category);
  const price = product.buyNowPrice ?? product.bid;

  return (
    <>
      <section className="relative max-w-7xl mx-auto pt-10 pb-6 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border-2 border-ink bg-bubblegum text-white">
            🛍️ Buy Now · {category?.emoji} {category?.name}
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-6">
            {product.name.split(" ")[0]}
            <br />
            <span className="relative inline-block">
              {product.name.split(" ").slice(1).join(" ")}
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M2,8 Q50,2 100,6 T198,5" stroke="#D4FF33" strokeWidth="4" fill="none" strokeLinecap="round" />
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
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 224px, 320px"
                className="object-cover"
              />
            ) : (
              <div className="text-8xl md:text-9xl opacity-80 select-none">{product.emoji}</div>
            )}
          </motion.div>

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
        </div>
      </section>

      <section className="relative z-30 max-w-3xl mx-auto px-4 pb-16">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-ink shadow-brut-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b-2 border-dashed border-ink">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Buy Now Price</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl md:text-5xl font-black tabular-nums text-acid">₹{formatBid(price)}</span>
                <span className="text-[10px] font-black uppercase bg-ink/5 border border-ink/20 rounded-full px-2 py-1">
                  + ₹39 fee · sold by a verified seller
                </span>
              </div>
            </div>
            <div className="bg-ink text-white p-4 rounded-2xl border-2 border-ink text-center w-full md:w-auto min-w-[160px]">
              <p className="text-[10px] uppercase mb-1 tracking-widest text-acid">HypeThrift</p>
              <span className="text-2xl md:text-3xl font-black font-mono tabular-nums">Protected</span>
            </div>
          </div>

          <div className="font-black uppercase text-sm text-gray-500">
            Pay to HypeThrift, we release funds to the seller only after you confirm delivery.
          </div>

          <Link
            href={product.listingId ? `/listing/${encodeURIComponent(product.listingId)}` : "/listings"}
            className="block mt-5 w-full border-2 border-ink shadow-brut-lg font-black uppercase text-lg md:text-2xl py-4 rounded-2xl flex items-center justify-center gap-3 bg-bubblegum text-white hover:bg-acid hover:text-ink transition-colors"
          >
            🛍️ BUY NOW · ₹{formatBid(price)}
          </Link>
        </motion.div>
      </section>
    </>
  );
}