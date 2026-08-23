"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

async function loginForRole(
  formData: FormData,
  allowedRoles: Array<"CUSTOMER" | "SELLER" | "ADMIN">,
  redirectTo: string,
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

  if (user.role === "SELLER" && user.sellerStatus !== "APPROVED") {
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
  return loginForRole(formData, ["SELLER"], "/seller");
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
