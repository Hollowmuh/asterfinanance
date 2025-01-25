import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const PartnerSettings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Partner Settings Updated",
      description: "Your settings have been successfully saved.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Matching Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="matchRate">Match Rate</Label>
              <Input id="matchRate" type="number" step="0.1" defaultValue={1.5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMatch">Maximum Match Amount (DAI)</Label>
              <Input id="maxMatch" type="number" defaultValue={5000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minCreditScore">Minimum Credit Score</Label>
              <Input id="minCreditScore" type="number" defaultValue={650} />
            </div>
          </div>
          <Button onClick={handleSave}>Save Match Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investment Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="autoMatch">Auto-Match Threshold (DAI)</Label>
              <Input id="autoMatch" type="number" defaultValue={1000} />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="autoApprove" className="rounded border-gray-300" />
              <Label htmlFor="autoApprove">Auto-approve matches below threshold</Label>
            </div>
          </div>
          <Button onClick={handleSave}>Save Investment Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};