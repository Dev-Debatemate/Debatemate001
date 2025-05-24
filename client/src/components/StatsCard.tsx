import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsCardProps {
  debates: number;
  wins: number;
  losses: number;
  className?: string;
}

export default function StatsCard({ debates, wins, losses, className }: StatsCardProps) {
  // Calculate win rate (avoid division by zero)
  const winRate = debates > 0 ? Math.round((wins / debates) * 100) : 0;
  
  return (
    <Card className={`debate-card ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-heading">Your Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2">
            <p className="text-2xl font-bold text-primary">{debates}</p>
            <p className="text-sm text-gray-600">Debates</p>
          </div>
          <div className="p-2">
            <p className="text-2xl font-bold text-green-500">{wins}</p>
            <p className="text-sm text-gray-600">Wins</p>
          </div>
          <div className="p-2">
            <p className="text-2xl font-bold text-accent">{losses}</p>
            <p className="text-sm text-gray-600">Losses</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Win Rate</h4>
            <p className="text-xs text-gray-600">{winRate}%</p>
          </div>
          <Progress value={winRate} className="h-2 bg-gray-200">
            <div className="h-full bg-secondary" style={{ width: `${winRate}%` }}></div>
          </Progress>
        </div>
      </CardContent>
    </Card>
  );
}
