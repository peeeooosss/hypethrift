"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

interface AuthFormProps {
  mode: "login" | "register";
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | null>;
  portal?: "customer" | "seller" | "admin";
}

function SubmitButton({ mode }: { mode: "login" | "register" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ink text-white font-black uppercase text-lg py-4 rounded-2xl border-2 border-ink shadow-brut-lg hover:bg-acid hover:text-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
    </button>
  );
}

export default function AuthForm({ mode, action, portal = "customer" }: AuthFormProps) {
  const [state, formAction] = useActionState(action, null);
  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black uppercase tracking-tighter">
            HypeThrift
          </Link>
          <h1 className="text-2xl font-black uppercase mt-4">
            {portal === "seller" ? "Seller Login" : portal === "admin" ? "Admin Login" : isLogin ? "Welcome Back" : "Join the Drop"}
          </h1>
          <p className="text-sm text-gray-500 font-bold mt-1">
            {portal === "seller"
              ? "Sign in to manage your thrift store"
              : portal === "admin"
              ? "Sign in to manage HypeThrift"
              : isLogin
              ? "Sign in to your account"
              : "Create your customer account"}
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm transition-shadow"
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm transition-shadow"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm transition-shadow"
              placeholder={isLogin ? "••••••••" : "At least 6 characters"}
            />
          </div>

          {state?.error && (
            <p className="text-red-500 text-sm font-bold text-center bg-red-50 border-2 border-red-200 rounded-xl py-2">
              {state.error}
            </p>
          )}

          <SubmitButton mode={mode} />
        </form>

        <p className="text-center text-sm font-bold text-gray-500 mt-6">
          {isLogin ? (
            <>
              New here?{" "}
              <Link href={portal === "seller" ? "/seller/register" : "/register"} className="text-ink underline decoration-acid decoration-2">
                {portal === "seller" ? "Create seller account" : "Create account"}
              </Link>
            </>
          ) : (
            <>
              Already a member?{" "}
              <Link href={portal === "seller" ? "/seller/login" : "/login"} className="text-ink underline decoration-acid decoration-2">
                {portal === "seller" ? "Seller sign in" : "Sign in"}
              </Link>
            </>
          )}
        </p>

        {isLogin && portal === "customer" && (
          <div className="flex justify-center gap-4 mt-4 text-xs font-black uppercase">
            <Link href="/seller/login" className="underline decoration-bubblegum decoration-2">
              Seller Login
            </Link>
          </div>
        )}

        {isLogin && portal !== "customer" && (
          <p className="text-center text-xs font-black uppercase mt-4">
            <Link href="/login" className="underline decoration-acid decoration-2">
              Customer Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
