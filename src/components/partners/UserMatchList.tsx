import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    savingsGoal: 5000,
    currentSavings: 2500,
    matchRequested: 2500,
    creditScore: 720,
    savingsStreak: 6
  },
  {
    id: 2,
    name: "Jane Smith",
    savingsGoal: 3000,
    currentSavings: 1500,
    matchRequested: 1500,
    creditScore: 680,
    savingsStreak: 4
  }
];

export const UserMatchList = () => {
  const handleMatch = (userId: number) => {
    toast({
      title: "Match Confirmed",
      description: "You have successfully matched with this user.",
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Match Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <h3 className="font-medium">{user.name}</h3>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    ${user.matchRequested} requested
                  </Badge>
                  <Badge variant="outline">
                    {user.savingsStreak} month streak
                  </Badge>
                  <Badge variant="outline">
                    Credit: {user.creditScore}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Current savings: ${user.currentSavings} / ${user.savingsGoal}
                </div>
              </div>
              <Button onClick={() => handleMatch(user.id)}>Match</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};