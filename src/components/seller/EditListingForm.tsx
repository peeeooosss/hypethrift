"use client";

import { useState } from "react";
import { useActionState } from "react";
import { UploadButton } from "@/components/ui/UploadThing";
import { updateListing } from "@/actions/listing-actions";
import { getSizesForCategory, isOneSizeCategory } from "@/lib/sizes";

const MAX_IMAGES = 8;

type Category = Awaited<ReturnType<typeof import("@/lib/prisma").prisma.category.findMany>>[number];

export interface EditListingData {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  startingBid: number;
  reservePrice: number | null;
  size: string | null;
  condition: string | null;
  images: string[];
  status: string;
}

interface EditListingFormProps {
  listing: EditListingData;
  categories: Category[];
}

export default function EditListingForm({ listing, categories }: EditListingFormProps) {
  const [images, setImages] = useState<string[]>(listing.images);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(listing.categoryId);
  const [selectedSize, setSelectedSize] = useState(listing.size ?? "");
  const [serverState, formAction] = useActionState(updateListing, null);

  const selectedCategorySlug = categories.find((c) => c.id === selectedCategoryId)?.slug ?? "";
  const availableSizes = selectedCategorySlug ? getSizesForCategory(selectedCategorySlug) : [];
  const oneSize = isOneSizeCategory(selectedCategorySlug);

  return (
    <div className="bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black uppercase mb-2">Edit Drop</h1>
      {listing.status === "ACTIVE" && (
        <p className="mb-4 text-xs font-bold bg-bubblegum/30 border-2 border-bubblegum rounded-xl py-2 px-3">
          This auction is live with no bids yet. Saving your changes resets the timer to 24 hours.
        </p>
      )}

      {serverState?.error && (
        <p className="mb-4 text-red-500 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl py-2 px-3">{serverState.error}</p>
      )}
      {serverState?.success && (
        <p className="mb-4 text-acid text-sm font-bold bg-acid/20 border-2 border-acid rounded-xl py-2 px-3">
          Listing updated!
        </p>
      )}

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="listingId" value={listing.id} />
        <input type="hidden" name="images" value={images.join(",")} />

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Title</label>
          <input name="title" type="text" required minLength={3} defaultValue={listing.title}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm" />
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Description</label>
          <textarea name="description" required minLength={10} rows={4} defaultValue={listing.description}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm" />
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
                setSelectedSize(isOneSizeCategory(slug) ? "One Size" : "");
              }
            }}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
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
                <div key={url} className="relative w-20 h-20 rounded-xl border-2 border-ink overflow-hidden">
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
              onClientUploadComplete={(res) => {
                setUploadError(null);
                setImages((prev) => {
                  const next = [...prev];
                  for (const r of res ?? []) {
                    if (r.url && !next.includes(r.url) && next.length < MAX_IMAGES) next.push(r.url);
                  }
                  return next;
                });
              }}
              onUploadError={(err: Error) => {
                setUploadError(err.message || "Something went wrong. Try again.");
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Starting Bid (₹)</label>
            <input name="startingBid" type="number" required min={1} defaultValue={listing.startingBid}
              className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Reserve Price (₹)</label>
            <input
              name="reservePrice"
              type="number"
              min={1}
              defaultValue={listing.reservePrice ?? ""}
              placeholder="Optional — minimum sale price"
              className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
            />
            <p className="text-[11px] text-gray-500 font-bold mt-1">Auction only sells if bidding reaches this. Leave blank for no reserve.</p>
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Condition</label>
            <select name="condition" defaultValue={listing.condition ?? ""}
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

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Size</label>
          {availableSizes.length === 1 && oneSize ? (
            <div className="w-full bg-ink/5 border-2 border-ink rounded-xl px-4 py-3 font-black text-sm">One Size</div>
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
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-ink text-white border-2 border-ink shadow-brut-lg py-4 rounded-2xl font-black uppercase hover:bg-acid hover:text-ink transition-colors"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
