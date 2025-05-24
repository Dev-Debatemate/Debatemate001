import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, FileText, MessageCircle, Clock, Trophy } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface DebateDetailsModalProps {
  debateId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDashboard?: () => void;
}

export default function DebateDetailsModal({ 
  debateId, 
  open, 
  onOpenChange,
  onViewDashboard
}: DebateDetailsModalProps) {
  const { user } = useAuth();
  const [showFullFeedback, setShowFullFeedback] = useState(false);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowFullFeedback(false);
    }
  }, [open]);
  
  // Fetch debate details
  const { data: debate, isLoading } = useQuery({
    queryKey: [debateId ? `/api/debates/${debateId}` : null],
    enabled: !!debateId && open,
  });
  
  if (!debate && !isLoading) return null;
  
  const isUserWinner = debate?.winnerId === user?.id;
  const userSide = debate?.affirmativeUserId === user?.id ? "affirmative" : "opposition";
  const dateFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : debate ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading">
                Debate Results
              </DialogTitle>
              <DialogDescription>
                {debate.topic?.title}
              </DialogDescription>
            </DialogHeader>
            
            {/* Result Summary */}
            <Card className={`border-2 ${isUserWinner ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {isUserWinner ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="text-xl font-semibold text-green-600">Victory!</h3>
                        <p className="text-green-600">Congratulations, you won this debate.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="text-xl font-semibold text-red-600">Defeat</h3>
                        <p className="text-red-600">You didn't win this time, but you can learn from the experience.</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Debate Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" />
                    <span className="capitalize font-medium">{userSide}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    <span>
                      {debate.startTime && debate.endTime ? 
                        formatDistanceToNow(new Date(debate.endTime), { addSuffix: false }) : 
                        "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5 text-primary" />
                    <span>
                      {debate.endTime ? format(new Date(debate.endTime), 'MMM d, yyyy') : "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 rounded-lg border">
                    <UserAvatar user={debate.affirmativeUser} className="h-10 w-10 mr-3" />
                    <div>
                      <p className="font-medium">{debate.affirmativeUser?.username}</p>
                      <p className="text-sm text-gray-500">Affirmative</p>
                    </div>
                    {debate.winnerId === debate.affirmativeUser?.id && (
                      <Trophy className="ml-auto h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center p-3 rounded-lg border">
                    <UserAvatar user={debate.oppositionUser} className="h-10 w-10 mr-3" />
                    <div>
                      <p className="font-medium">{debate.oppositionUser?.username}</p>
                      <p className="text-sm text-gray-500">Opposition</p>
                    </div>
                    {debate.winnerId === debate.oppositionUser?.id && (
                      <Trophy className="ml-auto h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* AI Judging Feedback */}
            {debate.judgingFeedback && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Judge Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    {showFullFeedback ? (
                      <div className="whitespace-pre-wrap">
                        {debate.judgingFeedback}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {debate.judgingFeedback.split('\n\n')[0]}
                      </div>
                    )}
                    
                    {debate.judgingFeedback.includes('\n\n') && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowFullFeedback(!showFullFeedback)}
                        className="mt-2"
                      >
                        {showFullFeedback ? "Show Less" : "Show Full Analysis"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onViewDashboard && (
                <Button onClick={onViewDashboard}>
                  Back to Dashboard
                </Button>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}