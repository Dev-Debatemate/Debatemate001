import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Send, CheckCircle } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

interface Argument {
  id: number;
  userId: number;
  round: number;
  side: string;
  content: string;
  submittedAt: Date;
}

interface User {
  id: number;
  username: string;
  displayName: string;
  avatarId?: number;
}

interface DebateInterfaceProps {
  debateId: number;
  topic: string;
  currentRound: number;
  maxRounds: number;
  affirmativeUser: User;
  oppositionUser: User;
  currentUserId: number;
  isYourTurn: boolean;
  remainingTime: number | null;
  arguments: Argument[];
  onSubmitArgument: (content: string) => void;
  isSubmitting: boolean;
  status?: string;
  isCompleted?: boolean;
}

export default function DebateInterface({
  debateId,
  topic,
  currentRound,
  maxRounds,
  affirmativeUser,
  oppositionUser,
  currentUserId,
  isYourTurn,
  remainingTime,
  arguments: debateArguments,
  onSubmitArgument,
  isSubmitting,
  status,
  isCompleted
}: DebateInterfaceProps) {
  const [argument, setArgument] = useState("");
  const MIN_WORD_COUNT = 60;
  
  // Calculate current word count
  const wordCount = argument.trim() ? argument.trim().split(/\s+/).length : 0;
  const isWordCountMet = wordCount >= MIN_WORD_COUNT;
  
  // Format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Group arguments by round
  const argumentsByRound = debateArguments.reduce((acc, arg) => {
    if (!acc[arg.round]) {
      acc[arg.round] = { affirmative: null, opposition: null };
    }
    
    if (arg.side === "affirmative") {
      acc[arg.round].affirmative = arg;
    } else {
      acc[arg.round].opposition = arg;
    }
    
    return acc;
  }, {} as Record<number, { affirmative: Argument | null, opposition: Argument | null }>);
  
  // Round labels
  const roundLabels = {
    1: "Opening Statements",
    2: "Rebuttals",
    3: "Final Arguments"
  };
  
  // Submit handler
  const handleSubmit = () => {
    // Only submit if the minimum word count is met
    if (argument.trim().length > 0 && isWordCountMet) {
      onSubmitArgument(argument);
      setArgument("");
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Topic */}
      <Card className="bg-primary/10 border-l-4 border-primary p-4">
        <h2 className="text-lg font-heading font-bold text-foreground dark:text-white">{topic}</h2>
        <div className="mt-2 flex justify-between text-sm">
          <span className="px-2 py-0.5 rounded-full bg-primary text-white font-bold">
            Round {currentRound} of {maxRounds}
          </span>
          <span>{roundLabels[currentRound as keyof typeof roundLabels] || `Round ${currentRound}`}</span>
        </div>
      </Card>
      
      {/* Past Arguments by Round */}
      <div className="space-y-6">
        {Object.entries(argumentsByRound).map(([round, args]) => (
          <div key={round} className="debate-round space-y-4">
            <h3 className="font-heading font-medium text-foreground">
              {roundLabels[parseInt(round) as keyof typeof roundLabels] || `Round ${round}`}
            </h3>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Affirmative Argument */}
              {args.affirmative && (
                <Card className={cn(
                  "border-l-4 p-4",
                  args.affirmative.userId === currentUserId 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-300"
                )}>
                  <div className="flex items-center mb-2">
                    <UserAvatar user={affirmativeUser} size="sm" />
                    <div className="ml-2">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">
                          {affirmativeUser.id === currentUserId ? "You" : affirmativeUser.displayName}
                        </span>
                        <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                          Affirmative
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-foreground whitespace-pre-line">
                    {args.affirmative.content}
                  </div>
                </Card>
              )}
              
              {/* Opposition Argument */}
              {args.opposition && (
                <Card className={cn(
                  "border-l-4 p-4",
                  args.opposition.userId === currentUserId 
                    ? "border-accent bg-accent/5" 
                    : "border-gray-300"
                )}>
                  <div className="flex items-center mb-2">
                    <UserAvatar user={oppositionUser} size="sm" />
                    <div className="ml-2">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">
                          {oppositionUser.id === currentUserId ? "You" : oppositionUser.displayName}
                        </span>
                        <span className="ml-2 text-xs bg-accent text-white px-2 py-0.5 rounded-full">
                          Opposition
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-foreground whitespace-pre-line">
                    {args.opposition.content}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Current turn input */}
      {isYourTurn && (
        <Card className="border-2 border-dashed border-primary/50 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-heading font-medium text-primary">Your Turn</h3>
            {remainingTime !== null && (
              <div className={cn(
                "flex items-center text-sm font-medium",
                remainingTime < 60 ? "text-red-500" : "text-gray-600"
              )}>
                <Clock size={16} className="mr-1" />
                {formatTime(remainingTime)}
              </div>
            )}
          </div>
          
          <Textarea
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            placeholder="Enter your argument here (minimum 60 words)..."
            className="min-h-[150px] mb-3"
            disabled={isSubmitting}
          />
          
          <div className="flex justify-between items-center">
            <div className={`text-sm ${isWordCountMet ? 'text-green-600' : 'text-amber-600'}`}>
              Word count: {wordCount} {isWordCountMet ? '✓' : ''} <span className="text-gray-500">(minimum {MIN_WORD_COUNT})</span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!isWordCountMet || isSubmitting}
            >
              <Send size={16} className="mr-2" />
              Submit Argument
            </Button>
          </div>
        </Card>
      )}
      
      {/* Waiting for other player */}
      {!isYourTurn && currentRound <= maxRounds && debateArguments.length > 0 && debateArguments.length < (maxRounds * 2) && (
        <Card className="bg-background border p-4 text-center">
          <div className="animate-pulse">
            <h3 className="font-heading font-medium text-foreground mb-2">
              Waiting for {currentRound % 2 === 1 
                ? (affirmativeUser.id === currentUserId ? oppositionUser.displayName : affirmativeUser.displayName)
                : (oppositionUser.id === currentUserId ? affirmativeUser.displayName : oppositionUser.displayName)
              } to respond...
            </h3>
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </Card>
      )}
      
      {/* Debate completed message */}
      {(debateArguments.length >= (maxRounds * 2) || isCompleted) && (
        <Card className="bg-primary/10 p-4 text-center border border-primary/20 mt-14">
          <div className="flex flex-col items-center">
            <CheckCircle className="h-10 w-10 text-primary mb-2" />
            <h3 className="font-heading font-medium text-foreground mb-2">
              This debate has been completed
            </h3>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">
              All arguments have been submitted. Check the Results tab to see the outcome.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
