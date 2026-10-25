"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ArrowLeft, Crosshair, Map, ShoppingBag, Sparkles, Store } from "lucide-react";
import { MALL_ZONES } from "@/lib/mall/zones";
import { useMallControls } from "@/lib/mall/controls";
import type { MallShowcase } from "@/lib/mall/showcase";

const MallSceneLazy = dynamic(() => import("./scene/MallScene").then((mod) => mod.MallScene), {
  ssr: false,
  loading: () => null,
});

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function MallExperience({ showcase }: { showcase: MallShowcase }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [entered, setEntered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [hudOpen, setHudOpen] = useState(true);

  useEffect(() => {
    setSupported(supportsWebGL());
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMobile(window.matchMedia("(max-width: 767px)").matches);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  if (supported === null) {
    return <MallLoading label="Checking the mall lights..." />;
  }

  if (!supported) {
    return <MallUnsupported />;
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-mall-night">
      <Canvas
        camera={{ position: [0, 1.65, 32], fov: 72, near: 0.1, far: 140 }}
        dpr={mobile ? [1, 1.2] : [1, 1.75]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0B0B0F");
        }}
      >
        <Suspense fallback={null}>
          <MallSceneLazy showcase={showcase} active={entered} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
        <header className="pointer-events-auto flex items-center gap-2 border-b-2 border-white/15 bg-mall-night/70 p-3 backdrop-blur-md sm:gap-3 sm:p-4">
          <Link href="/" className="rounded-full border-2 border-white/20 px-3 py-2 font-display text-sm uppercase tracking-tighter text-white sm:text-lg">
            Hype<span className="text-bubblegum">Thrift</span>
          </Link>
          <span className="hidden rounded-full border border-acid/40 bg-acid/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-acid sm:inline-flex">
            Walk mode
          </span>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link href="/mall" className="flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 text-[10px] font-black uppercase text-white transition-colors hover:bg-white hover:text-ink">
              <Map className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Directory</span>
            </Link>
            <Link href="/listings" className="hidden items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 text-[10px] font-black uppercase text-white transition-colors hover:bg-white hover:text-ink sm:flex">
              <Store className="h-3.5 w-3.5" /> Shop
            </Link>
            <Link href="/cart" aria-label="Bag" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white hover:bg-white hover:text-ink">
              <ShoppingBag className="h-4 w-4" />
            </Link>
            <Link href="/bid-arena" className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-acid px-3 py-2 text-[10px] font-black uppercase text-ink shadow-brut-white">
              <Sparkles className="h-3.5 w-3.5" /> Arena
            </Link>
          </div>
        </header>

        <div className="relative flex flex-1 flex-col">
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-mall-night/60 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/55 backdrop-blur">
              <Crosshair className="h-3 w-3 text-acid" /> Drag to look · WASD to move
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-4 left-4 hidden w-44 rounded-2xl border-2 border-white/20 bg-mall-night/70 p-3 text-white backdrop-blur md:block">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Mall map</p>
            <MallMap />
            <div className="mt-2 flex items-center justify-between text-[8px] font-black uppercase text-white/35">
              <span>You are here</span>
              <span className="text-acid">Spawn</span>
            </div>
          </div>

          {mobile && <MobilePad />}

          <div className="pointer-events-auto absolute bottom-4 right-4 hidden text-right md:block">
            {hudOpen && (
              <>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Tip</p>
                <p className="mt-1 max-w-[190px] text-[10px] font-bold leading-relaxed text-white/55">
                  Walk up to a storefront and click any product card to open it.
                </p>
              </>
            )}
            <Link href="/mall" className="mt-2 inline-block text-[10px] font-black uppercase text-acid underline">
              Use the 2D directory instead
            </Link>
          </div>

          {!entered && (
            <div className="absolute inset-0 flex items-center justify-center bg-mall-night/65 p-4 backdrop-blur-[3px]">
              <div className="w-full max-w-xl rounded-[2rem] border-2 border-white bg-cream p-6 text-ink shadow-[10px_10px_0_#D4FF33] md:p-9">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border-2 border-ink bg-acid px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em]">
                    HypeThrift mall · 3D beta
                  </span>
                  <span className="text-3xl">✦</span>
                </div>
                <h1 className="mt-5 font-display text-5xl uppercase leading-[0.86] md:text-6xl">
                  Walk in.<br />Find your<br /><span className="text-bubblegum">next flex.</span>
                </h1>
                <p className="mt-4 text-sm font-bold leading-relaxed text-ink/55">
                  Eight zones. Four finds per storefront. The Bid Arena straight ahead. No algorithms, just racks.
                </p>
                <button
                  onClick={() => setEntered(true)}
                  className="mt-6 w-full rounded-full border-2 border-ink bg-ink px-6 py-4 text-sm font-black uppercase text-white shadow-brut-md transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-acid hover:text-ink hover:shadow-brut-sm"
                >
                  Enter the mall ↗
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href="/mall" className="rounded-full border-2 border-ink bg-white px-4 py-3 text-center text-[10px] font-black uppercase">
                    Browse directory
                  </Link>
                  <Link href="/bid-arena" className="rounded-full border-2 border-ink bg-bubblegum px-4 py-3 text-center text-[10px] font-black uppercase">
                    Skip to arena
                  </Link>
                </div>
                <p className="mt-4 text-center text-[9px] font-bold uppercase leading-relaxed tracking-wider text-ink/35">
                  Desktop: drag to look, WASD to walk, shift to stride. Mobile: use the pad.
                </p>
              </div>
            </div>
          )}

          {entered && (
            <button
              onClick={() => setEntered(false)}
              className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/20 bg-mall-night/70 px-3 py-1.5 text-[9px] font-black uppercase text-white/60 backdrop-blur md:hidden"
            >
              <ArrowLeft className="mr-1 inline h-3 w-3" /> Pause
            </button>
          )}

          <button
            onClick={() => setHudOpen((value) => !value)}
            className="pointer-events-auto absolute right-4 top-2 hidden rounded-full border border-white/20 bg-mall-night/70 px-2 py-1 text-[8px] font-black uppercase text-white/40 backdrop-blur lg:block"
          >
            {hudOpen ? "Hide tips" : "Show tips"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MallMap() {
  return (
    <div className="relative mt-2 aspect-[3/4] overflow-hidden rounded-lg border border-white/15 bg-white/5">
      <div className="absolute inset-x-4 bottom-2 rounded border border-acid/50 bg-acid/15 py-1 text-center text-[7px] font-black uppercase text-acid">
        Arena
      </div>
      {MALL_ZONES.map((zone, index) => {
        const row = Math.floor(index / 2);
        const side = index % 2;
        return (
          <div
            key={zone.slug}
            className="absolute h-[13%] w-[34%] rounded-sm border border-white/25"
            style={{
              backgroundColor: `${zone.color}55`,
              left: side === 0 ? "6%" : "60%",
              top: `${8 + row * 19}%`,
            }}
            title={zone.shortName}
          />
        );
      })}
      <div className="absolute bottom-8 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-acid shadow-[0_0_8px_#D4FF33]" />
    </div>
  );
}

function MobilePad() {
  const setMove = useMallControls((state) => state.setMove);
  const reset = useMallControls((state) => state.reset);

  const bind = (x: number, z: number) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault();
      setMove(x, z);
    },
    onPointerUp: reset,
    onPointerLeave: reset,
    onPointerCancel: reset,
  });

  return (
    <div className="pointer-events-auto absolute bottom-5 left-4 grid grid-cols-3 gap-1.5">
      <span />
      <button {...bind(0, -1)} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/30 bg-mall-night/75 text-lg text-white backdrop-blur">↑</button>
      <span />
      <button {...bind(-1, 0)} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/30 bg-mall-night/75 text-lg text-white backdrop-blur">←</button>
      <button {...bind(0, 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/30 bg-mall-night/75 text-lg text-white backdrop-blur">↓</button>
      <button {...bind(1, 0)} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/30 bg-mall-night/75 text-lg text-white backdrop-blur">→</button>
    </div>
  );
}

function MallLoading({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-mall-night text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-acid border-t-transparent" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{label}</p>
      </div>
    </div>
  );
}

function MallUnsupported() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-mall-night p-4 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border-2 border-white bg-mall-wall p-7 text-center">
        <p className="text-5xl">🛍️</p>
        <h1 className="mt-4 font-display text-4xl uppercase text-acid">The 3D mall needs WebGL</h1>
        <p className="mt-3 text-sm font-bold leading-relaxed text-white/55">
          Your browser or device cannot render the walkable mall right now. The full directory and every storefront still work in 2D.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/mall" className="rounded-full border-2 border-white bg-acid px-5 py-3 text-xs font-black uppercase text-ink">
            Open mall directory
          </Link>
          <Link href="/listings" className="rounded-full border-2 border-white px-5 py-3 text-xs font-black uppercase text-white">
            Shop all listings
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {MALL_ZONES.map((zone) => (
            <Link key={zone.slug} href={`/mall/${zone.slug}`} className="rounded-full border border-white/20 px-3 py-1.5 text-[9px] font-black uppercase text-white/60">
              {zone.emoji} {zone.shortName}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
