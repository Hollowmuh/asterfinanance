import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

const mockPartners = [
  {
    id: 1,
    name: "Growth Capital Fund",
    availableFunds: 100000,
    matchRate: 1.5,
    minCreditScore: 650,
    activeMatches: 25,
    avgReturn: "10%"
  },
  {
    id: 2,
    name: "Community Impact Partners",
    availableFunds: 50000,
    matchRate: 1.0,
    minCreditScore: 600,
    activeMatches: 15,
    avgReturn: "8%"
  }
];

export const PartnerList = () => {
  const handleRequestMatch = (partnerId: number) => {
    toast({
      title: "Match Requested",
      description: "Your match request has been sent to the partner.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Partners</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockPartners.map((partner) => (
            <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <h3 className="font-medium">{partner.name}</h3>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    ${partner.availableFunds.toLocaleString()} available
                  </Badge>
                  <Badge variant="outline">
                    {partner.matchRate}x match rate
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Min. credit score: {partner.minCreditScore} | Active matches: {partner.activeMatches} | Avg. return: {partner.avgReturn}
                </div>
              </div>
              <Button onClick={() => handleRequestMatch(partner.id)}>Request Match</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};