import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { socketClient } from "@/lib/socket";

interface DebateResultPopupProps {
  userId: number;
}

interface DebateResultData {
  debateId: number;
  winnerId: number;
  feedback: string;
  reasoning: string;
  score: {
    affirmative: number;
    opposition: number;
  };
}

export default function DebateResultPopup({ userId }: DebateResultPopupProps) {
  const [, navigate] = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [debateResult, setDebateResult] = useState<DebateResultData | null>(null);
  
  useEffect(() => {
    // Listen for debate completion event
    const handleDebateComplete = (data: DebateResultData) => {
      setDebateResult(data);
      setShowPopup(true);
    };
    
    socketClient.on("debateComplete", handleDebateComplete);
    
    return () => {
      socketClient.off("debateComplete", handleDebateComplete);
    };
  }, [userId]);
  
  if (!showPopup || !debateResult) return null;
  
  const isWinner = debateResult.winnerId === userId;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-card rounded-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="text-center p-6">
          <h2 className="text-3xl font-bold mb-2">
            {isWinner ? "You WON!" : "You LOST!"}
          </h2>
          
          <p className="text-gray-600 mb-8">
            {isWinner 
              ? "Congratulations! Your arguments prevailed." 
              : "Better luck next time. Your opponent had stronger arguments."}
          </p>
          
          <div className="mb-8">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-2">Feedback from the judge:</h3>
              <p className="text-gray-700">{debateResult.feedback}</p>
            </div>
            
            <div className="flex justify-between items-center px-8 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold">{debateResult.score.affirmative}</div>
                <div className="text-xs text-gray-500">Affirmative</div>
              </div>
              
              <div className="text-gray-400 font-bold">VS</div>
              
              <div className="text-center">
                <div className="text-xl font-bold">{debateResult.score.opposition}</div>
                <div className="text-xs text-gray-500">Opposition</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setShowPopup(false);
                navigate(`/debate/${debateResult.debateId}`);
              }}
              variant="outline"
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              View Debate
            </Button>
            <Button
              onClick={() => {
                setShowPopup(false);
                navigate("/dashboard");
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}