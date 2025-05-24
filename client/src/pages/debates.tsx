import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import MatchmakingModal from "@/components/MatchmakingModal";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface Debate {
  id: number;
  topic: {
    id: number;
    title: string;
  };
  status: string;
  currentTurn: string;
  startTime?: string;
  endTime?: string;
  winnerId?: number;
  affirmativeUser: {
    id: number;
    displayName: string;
    username: string;
    avatarId?: number;
  };
  oppositionUser: {
    id: number;
    displayName: string;
    username: string;
    avatarId?: number;
  };
  backgroundIndex: number;
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "judging", label: "Judging" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
];

export default function Debates() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [matchmakingOpen, setMatchmakingOpen] = useState(false);
  
  // Fetch user debates
  const { data: debates = [], isLoading } = useQuery<Debate[]>({
    queryKey: [user ? `/api/debates?userId=${user?.id}` : null],
    enabled: !!user,
  });
  
  // Filter function
  const filterDebates = (debate: Debate) => {
    const matchesStatus = statusFilter === "all" || debate.status === statusFilter;
    const matchesSearch = debate.topic.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  };
  
  // Get filtered and sorted debates
  const getFilteredDebates = (status: "active" | "completed") => {
    // Filter out any invalid debates (missing required fields)
    const validDebates = debates.filter((debate: Debate) => 
      debate && 
      debate.id && 
      debate.topic && 
      debate.topic.title
    );
    
    return validDebates
      .filter((debate: Debate) => {
        if (status === "active") {
          return debate.status !== "completed" && filterDebates(debate);
        } else {
          return debate.status === "completed" && filterDebates(debate);
        }
      })
      .sort((a: Debate, b: Debate) => {
        // Sort by most recent first
        const dateA = new Date(a.startTime || 0);
        const dateB = new Date(b.startTime || 0);
        return dateB.getTime() - dateA.getTime();
      });
  };
  
  const activeDebates = getFilteredDebates("active");
  const completedDebates = getFilteredDebates("completed");
  
  const renderDebateCard = (debate: Debate) => {
    // Only proceed if user is loaded
    if (!user) return null;
    
    const isWinner = debate.winnerId === user.id;
    const isYourTurn = 
      debate.status === "active" && 
      ((debate.currentTurn === "affirmative" && debate.affirmativeUser?.id === user.id) ||
       (debate.currentTurn === "opposition" && debate.oppositionUser?.id === user.id));
    
    // Get the opponent's name and role
    const getOpponentInfo = () => {
      if (debate.affirmativeUser?.id === user.id) {
        return {
          // Use username as fallback if displayName is not available
          name: debate.oppositionUser?.displayName || 
                debate.oppositionUser?.username || 
                "User " + debate.oppositionUser?.id,
          role: "Opposition"
        };
      } else {
        return {
          // Use username as fallback if displayName is not available
          name: debate.affirmativeUser?.displayName || 
                debate.affirmativeUser?.username || 
                "User " + debate.affirmativeUser?.id,
          role: "Affirmative"
        };
      }
    };
    
    const opponentInfo = getOpponentInfo();
    
    return (
      <Link key={debate.id} href={`/debate/${debate.id}`}>
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-lg">{debate.topic.title}</h3>
              {debate.status === "completed" ? (
                <div className={`text-xs px-2 py-1 rounded-full ${
                  isWinner 
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" 
                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
                }`}>
                  {isWinner ? "Won" : "Lost"}
                </div>
              ) : (
                <div className={`text-xs px-2 py-1 rounded-full ${
                  isYourTurn
                    ? "bg-primary/20 text-primary dark:text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isYourTurn ? "Your Turn" : debate.status}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex flex-col text-sm text-muted-foreground">
                <span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    debate.affirmativeUser?.id === user.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-accent/10 text-accent'
                  }`}>
                    {/* For debugging purposes */}
                    <span className="hidden">
                      User ID: {user.id}, 
                      Affirmative ID: {debate.affirmativeUser?.id}, 
                      Opposition ID: {debate.oppositionUser?.id}
                    </span>
                    {/* Show user position based on affirmativeUserId comparison */}
                    {debate.affirmativeUser?.id === user.id ? 'Affirmative' : 'Opposition'}
                  </span>
                </span>
                <span className="text-xs mt-1">
                  {debate.status === "completed" ? 
                    `Completed on ${new Date(debate.endTime || "").toLocaleDateString()}` : 
                    `Started on ${new Date(debate.startTime || "").toLocaleDateString()}`
                  }
                </span>
              </div>
              
              <Button variant="outline" size="sm" className="text-xs border-gray-200">
                {debate.status === "completed" ? "View Results" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      </Link>
    );
  };
  
  return (
    <AppLayout title="My Debates">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setMatchmakingOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" /> New Debate
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Input
                placeholder="Search debates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-60 pl-8 border-border"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-40 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="completed" className="space-y-4">
          <TabsList className="bg-muted dark:bg-muted/30 border-b border-border rounded-md">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              Active Debates
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              Completed Debates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {isLoading || !user ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : activeDebates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeDebates.map((debate) => renderDebateCard(debate))}
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
                <h3 className="text-lg font-medium mb-2 text-foreground">No active debates found</h3>
                <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try changing your search filters"
                    : "Start a new debate to get the conversation going!"}
                </p>
                <Button
                  onClick={() => setMatchmakingOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Debate
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {isLoading || !user ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : completedDebates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedDebates.map((debate) => renderDebateCard(debate))}
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
                <h3 className="text-lg font-medium mb-2 text-foreground">No completed debates found</h3>
                <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try changing your search filters"
                    : "Complete your first debate to see your results here!"}
                </p>
                <Button
                  onClick={() => setMatchmakingOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Debate
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Matchmaking Modal */}
      <MatchmakingModal 
        open={matchmakingOpen} 
        onOpenChange={setMatchmakingOpen} 
      />
    </AppLayout>
  );
}
