import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
      <h1 className="text-2xl font-black uppercase mb-4">Categories</h1>
      <ul className="divide-y-2 divide-dashed divide-ink/20">
        {categories.map((c) => (
          <li key={c.id} className="py-3 flex justify-between items-center">
            <span className="font-black">{c.emoji} {c.name}</span>
            <span className="text-xs font-bold uppercase text-gray-500">{c.slug}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
