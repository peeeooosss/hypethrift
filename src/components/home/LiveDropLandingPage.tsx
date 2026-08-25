"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import CategoryBar from "@/components/ui/CategoryBar";
import ProductCard from "@/components/drop/ProductCard";
import BiddingCard from "@/components/drop/BiddingCard";
import { SearchIcon, FilterIcon } from "@/components/ui/Icons";

import { CATEGORIES } from "@/data/categories";
import type { CategoryId, Product } from "@/types";
import FilterDrawer from "@/components/home/FilterDrawer";

export default function LiveDropLandingPage({ products }: { products: Product[] }) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [featuredProduct, setFeaturedProduct] = useState<Product>(
    () => products.find((p) => p.hot) ?? products[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const gridRef = useRef<HTMLElement>(null);

  const categoryCounts = useMemo(
    () =>
      CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
        acc[cat.id] = cat.id === "all" ? products.length : products.filter((p) => p.category === cat.id).length;
        return acc;
      }, {}),
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const notFeatured = p.id !== featuredProduct?.id;
        return matchesCategory && matchesSearch && notFeatured;
      }),
    [products, selectedCategory, searchQuery, featuredProduct?.id],
  );

  const handleCategorySelect = (catId: CategoryId) => {
    setSelectedCategory(catId);
    // Auto-select the top (hot) product in this category as featured
    const topProduct = products.find((p) => (catId === "all" ? p.hot : p.category === catId));
    if (topProduct) setFeaturedProduct(topProduct);
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleProductClick = (product: Product) => {
    setFeaturedProduct(product);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory);

  if (!featuredProduct) {
    return <div className="min-h-screen bg-cream flex items-center justify-center p-8 font-black uppercase">No live auctions yet.</div>;
  }

  return (
    <div className="min-h-screen bg-cream text-ink overflow-hidden font-sans relative">
      {/* Diagonal stripe texture overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #121212, #121212 2px, transparent 2px, transparent 35px)",
          }}
        />
      </div>

      {/* Top Navigation */}
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black uppercase tracking-tighter">
          HypeThrift
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="bg-ink text-white font-black uppercase text-sm py-2 px-4 rounded-full border-2 border-ink shadow-brut-md hover:bg-acid hover:text-ink transition-colors"
          >
            Customer Login
          </Link>
          <Link
            href="/seller"
            className="bg-bubblegum text-ink font-black uppercase text-sm py-2 px-4 rounded-full border-2 border-ink shadow-brut-md hover:bg-acid hover:text-ink transition-colors"
          >
            Seller Portal
          </Link>
        </div>
      </nav>

      <CategoryBar selected={selectedCategory} onSelect={handleCategorySelect} counts={categoryCounts} />

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/60">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${activeCategory?.name}...`}
            className="w-full bg-white border-2 border-ink rounded-full py-3 pl-12 pr-4 font-bold text-sm placeholder:text-ink/40 focus:outline-none focus:shadow-brut-md transition-shadow"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-ink text-white rounded-full flex items-center justify-center text-xs font-black"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Featured Product (Bidding Card) */}
      <AnimatePresence mode="wait">
        <motion.div key={featuredProduct.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <BiddingCard product={featuredProduct} />
        </motion.div>
      </AnimatePresence>

      {/* Products Grid */}
      <section ref={gridRef} className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
              {activeCategory?.emoji} {searchQuery ? `Results for "${searchQuery}"` : activeCategory?.name}
            </h2>
            <p className="text-sm text-gray-500 font-bold mt-1">
              {filteredProducts.length} live {filteredProducts.length === 1 ? "drop" : "drops"} available
            </p>
          </div>
</div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-white border-2 border-ink rounded-full px-4 py-2 shadow-brut-xs">
            <span className="text-xs font-black uppercase">Sort:</span>
            <select aria-label="Sort drops" className="bg-transparent text-xs font-black uppercase focus:outline-none cursor-pointer">
              <option>Ending Soon</option>
              <option>Price: Low</option>
              <option>Price: High</option>
              <option>Most Bids</option>
            </select>
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="p-3 bg-ink text-white border-2 border-ink rounded-full shadow-brut-md hover:bg-bubblegum hover:text-ink transition-colors"
            aria-label="Open filters"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.414V4z" />
            </svg>
          </button>
        </div>
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-black mb-2">No drops found</h3>
            <p className="text-gray-500 font-bold mb-6">Try a different category or search term</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="bg-ink text-white font-black uppercase px-6 py-3 rounded-full border-2 border-ink shadow-brut-acid hover:shadow-brut-acid-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Show All Drops
            </button>
          </div>
        )}
      </section>

      {/* Seller Portal Footer */}
      <footer className="bg-ink text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400 font-bold mb-2">Want to sell your thrift?</p>
              <Link
                href="/seller"
                className="inline-block bg-bubblegum text-ink font-black uppercase px-6 py-3 rounded-full border-2 border-ink shadow-brut-md hover:bg-acid hover:text-ink transition-colors"
              >
                Sell with Us
              </Link>
            </div>
            <div className="w-full md:w-auto border-t md:border-t-0 border-l md:border-l-0 border-ink/30 my-4 md:my-0 px-4 md:px-0" />
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400 font-bold mb-2">Already a seller?</p>
              <Link
                href="/seller"
                className="inline-block bg-white text-ink font-black uppercase px-6 py-3 rounded-full border-2 border-white shadow-brut-md hover:bg-acid hover:text-ink transition-colors"
              >
                Seller Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
