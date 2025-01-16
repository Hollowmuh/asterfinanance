import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

// Mock data - replace with actual data from your contract
const data = [
  { month: "Jan", deposits: 100, streak: true },
  { month: "Feb", deposits: 150, streak: true },
  { month: "Mar", deposits: 200, streak: true },
  { month: "Apr", deposits: 0, streak: false },
  { month: "May", deposits: 175, streak: true },
  { month: "Jun", deposits: 225, streak: true }
];

const chartConfig = {
  deposits: {
    label: "Monthly Deposits",
    theme: {
      light: "#4F46E5",
      dark: "#818CF8"
    }
  }
};

export function SavingsChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Savings History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="deposits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-deposits)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--color-deposits)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} DAI`}
              />
              <Area
                type="monotone"
                dataKey="deposits"
                stroke="var(--color-deposits)"
                fillOpacity={1}
                fill="url(#deposits)"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </AreaChart>
          </ChartContainer>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Current Streak:</span>
            <span className="font-mono">2 months</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Best Streak:</span>
            <span className="font-mono">3 months</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}