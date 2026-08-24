import { Heart, Zap, User, ArrowRight, BadgeCheck, Eye, TrendingUp, Share2, Star, Search, Filter } from "lucide-react";

export interface IconProps {
  size?: number;
  className?: string;
}

interface HeartIconProps extends IconProps {
  filled?: boolean;
}

export function ZapIcon({ size = 16, fill = "none", stroke = "currentColor", className }: IconProps & { fill?: string; stroke?: string }) {
  return <Zap size={size} fill={fill} stroke={stroke} strokeWidth={2.5} className={className} />;
}

export function UserIcon({ size = 20, className }: IconProps) {
  return <User size={size} strokeWidth={2.5} className={className} />;
}

export function ArrowRightIcon({ size = 24, className }: IconProps) {
  return <ArrowRight size={size} strokeWidth={3} className={className} />;
}

export function BadgeCheckIcon({ size = 20, className }: IconProps) {
  return <BadgeCheck size={size} strokeWidth={2.5} className={className} />;
}

export function EyeIcon({ size = 14, className }: IconProps) {
  return <Eye size={size} strokeWidth={2.5} className={className} />;
}

export function HeartIcon({ size = 24, filled = false, className }: HeartIconProps) {
  return <Heart size={size} fill={filled ? "#FF66B2" : "none"} strokeWidth={2.5} className={className} />;
}

export function TrendingUpIcon({ size = 14, className }: IconProps) {
  return <TrendingUp size={size} strokeWidth={2.5} className={className} />;
}

export function ShareIcon({ size = 16, className }: IconProps) {
  return <Share2 size={size} strokeWidth={2.5} className={className} />;
}

export function StarIcon({ size = 16, className }: IconProps) {
  return <Star size={size} strokeWidth={2.5} className={className} />;
}

export function SearchIcon({ size = 18, className }: IconProps) {
  return <Search size={size} strokeWidth={2.5} className={className} />;
}

export function FilterIcon({ size = 20, className }: IconProps) {
  return <Filter size={size} strokeWidth={2.5} className={className} />;
}
