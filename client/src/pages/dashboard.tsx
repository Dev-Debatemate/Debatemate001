import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, History, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import MatchmakingModal from "@/components/MatchmakingModal";
import { useAuth } from "@/hooks/useAuth";
import { Achievement } from "@/components/AchievementsCard";

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
  affirmativeUserId: number;
  oppositionUserId: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [matchmakingOpen, setMatchmakingOpen] = useState(false);
  
  // Fetch active debates
  const { data: activeDebates = [] } = useQuery<Debate[]>({
    queryKey: [user ? `/api/debates/active?userId=${user.id}` : null],
    enabled: !!user,
  });
  
  // Fetch all debates (for the completed ones)
  const { data: allDebates = [] } = useQuery<Debate[]>({
    queryKey: [user ? `/api/debates?userId=${user.id}` : null],
    enabled: !!user,
  });
  
  // Fetch achievements
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: [user ? `/api/achievements?userId=${user.id}` : null],
    enabled: !!user,
  });
  
  // Filter completed debates
  const completedDebates = allDebates.filter(
    (debate) => debate.status === "completed" && debate.winnerId !== undefined
  );
  
  // Calculate stats
  const totalDebates = user?.debates || 0;
  const wins = user?.wins || 0;
  const losses = user?.losses || 0;
  const winRate = totalDebates > 0 ? Math.round((wins / totalDebates) * 100) : 0;
  const points = user?.points || 0;
  
  // Calculate current win streak from completed debates
  // Sort debates by end time so we get the most recent ones first
  const sortedDebates = [...completedDebates].sort((a, b) => {
    return new Date(b.endTime || 0).getTime() - new Date(a.endTime || 0).getTime();
  });
  
  let currentStreak = 0;
  for (const debate of sortedDebates) {
    if (debate.winnerId === user?.id) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate best streak - look for the longest sequence of wins
  let bestStreak = 0;
  let tempStreak = 0;
  
  // We need to reverse the order to start from oldest to newest to find streaks over time
  const chronologicalDebates = [...sortedDebates].reverse();
  
  for (const debate of chronologicalDebates) {
    if (debate.winnerId === user?.id) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return (
    <AppLayout title="">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Mate Ready to Debate?</h1>
          <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 max-w-2xl mx-auto">
            Challenge your mind and rhetoric skills in our debate arena. Get matched with a
            Mate and may the best argument win!
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Stats Card */}
          <Card className="flex-1 bg-[#FFF8E9] dark:bg-card border-none shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-foreground">Your Stats</h2>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{totalDebates}</p>
                  <p className="text-muted-foreground text-sm">Debates Played</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500 dark:text-green-400">{wins}</p>
                  <p className="text-muted-foreground text-sm">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500 dark:text-red-400">{losses}</p>
                  <p className="text-muted-foreground text-sm">Losses</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-foreground mb-1">Win Rate</h4>
                <div className="w-full bg-muted dark:bg-muted/50 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${winRate}%` }}></div>
                </div>
                <div className="text-right text-xs text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70 mt-1">{winRate}%</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-card dark:bg-muted/30 rounded-lg p-3 shadow-sm">
                  <div className="flex flex-col items-center">
                    <p className="text-lg font-bold text-primary">{currentStreak}</p>
                    <p className="text-xs text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">Current Streak</p>
                  </div>
                </div>
                
                <div className="bg-card dark:bg-muted/30 rounded-lg p-3 shadow-sm">
                  <div className="flex flex-col items-center">
                    <p className="text-lg font-bold text-primary">{bestStreak}</p>
                    <p className="text-xs text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">Best Streak</p>
                  </div>
                </div>
                
                <div className="bg-card dark:bg-muted/30 rounded-lg p-3 shadow-sm">
                  <div className="flex flex-col items-center">
                    <p className="text-lg font-bold text-primary">{points}</p>
                    <p className="text-xs text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">Total Points</p>
                  </div>
                </div>
              </div>
              

            </CardContent>
          </Card>
          
          {/* Find Debate Card */}
          <div className="flex-1">
            <Card className="border-none shadow-sm h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <h2 className="text-xl font-bold mb-4">Start a New Debate</h2>
                
                <div className="mb-6 flex-grow">
                  <h3 className="font-medium mb-2 text-foreground">How It Works</h3>
                  <ul className="space-y-2 text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">
                    <li className="flex items-start">
                      <span className="inline-block w-5 h-5 mr-2 text-foreground text-opacity-50 dark:text-foreground dark:text-opacity-50">-</span>
                      <span>Get matched with a random Mate</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-5 h-5 mr-2 text-foreground text-opacity-50 dark:text-foreground dark:text-opacity-50">-</span>
                      <span>Flip a coin to determine positions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-5 h-5 mr-2 text-foreground text-opacity-50 dark:text-foreground dark:text-opacity-50">-</span>
                      <span>Engage in a timed debate session</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-5 h-5 mr-2 text-foreground text-opacity-50 dark:text-foreground dark:text-opacity-50">-</span>
                      <span>AI evaluates and determines the winner</span>
                    </li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => setMatchmakingOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium w-full py-5 rounded-md flex items-center justify-center"
                >
                  <Search className="mr-2 h-4 w-4" /> 
                  Find a Mate
                </Button>
                <div className="text-xs text-center text-muted-foreground mt-2">
                  Average wait time: ~15 seconds
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Active Debates Section */}
        {activeDebates.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">Your Active Debates</h2>
            <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
              <div className="space-y-4">
                {activeDebates.map((debate: Debate) => (
                  <Link key={debate.id} href={`/debate/${debate.id}`}>
                    <div className="border-b border-border pb-4 cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/20 p-2 rounded-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-foreground">{debate.topic.title}</h3>
                          <p className="text-sm text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">
                            {debate.status === "active" ? "In progress" : "Waiting for Mate"}
                          </p>
                        </div>
                        <div className="bg-primary/20 dark:bg-primary/30 text-primary text-xs px-2 py-1 rounded-full">
                          {debate.status}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Completed Debates Section */}
        {completedDebates.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Debate History</h2>
              <Link href="/debates">
                <Button variant="link" className="text-primary hover:text-primary/80 flex items-center">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
              <div className="space-y-4">
                {completedDebates.slice(0, 3).map((debate: Debate) => {
                  const isWinner = debate.winnerId === user?.id;
                  return (
                    <Link key={debate.id} href={`/debate/${debate.id}`}>
                      <div className="border-b border-border pb-4 cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/20 p-2 rounded-md transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-foreground">{debate.topic.title}</h3>
                            <p className="text-sm text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">
                              {new Date(debate.endTime || "").toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            isWinner 
                              ? "bg-green-100 dark:bg-green-800/20 text-green-800 dark:text-green-400" 
                              : "bg-red-100 dark:bg-red-800/20 text-red-800 dark:text-red-400"
                          }`}>
                            {isWinner ? "Won" : "Lost"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Matchmaking Modal */}
      <MatchmakingModal 
        open={matchmakingOpen} 
        onOpenChange={setMatchmakingOpen} 
      />
    </AppLayout>
  );
}
