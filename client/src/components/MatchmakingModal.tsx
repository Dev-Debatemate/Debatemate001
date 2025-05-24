import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import socketClient from "@/lib/socket";
import { useLocation } from "wouter";

interface User {
  id: number;
  username: string;
  displayName: string;
  avatarId?: number;
  level: number;
}

interface MatchmakingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

enum Step {
  FINDING_MATE,
  MATE_FOUND,
  DEBATE_SETUP
}

export default function MatchmakingModal({ open, onOpenChange }: MatchmakingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(Step.FINDING_MATE);
  const [mate, setMate] = useState<User | null>(null);
  const [debateId, setDebateId] = useState<number | null>(null);
  const [isAffirmative, setIsAffirmative] = useState<boolean | null>(null);
  const [topic, setTopic] = useState<{ title: string; difficulty: number } | null>(null);
  const [isCoinFlipping, setIsCoinFlipping] = useState(false);
  
  // Join matchmaking when modal opens
  useEffect(() => {
    if (open && user && step === Step.FINDING_MATE) {
      socketClient.connect();
      socketClient.joinMatchmaking(user.id);
    }
    
    return () => {
      if (user) {
        socketClient.leaveMatchmaking(user.id);
      }
    };
  }, [open, user, step]);
  
  // Handle matchmaking events
  useEffect(() => {
    if (!user) return;
    
    const handleMatchFound = (data: any) => {
      // Set mate info
      socketClient.leaveMatchmaking(user.id);
      
      setDebateId(data.debateId);
      setIsAffirmative(data.isAffirmative);
      setTopic(data.topic);
      
      // Fetch mate
      fetch(`/api/users/${data.opponentId}`)
        .then(res => res.json())
        .then(mateData => {
          setMate(mateData);
          setStep(Step.MATE_FOUND);
          
          // Start coin flipping animation
          setIsCoinFlipping(true);
          setTimeout(() => {
            setIsCoinFlipping(false);
            setStep(Step.DEBATE_SETUP);
          }, 3000);
        })
        .catch(err => {
          console.error("Failed to fetch mate:", err);
        });
    };
    
    socketClient.on("matchFound", handleMatchFound);
    
    return () => {
      socketClient.off("matchFound", handleMatchFound);
    };
  }, [user]);
  
  // Handle starting the debate
  const [, navigate] = useLocation();
  
  const handleStartDebate = () => {
    if (debateId) {
      console.log(`Navigating to debate with ID: ${debateId}`);
      // First close the modal to avoid UI issues
      onOpenChange(false);
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        navigate(`/debate/${debateId}`);
      }, 100);
    } else {
      onOpenChange(false);
    }
  };
  
  // Handle declining debate
  const handleDecline = () => {
    if (user) {
      socketClient.leaveMatchmaking(user.id);
    }
    
    // Reset state for next time
    setStep(Step.FINDING_MATE);
    setMate(null);
    setDebateId(null);
    setIsAffirmative(null);
    setTopic(null);
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-none p-0 overflow-hidden">
        <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
          <X className="h-4 w-4" onClick={handleDecline} />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <AnimatePresence mode="wait">
          {step === Step.FINDING_MATE && (
            <motion.div
              key="finding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-6"
            >
              <DialogTitle className="text-2xl font-bold text-foreground mb-4">
                Finding a Mate
              </DialogTitle>
              
              <div className="mx-auto w-32 h-32 mb-6 relative">
                <div className="absolute inset-0 bg-muted dark:bg-muted/30 rounded-full animate-pulse"></div>
                <UserAvatar 
                  user={user} 
                  size="lg"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-primary w-20 h-20"
                />
              </div>
              
              <DialogDescription className="text-center text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">
                Searching for a Mate...
              </DialogDescription>
            </motion.div>
          )}
          
          {step === Step.MATE_FOUND && (
            <motion.div
              key="mate-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <DialogTitle className="text-2xl font-bold text-foreground mb-2 pt-6 px-6">
                Mate Found!
              </DialogTitle>
              
              <DialogDescription className="px-6">
                You've been matched with
              </DialogDescription>
              
              <p className="text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70 text-sm mt-2 px-6">
                Now flipping a coin to determine positions...
              </p>
              
              <div className="mt-8 relative">
                <div className="flex justify-center items-center px-10 mb-6">
                  <div className="text-center mr-12">
                    <div className="bg-muted dark:bg-muted/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-foreground font-bold">{user?.username ? user.username.charAt(0).toUpperCase() : "?"}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{user?.username}</p>
                    <p className="text-xs text-foreground text-opacity-60 dark:text-foreground dark:text-opacity-60">Win rate: 0%</p>
                  </div>
                  
                  <div className="text-lg font-bold text-foreground text-opacity-50 dark:text-foreground dark:text-opacity-50 mr-12">VS</div>
                  
                  <div className="text-center">
                    <div className="bg-muted dark:bg-muted/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-foreground font-bold">{mate?.username ? mate.username.charAt(0).toUpperCase() : "?"}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{mate?.username}</p>
                    <p className="text-xs text-foreground text-opacity-60 dark:text-foreground dark:text-opacity-60">Win rate: 0%</p>
                  </div>
                </div>
                
                {/* Coin Animation */}
                <div className="w-20 h-20 bg-primary mx-auto rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  <motion.div
                    animate={{ 
                      rotateX: isCoinFlipping ? [0, 1080] : 0,
                      scale: isCoinFlipping ? [1, 0.8, 1] : 1
                    }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="w-full h-full rounded-full flex items-center justify-center"
                  >
                    AFF
                  </motion.div>
                </div>
                
                <div className="mt-8 text-center px-6">
                  <h3 className="font-bold mb-1 text-foreground">Results</h3>
                  <p className="text-sm text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-2">
                    You will argue the <span className="text-primary font-medium">affirmative</span> position
                  </p>
                  
                  <div className="mt-4 mb-4">
                    <p className="text-sm text-foreground text-opacity-60 dark:text-foreground dark:text-opacity-60 mb-2">Today's topic:</p>
                    <p className="font-medium text-foreground text-center mx-auto max-w-xs">
                      {topic?.title || "Should social media platforms be held responsible for user content?"}
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mt-6 pb-6">
                    <Button
                      onClick={handleDecline}
                      variant="outline"
                      className="px-6 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                    >
                      Decline
                    </Button>
                    
                    <Button
                      onClick={handleStartDebate}
                      className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {step === Step.DEBATE_SETUP && (
            <motion.div
              key="debate-setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <DialogTitle className="text-2xl font-bold text-foreground mb-2 pt-6 px-6">
                Mate Found!
              </DialogTitle>
              
              <DialogDescription className="px-6">
                You've been matched with
              </DialogDescription>
              
              <p className="text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70 text-sm mt-2 px-6">
                Now flipping a coin to determine positions...
              </p>
              
              <div className="mt-8 relative">
                <div className="flex justify-center items-center px-10 mb-6">
                  <div className="text-center mr-12">
                    <div className="bg-muted dark:bg-muted/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-foreground font-bold">{user?.username ? user.username.charAt(0).toUpperCase() : "?"}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{user?.username}</p>
                    <p className="text-xs text-foreground text-opacity-60 dark:text-foreground dark:text-opacity-60">Win rate: 0%</p>
                  </div>
                  
                  <div className="text-lg font-bold text-foreground text-opacity-50 dark:text-foreground dark:text-opacity-50 mr-12">VS</div>
                  
                  <div className="text-center">
                    <div className="bg-muted dark:bg-muted/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-foreground font-bold">R</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{mate?.username}</p>
                    <p className="text-xs text-foreground text-opacity-60 dark:text-foreground dark:text-opacity-60">Win rate: 0%</p>
                  </div>
                </div>
                
                {/* Coin Result */}
                <div className="w-20 h-20 bg-primary mx-auto rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  {isAffirmative ? "AFF" : "OPP"}
                </div>
                
                <div className="mt-8 text-center px-6">
                  <h3 className="font-bold mb-1 text-foreground">Results</h3>
                  <p className="text-sm text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-2">
                    You will argue the <span className="text-primary font-medium">
                      {isAffirmative ? "affirmative" : "opposition"}
                    </span> position
                  </p>
                  
                  <div className="mt-4 mb-4">
                    <p className="text-sm text-foreground text-opacity-60 dark:text-foreground dark:text-opacity-60 mb-2">Today's topic:</p>
                    <p className="font-medium text-foreground text-center mx-auto max-w-xs">
                      {topic?.title || "Should social media platforms be held responsible for user content?"}
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mt-6 pb-6">
                    <Button
                      onClick={handleDecline}
                      variant="outline"
                      className="px-6 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                    >
                      Decline
                    </Button>
                    
                    <Button
                      onClick={handleStartDebate}
                      className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
