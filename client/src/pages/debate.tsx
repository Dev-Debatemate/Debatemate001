import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertCircle, Award, CheckCircle, ChevronLeft, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/UserAvatar";
import Background from "@/components/Background";
import DebateInterface from "@/components/DebateInterface";
import { useAuth } from "@/hooks/useAuth";
import { useDebate } from "@/hooks/useDebate";
import { Link } from "wouter";

export default function Debate() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("debate");
  
  const debateId = parseInt(id);
  
  const {
    debate,
    loading,
    error,
    isYourTurn,
    remainingTime,
    argumentInProgress,
    setArgumentInProgress,
    submitArgument,
    isSubmitting
  } = useDebate(debateId);
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load debate data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Format the judging feedback text with line breaks
  const formatFeedback = (feedback: string | undefined) => {
    if (!feedback) return [];
    
    // Split by double newlines and filter out empty strings
    const paragraphs = feedback.split('\n\n').filter(Boolean);
    
    // Extract improvement points section if present
    const improvementPointsIndex = paragraphs.findIndex(p => 
      p.toLowerCase().includes('key points for improvement') || 
      p.toLowerCase().includes('improvement points')
    );
    
    // If there's an improvement points section, don't include it in the general feedback
    if (improvementPointsIndex !== -1) {
      return paragraphs.slice(0, improvementPointsIndex);
    }
    
    return paragraphs;
  };
  
  // Extract improvement points from the feedback text
  const extractImprovementPoints = (feedback: string | undefined): string[] => {
    if (!feedback) return [];
    
    const paragraphs = feedback.split('\n\n').filter(Boolean);
    const improvementPointsIndex = paragraphs.findIndex(p => 
      p.toLowerCase().includes('key points for improvement') || 
      p.toLowerCase().includes('improvement points')
    );
    
    if (improvementPointsIndex === -1) return [];
    
    // Get the points which are typically in a list format with "-" or "•" or numbers
    const pointsText = paragraphs.slice(improvementPointsIndex).join('\n\n');
    const points = pointsText.split('\n')
      .filter(line => line.trim().match(/^[-•*]|\d+\.\s|[A-Z]\.\s/))
      .map(line => line.replace(/^[-•*]|\d+\.\s|[A-Z]\.\s/, '').trim());
    
    return points.length > 0 ? points : [];
  };
  
  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!debate) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="bg-card rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-bold mb-2 text-foreground">Debate Not Found</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-6">
              This debate does not exist or you don't have access to it.
            </p>
            <Link href="/debates">
              <Button>Return to Debates</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  const isParticipant = 
    user?.id === debate?.affirmativeUser?.id || 
    user?.id === debate?.oppositionUser?.id;
  
  const isUserAffirmative = user?.id === debate?.affirmativeUser?.id;
  const userRole = isUserAffirmative ? "affirmative" : "opposition";
  
  const isCompleted = debate?.status === "completed";
  const isUserWinner = isCompleted && debate?.winnerId === user?.id;
  
  return (
    <AppLayout>
      <Background index={debate.backgroundIndex} className="h-40">
        <div className="container mx-auto px-4 py-6 relative h-full flex flex-col justify-end">
          <div className="flex justify-between items-end">
            <div>
              <Badge 
                className={`
                  ${debate.status === "active" ? "bg-accent" : ""}
                  ${debate.status === "judging" ? "bg-yellow-500" : ""}
                  ${debate.status === "completed" ? "bg-secondary" : ""}
                  ${debate.status === "pending" ? "bg-gray-500" : ""}
                `}
              >
                {debate.status.charAt(0).toUpperCase() + debate.status.slice(1)}
              </Badge>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-white mt-2">
                {debate.topic.title}
              </h1>
              <div className="mt-2">
                <Link href="/debates">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/20 pl-0"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex space-x-1 text-yellow-300">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={16}
                  strokeWidth={2.5}
                  className={i < debate.topic.difficulty ? "fill-yellow-300" : "text-white/50"} 
                />
              ))}
            </div>
          </div>
        </div>
      </Background>
      
      <div className="container mx-auto px-4 py-6">
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Affirmative Side */}
            <div className={`p-4 rounded-lg ${isUserAffirmative ? "bg-primary/10" : ""}`}>
              <p className="text-sm text-muted-foreground mb-2">Affirmative</p>
              <div className="flex items-center">
                <UserAvatar user={debate.affirmativeUser} size="md" />
                <div className="ml-3">
                  <p className="font-medium">
                    {debate.affirmativeUser.id === user?.id ? "You" : debate.affirmativeUser.username}
                  </p>
                  <p className="text-xs text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">Level {debate.affirmativeUser.level}</p>
                </div>
                {isCompleted && debate.winnerId === debate.affirmativeUser.id && (
                  <Badge className="ml-2 bg-secondary">Winner</Badge>
                )}
              </div>
            </div>
            
            {/* Status */}
            <div className="text-center">
              <div className="mb-2">
                <span className="px-3 py-1 rounded-full bg-primary text-white text-sm font-bold">
                  {isCompleted 
                    ? "Debate Completed" 
                    : `Round ${debate.currentRound} of ${debate.maxRounds}`
                  }
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted/60 dark:bg-muted/30 mx-auto flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">VS</span>
              </div>
            </div>
            
            {/* Opposition Side */}
            <div className={`p-4 rounded-lg ${!isUserAffirmative ? "bg-accent/10" : ""}`}>
              <p className="text-sm text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-2">Opposition</p>
              <div className="flex items-center">
                <UserAvatar user={debate.oppositionUser} size="md" />
                <div className="ml-3">
                  <p className="font-medium text-foreground">
                    {debate.oppositionUser.id === user?.id ? "You" : debate.oppositionUser.username}
                  </p>
                  <p className="text-xs text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">Level {debate.oppositionUser.level}</p>
                </div>
                {isCompleted && debate.winnerId === debate.oppositionUser.id && (
                  <Badge className="ml-2 bg-secondary">Winner</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="debate">Debate</TabsTrigger>
            {isCompleted && <TabsTrigger value="results">Results</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="debate">
            {isParticipant ? (
              <DebateInterface
                debateId={debate.id}
                topic={debate.topic.title}
                currentRound={debate.currentRound}
                maxRounds={debate.maxRounds}
                affirmativeUser={debate.affirmativeUser}
                oppositionUser={debate.oppositionUser}
                currentUserId={user?.id}
                isYourTurn={isYourTurn}
                remainingTime={remainingTime}
                arguments={debate.arguments}
                onSubmitArgument={submitArgument}
                isSubmitting={isSubmitting}
                status={debate.status}
                isCompleted={isCompleted}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">
                    You are viewing this debate as a spectator. You cannot participate in the debate.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="results">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-8">
                  <div className="mb-4">
                    {isUserWinner ? (
                      <div className="inline-block">
                        <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
                          <Award className="h-10 w-10 text-secondary" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-secondary">
                          Congratulations!
                        </h2>
                        <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">You won this debate!</p>
                      </div>
                    ) : (
                      <div className="inline-block">
                        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="h-10 w-10 text-accent" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-foreground">
                          Debate Completed
                        </h2>
                        <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">
                          {debate.affirmativeUser.id === debate.winnerId ? 
                            debate.affirmativeUser.username : 
                            debate.oppositionUser.username} won this debate.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Scores */}
                  <div className="flex justify-center gap-8 mb-8">
                    <div className="text-center">
                      <div className="text-xl font-heading font-bold">Affirmative</div>
                      <div className={`text-3xl font-bold ${debate.affirmativeUser.id === debate.winnerId ? "text-secondary" : "text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80"}`}>
                        {/* In a real implementation, scores would be stored in the debate object */}
                        {debate.affirmativeUser.id === debate.winnerId ? "85" : "75"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-heading font-bold">Opposition</div>
                      <div className={`text-3xl font-bold ${debate.oppositionUser.id === debate.winnerId ? "text-secondary" : "text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80"}`}>
                        {debate.oppositionUser.id === debate.winnerId ? "85" : "75"}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Judge's Feedback */}
                <div className="border-t pt-6">
                  <h3 className="text-xl font-heading font-bold mb-4">Judge's Feedback</h3>
                  {formatFeedback(debate?.judgingFeedback).map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                  
                  {/* Key Points for Improvement */}
                  {(() => {
                    // First try to use debate.improvementPoints if available
                    const points = debate?.improvementPoints?.length 
                      ? debate.improvementPoints 
                      : extractImprovementPoints(debate?.judgingFeedback);
                      
                    return points.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-heading font-bold mb-4">Key Points for Improvement</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          {points.map((point: string, index: number) => (
                            <li key={index} className="text-foreground">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
