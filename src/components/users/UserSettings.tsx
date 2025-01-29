import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export const UserSettings = () => {
  const { toast } = useToast();

  const handleSave = (section: string) => {
    toast({
      title: `${section} Updated`,
      description: `Your ${section.toLowerCase()} have been successfully saved.`,
    });
  };

  return (
    <div className="flex justify-center p-6 w-full">
      <div className="w-full max-w-4xl space-y-8">
        {/* Account Settings Card */}
        <Card className="shadow-sm w-full border border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="savingsGoal">Monthly Savings Goal (DAI)</Label>
              <Input
                id="savingsGoal"
                type="number"
                defaultValue={500}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minBalance">Minimum Balance Alert (DAI)</Label>
              <Input
                id="minBalance"
                type="number"
                defaultValue={100}
                className="w-full"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => handleSave("Account Settings")}
                className="w-full sm:w-auto"
              >
                Save Account Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Card */}
        <Card className="shadow-sm w-full border border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email.
                </p>
              </div>
              <Switch id="emailNotifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="depositAlerts">Deposit Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminders to make deposits.
                </p>
              </div>
              <Switch id="depositAlerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="matchAlerts">Match Opportunities</Label>
                <p className="text-sm text-muted-foreground">
                  Notify me about matching opportunities.
                </p>
              </div>
              <Switch id="matchAlerts" defaultChecked />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => handleSave("Notification Preferences")}
                className="w-full sm:w-auto"
              >
                Save Notification Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};