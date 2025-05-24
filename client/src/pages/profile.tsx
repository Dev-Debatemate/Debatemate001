import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, BarChart2, Clock, Calendar, KeyRound, Pencil } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/UserAvatar";

import DebateCard from "@/components/DebateCard";
import UpdateUsernameDialog from "@/components/UpdateUsernameDialog";
import UpdatePasswordDialog from "@/components/UpdatePasswordDialog";
import { useAuth } from "@/hooks/useAuth";

// Type for achievements
interface Achievement {
  id: number;
  type: string;
  title: string;
  description: string;
  earnedAt: Date;
}

export default function Profile() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Safely access user ID
  const userId = user?.id;
  
  // Fetch user's achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: [userId ? `/api/achievements?userId=${userId}` : 'no-achievements'],
    enabled: !!userId,
  });
  
  // Fetch user's debates
  const { data: debates = [], isLoading: debatesLoading } = useQuery<any[]>({
    queryKey: [userId ? `/api/debates?userId=${userId}` : 'no-debates'],
    enabled: !!userId,
  });
  
  // Check if data is loading
  const isLoading = authLoading || achievementsLoading || debatesLoading || !user;
  
  // Calculate stats only if user exists
  const stats = {
    totalDebates: user?.debates ?? 0,
    wins: user?.wins ?? 0,
    losses: user?.losses ?? 0,
    winRate: user?.debates && user?.debates > 0 ? Math.round((user.wins / user.debates) * 100) : 0,
    pointsToNextLevel: user?.points ? 100 - (user.points % 100) : 100, // Default to 100 if no points
    progressToNextLevel: user?.points ? (user.points % 100) : 0,
  };
  
  // Get achievement icon based on type
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "win_streak":
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case "first_win":
        return <Medal className="h-6 w-6 text-blue-500" />;
      case "debate_count":
        return <Award className="h-6 w-6 text-purple-500" />;
      case "perfect_score":
        return <BarChart2 className="h-6 w-6 text-green-500" />;
      default:
        return <Award className="h-6 w-6 text-primary" />;
    }
  };
  
  if (!isAuthenticated && !authLoading) {
    return (
      <AppLayout title="My Profile">
        <div className="container mx-auto py-12 px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center py-12">
              <h2 className="text-2xl font-bold mb-6">Please Log In</h2>
              <p className="text-center text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70 mb-6">
                You need to be logged in to view your profile.
              </p>
              <Link href="/login">
                <Button>Log In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title="My Profile">
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          // Loading state
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">Loading profile data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile sidebar */}
            <div className="space-y-6">
              {/* Profile card */}
              <Card className="overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary to-primary/70"></div>
                <CardContent className="pt-0 pb-6">
                  <div className="relative flex justify-center">
                    <div className="relative">
                      {user && (
                        <UserAvatar 
                          user={user} 
                          className="w-24 h-24 border-4 border-white -mt-12" 
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center mt-4">
                    <div className="flex items-center justify-center space-x-1">
                      <h2 className="text-2xl font-heading font-bold">{user?.username}</h2>
                      <button 
                        onClick={() => setUsernameDialogOpen(true)}
                        className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Edit username"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="mt-2 inline-flex items-center">
                      <span className="px-3 py-1 bg-accent text-white rounded-full">
                        Level {user?.level || 1}
                      </span>
                      <button 
                        onClick={() => setPasswordDialogOpen(true)}
                        className="ml-2 inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Change password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress to Level {(user?.level || 1) + 1}</span>
                      <span>{stats.progressToNextLevel}%</span>
                    </div>
                    <Progress value={stats.progressToNextLevel} className="h-2" />
                    <p className="text-xs text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70 mt-1">
                      {stats.pointsToNextLevel} points needed for next level
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-6 text-center">
                    <div className="p-2 bg-muted/50 dark:bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{stats.totalDebates}</p>
                      <p className="text-xs text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">Debates</p>
                    </div>
                    <div className="p-2 bg-muted/50 dark:bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-green-500 dark:text-green-400">{stats.wins}</p>
                      <p className="text-xs text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">Wins</p>
                    </div>
                    <div className="p-2 bg-muted/50 dark:bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-red-500 dark:text-red-400">{stats.losses}</p>
                      <p className="text-xs text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80">Losses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Stats card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Win Rate</span>
                        <span className="text-sm">{stats.winRate}%</span>
                      </div>
                      <Progress value={stats.winRate} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">Best Streak</p>
                          <p className="font-medium text-foreground">{stats.wins} {stats.wins === 1 ? 'win' : 'wins'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">Avg. Response</p>
                          <p className="font-medium text-foreground">{stats.totalDebates ? '~2m 30s' : 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">Member Since</p>
                          <p className="font-medium text-foreground">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                          <BarChart2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70">Total Score</p>
                          <p className="font-medium text-foreground">{user?.points || 0} pts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-heading">Debate History</CardTitle>
                </CardHeader>
                <CardContent>
                  {debates.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead className="text-xs uppercase bg-card text-foreground">
                          <tr>
                            <th className="px-6 py-3 text-left font-medium">Topic</th>
                            <th className="px-6 py-3 text-left font-medium">Position</th>
                            <th className="px-6 py-3 text-center font-medium">Result</th>
                            <th className="px-6 py-3 text-center font-medium">Date</th>
                            <th className="px-6 py-3 text-right font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {debates.map((debate: any) => {
                            const isAffirmative = debate.affirmativeUser?.id === user?.id;
                            const otherDebater = isAffirmative 
                              ? debate.oppositionUser 
                              : debate.affirmativeUser;
                            const otherDebaterRole = isAffirmative ? "Opposition" : "Affirmative";
                            const isWinner = debate.winnerId === user?.id;
                            const isCompleted = debate.status === "completed";
                            const date = debate.startTime ? new Date(debate.startTime) : new Date();
                            
                            return (
                              <tr key={debate.id} className="bg-background hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-foreground">
                                  {debate.topic?.title?.length > 40 
                                    ? `${debate.topic.title.substring(0, 40)}...` 
                                    : debate.topic?.title || 'Unknown Topic'}
                                </td>
                                <td className="px-6 py-4 text-sm text-foreground">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isAffirmative ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                                  }`}>
                                    {isAffirmative ? 'Affirmative' : 'Opposition'}
                                  </span>
                                </td>

                                <td className="px-6 py-4 text-center">
                                  {isCompleted ? (
                                    <span className={`
                                      px-2 py-1 
                                      rounded-full 
                                      text-xs 
                                      font-medium
                                      ${isWinner 
                                        ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                                      }
                                    `}>
                                      {isWinner ? 'Won' : 'Lost'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                      {debate.status.charAt(0).toUpperCase() + debate.status.slice(1)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-center text-foreground">
                                  {date.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Link href={`/debate/${debate.id}`}>
                                    <Button variant="secondary" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                      View
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-foreground text-opacity-70 dark:text-foreground dark:text-opacity-70 mb-4">No debate history found.</p>
                      <Link href="/debates">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Start Debating</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Change Username Dialog */}
        {user && (
          <UpdateUsernameDialog
            open={usernameDialogOpen}
            onOpenChange={setUsernameDialogOpen}
            currentUsername={user.username}
          />
        )}
        
        {/* Change Password Dialog */}
        <UpdatePasswordDialog
          open={passwordDialogOpen}
          onOpenChange={setPasswordDialogOpen}
        />
      </div>
    </AppLayout>
  );
}