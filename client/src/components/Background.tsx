import { cn } from "@/lib/utils";

interface BackgroundProps {
  index: number;
  className?: string;
  overlay?: boolean;
  children?: React.ReactNode;
}

// Define background images
const backgrounds = [
  "https://images.unsplash.com/photo-1580375480914-7bdc9964b508?auto=format&fit=crop", // Debate hall
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop", // Modern auditorium
  "https://images.unsplash.com/photo-1577801622187-9a1076d049da?auto=format&fit=crop", // Library setting
  "https://images.unsplash.com/photo-1515168833906-d2a3b82b302a?auto=format&fit=crop"  // Tech conference
];

export default function Background({ 
  index = 1, 
  className, 
  overlay = true,
  children 
}: BackgroundProps) {
  // Make sure index is valid
  const safeIndex = ((index - 1) % backgrounds.length + backgrounds.length) % backgrounds.length;
  const bgImage = backgrounds[safeIndex];
  
  return (
    <div 
      className={cn(
        "relative bg-primary/70 h-32 overflow-hidden",
        className
      )}
    >
      <div 
        style={{ backgroundImage: `url('${bgImage}')` }}
        className="absolute inset-0 bg-cover bg-center"
      />
      
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 to-primary/90" />
      )}
      
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
