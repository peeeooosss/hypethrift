"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

async function loginForRole(
  formData: FormData,
  allowedRoles: Array<"CUSTOMER" | "SELLER" | "ADMIN">,
  redirectTo: string,
  allowPendingSeller = false,
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { role: true, sellerStatus: true, isBanned: true },
  });

  if (!user || user.isBanned || !allowedRoles.includes(user.role)) {
    return { error: "Invalid email, password, or login portal" };
  }

  if (user.role === "SELLER" && user.sellerStatus !== "APPROVED" && !allowPendingSeller) {
    return { error: "Your seller account is not approved yet" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }

  return null;
}

export async function loginAction(_prevState: { error?: string } | null, formData: FormData) {
  const email = formData.get("email")?.toString().toLowerCase();
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { role: true } })
    : null;
  return loginForRole(formData, ["CUSTOMER", "ADMIN"], user?.role === "ADMIN" ? "/admin" : "/account");
}

export async function sellerLoginAction(_prevState: { error?: string } | null, formData: FormData) {
  const email = formData.get("email")?.toString().toLowerCase();
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { sellerStatus: true } })
    : null;
  if (user?.sellerStatus === "REJECTED") {
    return { error: "Your seller application was rejected. Please check /seller/verification for details." };
  }
  return loginForRole(formData, ["SELLER"], user?.sellerStatus === "APPROVED" ? "/seller" : "/seller/verification", true);
}

export async function adminLoginAction(_prevState: { error?: string } | null, formData: FormData) {
  return loginForRole(formData, ["ADMIN"], "/admin");
}

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerAction(prevState: { error?: string } | null, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: "CUSTOMER",
    },
  });

  try {
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirectTo: "/account",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but login failed. Please sign in." };
    }
    throw error;
  }

  return null;
}

const sellerRegisterSchema = registerSchema.extend({
  storeName: z.string().min(2, "Store name is too short"),
  whatsappNumber: z.string().regex(/^[0-9+() -]{7,20}$/, "Enter a valid WhatsApp number"),
  location: z.string().optional(),
  storeDescription: z.string().optional(),
  returnPolicy: z.string().optional(),
  agreementAccepted: z.literal("on"),
});

export async function sellerRegisterAction(_prevState: { error?: string } | null, formData: FormData) {
  const parsed = sellerRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    storeName: formData.get("storeName"),
    whatsappNumber: formData.get("whatsappNumber"),
    location: formData.get("location")?.toString().trim() || undefined,
    storeDescription: formData.get("storeDescription")?.toString().trim() || undefined,
    returnPolicy: formData.get("returnPolicy")?.toString().trim() || undefined,
    agreementAccepted: formData.get("agreementAccepted"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid seller details" };

  const email = parsed.data.email.toLowerCase();
  const isReapply = formData.get("reapply") === "true";

  // Check if this is a rejected seller re-applying
  if (isReapply) {
    const session = await auth();
    if (session?.user?.role === "SELLER" && session.user.sellerStatus === "REJECTED") {
      // Update existing account instead of creating new one
      const hashed = await bcrypt.hash(parsed.data.password, 10);
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: parsed.data.name,
          email,
          password: hashed,
          sellerStatus: "PENDING",
          sellerNote: null,
        },
      });

      await prisma.sellerProfile.upsert({
        where: { userId: session.user.id },
        update: {
          storeName: parsed.data.storeName,
          storeDescription: parsed.data.storeDescription ?? null,
          location: parsed.data.location ?? null,
          whatsappNumber: parsed.data.whatsappNumber,
          returnPolicy: parsed.data.returnPolicy ?? null,
          acceptedAgreement: true,
          acceptedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          storeName: parsed.data.storeName,
          storeDescription: parsed.data.storeDescription ?? null,
          location: parsed.data.location ?? null,
          whatsappNumber: parsed.data.whatsappNumber,
          returnPolicy: parsed.data.returnPolicy ?? null,
          acceptedAgreement: true,
          acceptedAt: new Date(),
        },
      });

      revalidatePath("/admin/sellers");
      revalidatePath("/seller/verification");
      redirect("/seller/verification");
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists. Use a different email for a seller account." };

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  const seller = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      password: hashed,
      role: "SELLER",
      sellerStatus: "PENDING",
    },
  });

  await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      storeName: parsed.data.storeName,
      storeDescription: parsed.data.storeDescription ?? null,
      location: parsed.data.location ?? null,
      whatsappNumber: parsed.data.whatsappNumber,
      returnPolicy: parsed.data.returnPolicy ?? null,
      acceptedAgreement: true,
      acceptedAt: new Date(),
    },
  });
  revalidatePath("/admin/sellers");

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirectTo: "/seller/verification" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created. Please use Seller Login." };
    throw error;
  }

  return null;
}
