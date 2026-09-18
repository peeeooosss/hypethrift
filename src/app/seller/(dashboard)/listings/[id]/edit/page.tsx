import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import EditListingForm from "@/components/seller/EditListingForm";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/seller");

  const { id } = await params;
  const [listing, categories] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        title: true,
        description: true,
        categoryId: true,
        listingMode: true,
        startingBid: true,
        buyNowPrice: true,
        reservePrice: true,
        size: true,
        condition: true,
        images: true,
        status: true,
        durationHours: true,
        bidCount: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, where: { slug: { not: "all" } } }),
  ]);

  if (!listing || listing.sellerId !== session.user.id) notFound();

  const locked = listing.bidCount > 0 || !["DRAFT", "PENDING_REVIEW", "UPCOMING", "ACTIVE"].includes(listing.status);

  return (
    <div className="space-y-4">
      <Link href="/seller/listings" className="text-sm font-black underline">← Back to Listings</Link>
      {locked ? (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8 text-center max-w-4xl mx-auto">
          <p className="font-black uppercase mb-2">This listing is locked</p>
          <p className="text-sm font-bold text-gray-500">
            {listing.bidCount > 0
              ? "Bids have already been placed — details can no longer be changed."
              : `Listings in status ${listing.status} cannot be edited.`}
          </p>
        </div>
      ) : (
        <EditListingForm
          listing={{
            id: listing.id,
            title: listing.title,
            description: listing.description,
            categoryId: listing.categoryId,
            listingMode: listing.listingMode,
            startingBid: listing.startingBid,
            buyNowPrice: listing.buyNowPrice,
            reservePrice: listing.reservePrice,
            size: listing.size,
            condition: listing.condition,
            images: listing.images,
            status: listing.status,
            durationHours: listing.durationHours,
          }}
          categories={categories}
        />
      )}
    </div>
  );
}
