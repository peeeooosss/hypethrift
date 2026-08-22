import { ZapIcon } from "@/components/ui/Icons";

interface MarqueeItem {
  label: string;
  className: string;
  zapFill?: string;
  zapStroke?: string;
}

const ITEMS: MarqueeItem[] = [
  { label: "BID NOW OR CRY LATER", className: "text-bubblegum", zapFill: "#FF66B2", zapStroke: "#FF66B2" },
  { label: "NEW DAILY", className: "text-white bg-ink px-2 rounded-full", zapStroke: "white" },
  { label: "AUTHENTICATED", className: "text-bubblegum", zapFill: "#FF66B2", zapStroke: "#FF66B2" },
  { label: "HYPE OR DIE", className: "text-aqua", zapFill: "#33CCFF", zapStroke: "#33CCFF" },
];

interface MarqueeProps {
  liveCount: number;
}

export default function Marquee({ liveCount }: MarqueeProps) {
  return (
    <div className="flex gap-8 whitespace-nowrap animate-marquee">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex gap-8">
          <span className="font-bold text-acid flex items-center gap-2">
            <ZapIcon fill="#D4FF33" stroke="#D4FF33" /> {liveCount} LIVE DROPS
          </span>
          {ITEMS.map((item) => (
            <span key={item.label} className={`font-bold flex items-center gap-2 ${item.className}`}>
              <ZapIcon fill={item.zapFill ?? "none"} stroke={item.zapStroke} />
              {item.label}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
