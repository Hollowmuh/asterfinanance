import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PartnerStats = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Committed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$20,000</div>
          <p className="text-xs text-muted-foreground">+25% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$2,000</div>
          <p className="text-xs text-muted-foreground">10% APY</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Borrowers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">45</div>
          <p className="text-xs text-muted-foreground">92% repayment rate</p>
        </CardContent>
      </Card>
    </div>
  );
};