export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-ink border-t-acid" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Opening the racks...</p>
      </div>
    </div>
  );
}
