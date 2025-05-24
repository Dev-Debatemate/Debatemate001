import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CoinFlipProps {
  result: "affirmative" | "opposition";
  onComplete: () => void;
}

export default function CoinFlip({ result, onComplete }: CoinFlipProps) {
  const [isFlipping, setIsFlipping] = useState(true);
  
  useEffect(() => {
    // Animation lasts for 3 seconds
    const timer = setTimeout(() => {
      setIsFlipping(false);
      // Allow some time for the final state to be visible
      setTimeout(onComplete, 1000);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="relative w-24 h-24 mx-auto">
      <motion.div 
        className="coin w-full h-full"
        animate={{ 
          rotateY: isFlipping ? [0, 1800] : result === "affirmative" ? 1800 : 1980
        }}
        transition={{ 
          duration: 3,
          ease: [0.17, 0.67, 0.83, 0.67],
          times: [0, 1]
        }}
      >
        <div className="coin-front w-full h-full rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold font-heading text-yellow-800">A</span>
        </div>
        <div className="coin-back w-full h-full rounded-full bg-yellow-500 border-4 border-yellow-600 flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold font-heading text-yellow-800">O</span>
        </div>
      </motion.div>
    </div>
  );
}
