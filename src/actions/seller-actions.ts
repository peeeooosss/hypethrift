"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function applyAsSeller(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const note = formData.get("note")?.toString();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { sellerStatus: "PENDING", sellerNote: note ?? null },
  });

  revalidatePath("/apply-seller");
}
