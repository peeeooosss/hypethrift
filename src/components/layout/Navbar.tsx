"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Marquee from "@/components/ui/Marquee";
import { UserIcon } from "@/components/ui/Icons";

interface NavbarProps {
  liveCount: number;
}

export default function Navbar({ liveCount }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 p-3 md:p-4 backdrop-blur-md bg-cream/80">
      <div className="max-w-7xl mx-auto bg-white border-2 border-ink rounded-full flex items-center justify-between p-1.5 pl-5 shadow-brut-md">
        <Link href="/" className="text-lg md:text-xl font-black uppercase tracking-tighter flex-shrink-0">HypeThrift</Link>

        <div className="hidden md:flex flex-1 overflow-hidden mx-4 h-10 items-center">
          <Marquee liveCount={liveCount} />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="hidden sm:flex items-center gap-1.5 bg-bubblegum px-3 py-1.5 rounded-full border-2 border-ink"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full live-dot"></div>
            <span className="text-[11px] font-black text-white tabular-nums">{liveCount} LIVE</span>
          </motion.div>
          {session?.user ? (
            <Link
              href="/account"
              aria-label="Account"
              className="bg-ink text-white p-2.5 rounded-full hover:bg-acid hover:text-ink transition-colors border-2 border-ink"
            >
              <UserIcon />
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Login"
              className="bg-ink text-white p-2.5 rounded-full hover:bg-acid hover:text-ink transition-colors border-2 border-ink"
            >
              <UserIcon />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
