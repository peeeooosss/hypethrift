"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  deadline: string | Date | null | undefined;
  onExpire?: () => void;
  showLabel?: boolean;
  compact?: boolean;
}

export default function CountdownTimer({
  deadline,
  onExpire,
  showLabel = true,
  compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!deadline) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
      return;
    }

    const calculateTimeLeft = () => {
      const deadlineTime = new Date(deadline).getTime();
      const now = Date.now();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, expired: false };
    };

    const updateTimer = () => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);

      if (newTime.expired && !timeLeft.expired) {
        onExpire?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire, timeLeft.expired]);

  if (timeLeft.expired) {
    return (
      <span className="text-xs font-black uppercase bg-red-500 text-white px-2 py-1 rounded-full border-2 border-red-500">
        EXPIRED
      </span>
    );
  }

  const { hours, minutes, seconds } = timeLeft;

  if (compact) {
    return (
      <span className="font-black text-bubblegum bg-bubblegum/10 border-2 border-bubblegum px-2 py-1 rounded-full text-xs uppercase">
        {showLabel ? "⏰ " : ""}
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-xs uppercase font-bold text-gray-500 tracking-widest">Time Left</span>
      )}
      <div className="flex items-center gap-1 bg-bubblegum/10 border-2 border-bubblegum px-3 py-1.5 rounded-xl">
        <span className="text-xs font-black tabular-nums text-bubblegum">
          {String(hours).padStart(2, "0")}
        </span>
        <span className="text-xs font-black text-bubblegum">:</span>
        <span className="text-xs font-black tabular-nums text-bubblegum">
          {String(minutes).padStart(2, "0")}
        </span>
        <span className="text-xs font-black text-bubblegum">:</span>
        <span className="text-xs font-black tabular-nums text-bubblegum">
          {String(seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}