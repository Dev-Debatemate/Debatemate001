import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, Star } from "lucide-react";

export interface Achievement {
  id: number;
  type: string;
  title: string;
  description: string;
  earnedAt: Date;
}

interface AchievementsCardProps {
  achievements: Achievement[];
  className?: string;
}

export default function AchievementsCard({ achievements, className }: AchievementsCardProps) {
  // Limit to just a few recent achievements
  const recentAchievements = achievements.slice(0, 3);
  
  // Define icon mapping for achievement types
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "win_streak":
        return <Trophy className="text-yellow-500" />;
      case "first_win":
        return <Trophy className="text-blue-500" />;
      case "vocabulary":
        return <Star className="text-blue-500" />;
      default:
        return <Star className="text-purple-500" />;
    }
  };
  
  return (
    <Card className={`debate-card ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-heading">Recent Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        {recentAchievements.length > 0 ? (
          <ul className="space-y-3">
            {recentAchievements.map((achievement) => (
              <li key={achievement.id} className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  {getAchievementIcon(achievement.type)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{achievement.title}</p>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
              <Trophy className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Complete debates to earn achievements</p>
          </div>
        )}
        
        {achievements.length > 3 && (
          <button className="w-full mt-4 text-primary text-sm font-medium hover:underline">
            View all achievements
          </button>
        )}
      </CardContent>
    </Card>
  );
}
