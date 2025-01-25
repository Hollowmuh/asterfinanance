import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ReferenceLine } from "recharts";

// Mock data - replace with actual data from your contract
const data = [
  { month: "Jan", deposits: 100, threshold: 150, goal: 200, streak: true },
  { month: "Feb", deposits: 150, threshold: 150, goal: 200, streak: true },
  { month: "Mar", deposits: 200, threshold: 150, goal: 200, streak: true },
  { month: "Apr", deposits: 0, threshold: 150, goal: 200, streak: false },
  { month: "May", deposits: 175, threshold: 150, goal: 200, streak: true },
  { month: "Jun", deposits: 225, threshold: 150, goal: 200, streak: true }
];

const chartConfig = {
  deposits: {
    label: "Monthly Deposits",
    theme: {
      light: "#4F46E5",
      dark: "#818CF8"
    }
  },
  threshold: {
    label: "Required Threshold",
    theme: {
      light: "#E11D48",
      dark: "#FB7185"
    }
  },
  goal: {
    label: "Savings Goal",
    theme: {
      light: "#22C55E",
      dark: "#4ADE80"
    }
  }
};

export function SavingsChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Savings Progress</CardTitle>
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
              <ReferenceLine
                y={150}
                stroke="var(--color-threshold)"
                strokeDasharray="3 3"
                label={{ value: "Required Threshold", position: "right" }}
              />
              <ReferenceLine
                y={200}
                stroke="var(--color-goal)"
                strokeDasharray="3 3"
                label={{ value: "Savings Goal", position: "right" }}
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
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Distance to Goal:</span>
            <span className="font-mono">25 DAI</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}