"use client";

import { useActionState } from "react";
import { createCategory, deleteCategory } from "@/actions/admin-actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  color: string;
  textColor: string;
  createdAt: Date;
};

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createCategory, null);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase text-white">Categories</h1>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">New Category</h2>
        <form action={formAction} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input name="name" placeholder="Name" required className="border-2 border-ink rounded-xl px-3 py-2 font-bold text-sm" />
          <input name="emoji" placeholder="🎨 Emoji" required className="border-2 border-ink rounded-xl px-3 py-2 font-bold text-sm" />
          <input name="color" type="color" defaultValue="#121212" className="w-full h-10 border-2 border-ink rounded-xl cursor-pointer" />
          <input name="textColor" type="color" defaultValue="#D4FF33" className="w-full h-10 border-2 border-ink rounded-xl cursor-pointer" />
          <button className="col-span-2 bg-ink text-white border-2 border-ink px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-acid hover:text-ink transition-colors">
            Create
          </button>
        </form>
        {state?.error && (
          <p className="mt-3 text-red-500 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl py-2 px-3">{state.error}</p>
        )}
      </section>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">All ({categories.length})</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-dashed border-ink/20">
              <th className="pb-2 text-xs uppercase font-black text-gray-500">Name</th>
              <th className="pb-2 text-xs uppercase font-black text-gray-500">Slug</th>
              <th className="pb-2 text-xs uppercase font-black text-gray-500">Colors</th>
              <th className="pb-2 text-xs uppercase font-black text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-ink/10">
                <td className="py-3 font-black">{c.emoji} {c.name}</td>
                <td className="py-3 text-sm">{c.slug}</td>
                <td className="py-3">
                  <span className="inline-block w-4 h-4 rounded-full border border-ink mr-1" style={{ backgroundColor: c.color }} />
                  <span className="inline-block w-4 h-4 rounded-full border border-ink" style={{ backgroundColor: c.textColor }} />
                </td>
                <td className="py-3 text-right">
                  <form action={deleteCategory} className="inline">
                    <input type="hidden" name="categoryId" value={c.id} />
                    <button className="bg-bubblegum border-2 border-ink px-2 py-1 rounded text-xs font-black hover:bg-ink hover:text-white">✕</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
