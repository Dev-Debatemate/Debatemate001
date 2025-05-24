import { useState } from "react";
import { Link } from "wouter";
import { Clock, CalendarDays, Star, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import Background from "@/components/Background";
import DebateDetailsModal from "@/components/DebateDetailsModal";

interface DebateUser {
  id: number;
  username: string;
  displayName: string;
  avatarId?: number;
}

interface DebateTopic {
  id: number;
  title: string;
  difficulty: number;
}

interface DebateCardProps {
  id: number;
  topic: DebateTopic;
  status: string;
  currentTurn: string;
  affirmativeUser: DebateUser;
  oppositionUser: DebateUser;
  startTime?: Date;
  endTime?: Date;
  winnerId?: number;
  backgroundIndex: number;
  currentUserId?: number;
  className?: string;
}

export default function DebateCard({
  id,
  topic,
  status,
  currentTurn,
  affirmativeUser,
  oppositionUser,
  startTime,
  endTime,
  winnerId,
  backgroundIndex,
  currentUserId,
  className
}: DebateCardProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Add null checks to prevent errors when users are undefined
  if (!topic || !affirmativeUser || !oppositionUser) {
    return (
      <div className={cn("bg-white rounded-lg shadow-md overflow-hidden debate-card", className)}>
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Debate Information Unavailable</h3>
          <p className="text-gray-600 mb-3">Some data required to display this debate is missing.</p>
          <Link href="/debates">
            <Button variant="outline" size="sm">Back to Debates</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if the current user is in this debate
  const isUserInDebate = currentUserId && 
    (affirmativeUser.id === currentUserId || oppositionUser.id === currentUserId);
  
  // Determine if it's the current user's turn
  const isUsersTurn = isUserInDebate && (
    (currentTurn === "affirmative" && affirmativeUser.id === currentUserId) ||
    (currentTurn === "opposition" && oppositionUser.id === currentUserId)
  );
  
  // Format status label and style
  const statusConfig = {
    pending: { label: "Scheduled", className: "bg-gray-500" },
    active: { label: "In Progress", className: "bg-accent" },
    judging: { label: "Judging", className: "bg-yellow-500" },
    completed: { label: "Completed", className: "bg-secondary" }
  };
  
  const statusLabel = statusConfig[status as keyof typeof statusConfig]?.label || "Unknown";
  const statusClass = statusConfig[status as keyof typeof statusConfig]?.className || "bg-gray-500";
  
  // Determine action button text based on state
  let actionButton: {
    text: string;
    variant: NonNullable<ButtonProps["variant"]>;
  } = {
    text: "View Details",
    variant: "default"
  };
  
  if (status === "active" && isUsersTurn) {
    actionButton = {
      text: "Your Turn!",
      variant: "default"
    };
  } else if (status === "active" && isUserInDebate) {
    actionButton = {
      text: "Watch Debate",
      variant: "secondary"
    };
  } else if (status === "completed") {
    actionButton = {
      text: "View Results",
      variant: "outline"
    };
  }
  
  return (
    <div className={cn("bg-white rounded-lg shadow-md overflow-hidden debate-card", className)}>
      <Background index={backgroundIndex}>
        <div className="absolute bottom-4 left-4 text-white">
          <span className={`px-2 py-1 ${statusClass} rounded-full text-xs font-medium`}>
            {statusLabel}
          </span>
          <h3 className="text-lg font-heading font-bold mt-1">{topic.title}</h3>
        </div>
      </Background>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-1 text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={16} 
                className={i < topic.difficulty ? "fill-yellow-500" : "text-gray-300"} 
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {topic.difficulty <= 2 ? "Beginner" : topic.difficulty <= 3 ? "Intermediate" : "Advanced"}
          </span>
        </div>
        
        <div className="flex justify-between mb-3">
          <div>
            <p className="text-sm text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">
              {affirmativeUser.id === currentUserId ? "Your Position: Affirmative" : "Affirmative"}
            </p>
            <div className="flex items-center">
              <UserAvatar user={affirmativeUser} size="sm" />
              <span className="ml-2 text-sm font-medium">
                {affirmativeUser.id === currentUserId ? "You" : affirmativeUser.displayName}
              </span>
              {winnerId === affirmativeUser.id && (
                <span className="ml-2 text-xs bg-secondary text-white px-1.5 py-0.5 rounded-full">
                  Winner
                </span>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
              <span className="text-sm font-bold">VS</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">
              {oppositionUser.id === currentUserId ? "Your Position: Opposition" : "Opposition"}
            </p>
            <div className="flex items-center justify-end">
              <span className="mr-2 text-sm font-medium">
                {oppositionUser.id === currentUserId ? "You" : oppositionUser.displayName}
              </span>
              <UserAvatar user={oppositionUser} size="sm" />
              {winnerId === oppositionUser.id && (
                <span className="ml-2 text-xs bg-secondary text-white px-1.5 py-0.5 rounded-full">
                  Winner
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            {status === "active" && (
              <div>
                <p className="text-xs text-gray-600">
                  {isUsersTurn ? "Your Turn" : `${currentTurn === "affirmative" ? "Affirmative" : "Opposition"}'s Turn`}
                </p>
                <p className="text-sm font-medium">
                  <Clock size={14} className="inline text-primary mr-1" /> 
                  {isUsersTurn ? "Time remaining" : "Waiting"}
                </p>
              </div>
            )}
            
            {status === "pending" && startTime && (
              <div>
                <p className="text-xs text-gray-600">Starts In</p>
                <p className="text-sm font-medium">
                  <CalendarDays size={14} className="inline text-primary mr-1" /> 
                  {formatDistanceToNow(new Date(startTime))}
                </p>
              </div>
            )}
            
            {status === "completed" && (
              <div>
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-sm font-medium">
                  <CalendarDays size={14} className="inline text-primary mr-1" /> 
                  {endTime ? formatDistanceToNow(new Date(endTime), { addSuffix: true }) : "Recently"}
                </p>
              </div>
            )}
          </div>
          
          {status === "completed" ? (
            <Button 
              variant={actionButton.variant} 
              size="sm"
              onClick={() => setShowDetailsModal(true)}
            >
              <FileText className="h-4 w-4 mr-1" />
              {actionButton.text}
            </Button>
          ) : (
            <Link href={`/debate/${id}`}>
              <Button 
                variant={actionButton.variant} 
                size="sm"
                className={isUsersTurn ? "animate-pulse bg-accent hover:bg-accent/90" : ""}
              >
                {actionButton.text}
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Debate Details Modal */}
      <DebateDetailsModal
        debateId={id}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </div>
  );
}
