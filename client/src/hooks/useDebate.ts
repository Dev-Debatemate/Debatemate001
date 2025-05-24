import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import socketClient from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function useDebate(debateId: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [argumentInProgress, setArgumentInProgress] = useState("");
  
  // Query debate details
  const { 
    data: debate, 
    isLoading: debateLoading, 
    error: debateError,
    refetch: refetchDebate
  } = useQuery({
    queryKey: [`/api/debates/${debateId}`],
    enabled: !!debateId,
    refetchInterval: 10000, // Poll every 10 seconds as a fallback
  });
  
  // Determine if it's the current user's turn
  useEffect(() => {
    if (debate && user) {
      const isAffirmative = debate.affirmativeUserId === user.id;
      const isOpposition = debate.oppositionUserId === user.id;
      
      // It's your turn if currentTurn matches your side and debate is active
      const yourTurn = debate.status === "active" && (
        (isAffirmative && debate.currentTurn === "affirmative") ||
        (isOpposition && debate.currentTurn === "opposition")
      );
      
      setIsYourTurn(yourTurn);
      
      // Set the timer
      if (yourTurn && debate.timePerTurn) {
        setRemainingTime(debate.timePerTurn);
      } else {
        setRemainingTime(null);
      }
    }
  }, [debate, user]);
  
  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isYourTurn && remainingTime !== null && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isYourTurn, remainingTime]);
  
  // Auto-submit when time runs out
  useEffect(() => {
    if (isYourTurn && remainingTime === 0 && argumentInProgress) {
      submitArgument(argumentInProgress);
    }
  }, [remainingTime, isYourTurn, argumentInProgress]);
  
  // Socket events for real-time updates
  useEffect(() => {
    if (debateId) {
      // Subscribe to debate events
      socketClient.subscribeToDebate(debateId);
      
      // Handle turn notifications
      const handleYourTurn = (data: any) => {
        if (data.debateId === debateId) {
          refetchDebate();
          toast({
            title: "Your Turn!",
            description: "It's your turn to present your argument.",
          });
        }
      };
      
      // Handle debate completion
      const handleDebateComplete = (data: any) => {
        if (data.debateId === debateId) {
          refetchDebate();
          
          const isWinner = user?.id === data.winnerId;
          
          toast({
            title: isWinner ? "Congratulations!" : "Debate Concluded",
            description: isWinner 
              ? "You won the debate! Check the results for feedback." 
              : "The debate has concluded. Check the results for feedback.",
            variant: isWinner ? "default" : "destructive",
            duration: 5000,
          });
        }
      };
      
      socketClient.on("yourTurn", handleYourTurn);
      socketClient.on("debateComplete", handleDebateComplete);
      
      return () => {
        socketClient.off("yourTurn", handleYourTurn);
        socketClient.off("debateComplete", handleDebateComplete);
      };
    }
  }, [debateId, refetchDebate, user?.id, toast]);
  
  // Mutation to submit an argument
  const argumentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!debate || !user) throw new Error("Debate or user not found");
      
      const side = debate.affirmativeUserId === user.id ? "affirmative" : "opposition";
      
      const payload = {
        debateId,
        userId: user.id,
        round: debate.currentRound,
        side,
        content
      };
      
      const res = await apiRequest("POST", "/api/arguments", payload);
      return res.json();
    },
    onSuccess: () => {
      setArgumentInProgress("");
      queryClient.invalidateQueries({ queryKey: [`/api/debates/${debateId}`] });
      refetchDebate();
      
      toast({
        title: "Argument Submitted",
        description: "Your argument was successfully submitted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Submit",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Function to submit an argument
  const submitArgument = (content: string) => {
    if (!content.trim()) {
      toast({
        title: "Invalid Argument",
        description: "Please enter your argument before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    argumentMutation.mutate(content);
  };
  
  return {
    debate,
    loading: debateLoading,
    error: debateError,
    isYourTurn,
    remainingTime,
    argumentInProgress,
    setArgumentInProgress,
    submitArgument,
    isSubmitting: argumentMutation.isPending,
  };
}
