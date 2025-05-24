import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  username: string;
  displayName: string;
  avatarId?: number;
}

interface UserAvatarProps {
  user: User | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

// Define a set of avatar URLs
const avatarUrls = [
  "https://images.unsplash.com/photo-1568602471122-7832951cc4c5",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61"
];

export default function UserAvatar({ user, className, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  };

  // Get initials from username (first letter) - with multiple fallbacks
  const initials = user && user.username && user.username.trim().length > 0
    ? user.username.charAt(0).toUpperCase()
    : user && user.displayName && user.displayName.trim().length > 0
      ? user.displayName.charAt(0).toUpperCase()
      : "?"; // Default fallback if no valid username or displayName

  // We'll always use the user's first letter of username now, but keeping the API  
  // structure the same for future customization
  const avatarUrl = "";

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="bg-primary text-white font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
