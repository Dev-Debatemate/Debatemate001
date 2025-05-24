import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: number;
  username: string;
  displayName: string;
  avatarId?: number;
  points: number;
}

interface LeaderboardCardProps {
  users: LeaderboardUser[];
  currentUserId?: number;
  className?: string;
}

export default function LeaderboardCard({ users, currentUserId, className }: LeaderboardCardProps) {
  return (
    <Card className={cn("debate-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-heading">Top Debaters</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <ul className="space-y-2">
            {users.map((user, index) => {
              const isCurrentUser = user.id === currentUserId;
              
              return (
                <li 
                  key={user.id} 
                  className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-lg transition",
                    isCurrentUser ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <div className="ml-2 flex items-center">
                      <UserAvatar user={user} size="sm" className="mr-2" />
                      <span className="font-medium text-sm">
                        {isCurrentUser ? "You" : user.username}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-secondary font-bold">{user.points} pts</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
        
        <button className="w-full mt-4 text-primary text-sm font-medium hover:underline">
          View full leaderboard
        </button>
      </CardContent>
    </Card>
  );
}
