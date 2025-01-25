import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const Settings = () => {
  const handleSave = () => {
    toast({
      title: "Settings Updated",
      description: "Your settings have been successfully saved.",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Platform Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minSavingsPeriod">Minimum Savings Period (months)</Label>
              <Input id="minSavingsPeriod" type="number" defaultValue={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyDeposit">Monthly Deposit Requirement (DAI)</Label>
              <Input id="monthlyDeposit" type="number" defaultValue={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanThreshold">Loan Eligibility Threshold (DAI)</Label>
              <Input id="loanThreshold" type="number" defaultValue={1000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMatch">Maximum Match Amount (DAI)</Label>
              <Input id="maxMatch" type="number" defaultValue={5000} />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4">Save Changes</Button>
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
              <input type="checkbox" id="smsNotifications" className="rounded border-gray-300" />
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4">Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;