import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const UserSettings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "User Settings Updated",
      description: "Your settings have been successfully saved.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="savingsGoal">Monthly Savings Goal (DAI)</Label>
              <Input id="savingsGoal" type="number" defaultValue={500} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minBalance">Minimum Balance Alert (DAI)</Label>
              <Input id="minBalance" type="number" defaultValue={100} />
            </div>
          </div>
          <Button onClick={handleSave}>Save Account Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="emailNotifications" className="rounded border-gray-300" defaultChecked />
              <Label htmlFor="emailNotifications">Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="depositAlerts" className="rounded border-gray-300" defaultChecked />
              <Label htmlFor="depositAlerts">Deposit Reminders</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="matchAlerts" className="rounded border-gray-300" defaultChecked />
              <Label htmlFor="matchAlerts">Match Opportunities</Label>
            </div>
          </div>
          <Button onClick={handleSave}>Save Notification Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};