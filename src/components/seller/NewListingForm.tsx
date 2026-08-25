"use client";

import { useState } from "react";
import { useActionState } from "react";
import { UploadButton } from "@/components/ui/UploadThing";
import { createListing } from "@/actions/listing-actions";
import { getSizesForCategory, isOneSizeCategory } from "@/lib/sizes";

const MAX_IMAGES = 8;

type Category = Awaited<ReturnType<typeof import("@/lib/prisma").prisma.category.findMany>>[number];

interface NewListingFormProps {
  categories: Category[];
}

export default function NewListingForm({ categories }: NewListingFormProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [serverState, formAction] = useActionState(createListing, null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedCategorySlug = selectedCategory?.slug ?? "";
  const availableSizes = selectedCategorySlug ? getSizesForCategory(selectedCategorySlug) : [];
  const oneSize = isOneSizeCategory(selectedCategorySlug);

  return (
    <div className="bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black uppercase mb-6">Create New Drop</h1>

      {serverState?.error && (
        <p className="mb-4 text-red-500 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl py-2 px-3">{serverState.error}</p>
      )}
      {serverState?.success && (
        <p className="mb-4 text-acid text-sm font-bold bg-acid/20 border-2 border-acid rounded-xl py-2 px-3">
          Listing saved! Check your listings table below.
        </p>
      )}

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="images" value={images.join(",")} />

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Title</label>
          <input name="title" type="text" required minLength={3}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
            placeholder="e.g. Jordan 1 Chicago (2015)" />
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Description</label>
          <textarea name="description" required minLength={10} rows={4}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
            placeholder="Condition, authenticity, what to expect..." />
        </div>

         <div>
           <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Category</label>
           <select
             name="categoryId"
             required
             value={selectedCategoryId}
             onChange={(e) => {
               setSelectedCategoryId(e.target.value);
               if (e.target.value) {
                 const slug = categories.find((c) => c.id === e.target.value)?.slug ?? "";
                 if (isOneSizeCategory(slug)) {
                   setSelectedSize("One Size");
                 } else {
                   setSelectedSize("");
                 }
               }
             }}
             className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
           >
             <option value="">Select a category</option>
             {categories.map((c) => (
               <option key={c.id} value={c.id}>
                 {c.emoji} {c.name}
               </option>
             ))}
           </select>
         </div>

         <input type="hidden" name="size" value={selectedSize} />

         <div>
           <div className="flex items-center justify-between mb-1">
             <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Images</label>
             <span className={`text-xs font-black uppercase ${images.length > 0 ? "text-green-600" : "text-gray-400"}`}>
               {images.length}/{MAX_IMAGES} uploaded
             </span>
           </div>

           {uploadError && (
             <p className="mb-3 text-red-500 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl py-2 px-3">
               Upload failed: {uploadError}
             </p>
           )}

           {images.length > 0 && (
             <div className="flex flex-wrap gap-3 mb-3">
               {images.map((url) => (
                 <div key={url} className="relative w-20 h-20 rounded-xl border-2 border-ink overflow-hidden group">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                   <button
                     type="button"
                     aria-label="Remove image"
                     onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                     className="absolute top-0 right-0 w-6 h-6 bg-ink text-white text-xs font-black flex items-center justify-center"
                   >
                     ✕
                   </button>
                 </div>
               ))}
             </div>
           )}

           {images.length < MAX_IMAGES && (
             <UploadButton
               endpoint="images"
               appearance={{ button: "bg-ink text-white text-xs font-black uppercase rounded-xl px-4 py-2" }}
               onClientUploadComplete={(res) => {
                 setUploadError(null);
                 setImages((prev) => {
                   const next = [...prev];
                   for (const r of res ?? []) {
                     if (r.url && !next.includes(r.url) && next.length < MAX_IMAGES) {
                       next.push(r.url);
                     }
                   }
                   return next;
                 });
               }}
               onUploadError={(err: Error) => {
                 setUploadError(err.message || "Something went wrong. Check your connection and try again.");
               }}
             />
           )}
           {images.length >= MAX_IMAGES && (
             <p className="text-xs font-black uppercase text-gray-500">Maximum of {MAX_IMAGES} images reached.</p>
           )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
             <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Starting Bid (₹)</label>
             <input name="startingBid" type="number" required min={1}
               className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm" />
           </div>
           <div>
             <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Reserve Price (₹)</label>
             <input name="reservePrice" type="number" min={1}
               className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
               placeholder="Optional" />
           </div>
           <div>
             <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Auction Duration</label>
             <select name="duration" required defaultValue="24"
               className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm">
               <option value="1">1 hour</option>
               <option value="4">4 hours</option>
               <option value="12">12 hours</option>
               <option value="24">24 hours</option>
               <option value="48">48 hours</option>
             </select>
           </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Size</label>
             {availableSizes.length === 1 && oneSize ? (
               <div className="w-full bg-ink/5 border-2 border-ink rounded-xl px-4 py-3 font-black text-sm">
                 One Size
               </div>
             ) : (
               <select
                 name="sizeSelect"
                 required
                 value={selectedSize}
                 onChange={(e) => setSelectedSize(e.target.value)}
                 disabled={!selectedCategorySlug}
                 className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-black text-sm focus:outline-none focus:shadow-brut-sm disabled:opacity-50"
               >
                 <option value="">Select a size</option>
                 {availableSizes.map((s) => (
                   <option key={s} value={s}>
                     {s}
                   </option>
                 ))}
               </select>
             )}
           </div>
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Condition</label>
            <select name="condition"
              className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm">
              <option value="">Select condition</option>
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            name="action"
            value="save_draft"
            className="flex-1 bg-white border-2 border-ink shadow-brut-md py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            name="action"
            value="submit_review"
            className="flex-1 bg-ink text-white border-2 border-ink shadow-brut-lg py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum hover:text-ink transition-colors"
          >
            Submit for Review
          </button>
        </div>
      </form>
    </div>
  );
}
