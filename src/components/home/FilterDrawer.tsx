"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { getSizesForCategory, SIZE_OPTIONS } from "@/lib/sizes";
import { LISTING_CONDITIONS } from "@/data/conditions";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialSizes?: string[];
  initialConditions?: string[];
  initialMinPrice?: number;
  initialMaxPrice?: number;
}

const ALL_SIZES = Array.from(new Set(Object.values(SIZE_OPTIONS).flat()));

export default function FilterDrawer({
  isOpen,
  onClose,
  initialCategory,
  initialSizes = [],
  initialConditions = [],
  initialMinPrice,
  initialMaxPrice,
}: FilterDrawerProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialSizes);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(initialConditions);
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice?.toString() || "");
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice?.toString() || "");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    );
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedConditions([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedConditions.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "";

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (selectedCategories.length > 0) {
      params.set("cat", selectedCategories.join(","));
    }
    if (selectedSizes.length > 0) {
      params.set("sizes", selectedSizes.join(","));
    }
    if (selectedConditions.length > 0) {
      params.set("condition", selectedConditions.join(","));
    }
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    window.location.href = `/listings?${params.toString()}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white z-50 shadow-brut-xl border-l-2 border-ink`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-ink">
          <h2 className="text-xl font-black uppercase">Filters</h2>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="text-xs font-black uppercase text-gray-500 hover:text-ink underline"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-white border-2 border-ink rounded-xl hover:bg-ink/5 transition-colors"
              aria-label="Close filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-6">
          {/* Categories */}
          <FilterSection title="Categories" count={CATEGORIES.filter(c => c.id !== "all").length}>
            <div className="space-y-2">
              {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                <label key={cat.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="w-4 h-4 bg-white border-2 border-ink rounded text-acid focus:ring-2 focus:ring-acid focus:ring-offset-2"
                  />
                  <span className="flex items-center gap-2 font-black text-sm uppercase">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="uppercase">{cat.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Sizes */}
          <FilterSection title="Sizes" count={ALL_SIZES.length}>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((size) => (
                <label key={size} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(size)}
                    onChange={() => toggleSize(size)}
                    className="w-4 h-4 bg-white border-2 border-ink rounded text-acid focus:ring-2 focus:ring-acid focus:ring-offset-2"
                  />
                  <span className="font-black text-sm uppercase">{size}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Conditions */}
          <FilterSection title="Condition" count={LISTING_CONDITIONS.length}>
            <div className="space-y-2">
              {LISTING_CONDITIONS.map((condition) => (
                <label key={condition} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedConditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                    className="w-4 h-4 bg-white border-2 border-ink rounded text-acid focus:ring-2 focus:ring-acid focus:ring-offset-2"
                  />
                  <span className="font-black text-sm uppercase">{condition.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection title="Price Range (₹)" count={2}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase font-bold text-gray-500 tracking-widest mb-1 block">Min Price</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-500 tracking-widest mb-1 block">Max Price</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="No limit"
                  className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
                  min="0"
                />
              </div>
            </div>
          </FilterSection>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t-2 border-ink space-y-3">
          <button
            onClick={applyFilters}
            disabled={!hasActiveFilters}
            className="w-full bg-ink text-white border-2 border-ink shadow-brut-md py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Filters
          </button>
          <Link
            href="/listings"
            className="block text-center bg-white border-2 border-ink py-3 rounded-2xl font-black uppercase text-sm hover:bg-ink/5 transition-colors"
          >
            View All Listings
          </Link>
        </div>
      </motion.div>
    </>
  );
}

function FilterSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="border-b border-ink/10 pb-4">
      <h3 className="flex items-center justify-between text-xs uppercase font-black text-gray-500 tracking-widest mb-3">
        <span>{title}</span>
        <span className="text-xs font-black px-2 py-0.5 rounded-full border-2 border-ink bg-ink/5">{count}</span>
      </h3>
      {children}
    </div>
  );
}