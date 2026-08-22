/** Formats seconds into a compact human label, e.g. `1h 05m`, `04m 32s`, `59s`. */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** Formats seconds into a full HH:MM:SS clock, e.g. `01:45:09`. */
export function formatTimeFull(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Formats an INR amount with grouping, e.g. `12,800`. */
export function formatBid(amount: number): string {
  return amount.toLocaleString();
}
