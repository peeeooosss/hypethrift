import { prisma } from "@/lib/prisma";
import NewListingForm from "@/components/seller/NewListingForm";

export default async function NewListingPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return <NewListingForm categories={categories} />;
}
