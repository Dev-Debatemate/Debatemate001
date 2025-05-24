import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award, ArrowUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";

export default function Leaderboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch leaderboard data
  const { data: leaderboardUsers = [], isLoading } = useQuery({
    queryKey: ['/api/leaderboard?limit=100'],
  });
  
  // Filter users based on search term
  const filteredUsers = leaderboardUsers.filter((leaderboardUser: any) => 
    leaderboardUser.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leaderboardUser.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get appropriate medal icon for top positions
  const getMedalIcon = (position: number) => {
    switch(position) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return null;
    }
  };
  
  // Find current user's position
  const currentUserPosition = leaderboardUsers.findIndex(
    (leaderboardUser: any) => leaderboardUser.id === user?.id
  );
  
  return (
    <AppLayout title="Leaderboard">
      <div className="container mx-auto px-4 py-6">
        {/* Header with achievements banner */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center md:justify-start">
              <Trophy className="h-12 w-12 text-yellow-300 mr-4" />
              <div>
                <h3 className="text-lg font-heading font-bold">Top Debaters</h3>
                <p className="text-sm text-white/80">
                  Win debates to climb the ranks
                </p>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center justify-center bg-white/10 p-3 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-white/80">Your Rank</p>
                  <p className="text-2xl font-bold">
                    {currentUserPosition !== -1 ? `#${currentUserPosition + 1}` : "N/A"}
                  </p>
                </div>
                <div className="h-12 w-px bg-white/20 mx-4"></div>
                <div className="text-center">
                  <p className="text-sm text-white/80">Points</p>
                  <p className="text-2xl font-bold">{user.points}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center md:justify-end">
              <div className="relative w-full md:w-auto">
                <Input
                  placeholder="Search debaters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 placeholder-white/60 text-white w-full pl-9"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/60" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Leaderboard Table */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Debater</TableHead>
                  <TableHead className="text-center">Level</TableHead>
                  <TableHead className="text-center">Debates</TableHead>
                  <TableHead className="text-center">Win Rate</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((leaderboardUser: any, index: number) => {
                  const isCurrentUser = leaderboardUser.id === user?.id;
                  const winRate = leaderboardUser.debates > 0 
                    ? Math.round((leaderboardUser.wins / leaderboardUser.debates) * 100) 
                    : 0;
                  
                  return (
                    <TableRow 
                      key={leaderboardUser.id}
                      className={isCurrentUser ? "bg-primary/5" : ""}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getMedalIcon(index)}
                          <span className={`ml-1 ${index < 3 ? "font-bold" : ""}`}>
                            #{index + 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <UserAvatar user={leaderboardUser} size="sm" />
                          <span className="ml-2 font-medium">
                            {isCurrentUser ? "You" : leaderboardUser.username}
                          </span>
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{leaderboardUser.level}</TableCell>
                      <TableCell className="text-center">{leaderboardUser.debates}</TableCell>
                      <TableCell className="text-center">
                        <span className={`
                          px-2 py-1 rounded-full text-xs
                          ${winRate >= 70 ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" : 
                            winRate >= 50 ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100" : 
                            "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"}
                        `}>
                          {winRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <div className="flex items-center justify-end">
                          {leaderboardUser.points}
                          
                          {/* Add trend arrow - in a real app this would be based on recent position changes */}
                          <ArrowUp className="ml-1 h-4 w-4 text-green-500 dark:text-green-400" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No debaters found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
