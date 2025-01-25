import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

const mockData = [
  { month: "Jan", investment: 10000, returns: 200, projected: 10300 },
  { month: "Feb", investment: 10000, returns: 450, projected: 10600 },
  { month: "Mar", investment: 15000, returns: 750, projected: 16000 },
  { month: "Apr", investment: 15000, returns: 1100, projected: 16500 },
  { month: "May", investment: 15000, returns: 1500, projected: 17000 },
  { month: "Jun", investment: 20000, returns: 2000, projected: 22000 }
];

const chartConfig = {
  investment: {
    label: "Committed Funds",
    theme: {
      light: "#4F46E5",
      dark: "#818CF8"
    }
  },
  returns: {
    label: "Returns",
    theme: {
      light: "#059669",
      dark: "#34D399"
    }
  },
  projected: {
    label: "Projected Growth",
    theme: {
      light: "#60A5FA",
      dark: "#93C5FD"
    }
  }
};

export const InvestmentChart = () => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Investment Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="investment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-investment)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-investment)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="returns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-returns)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-returns)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="projected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-projected)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-projected)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <Area
                  type="monotone"
                  dataKey="investment"
                  stroke="var(--color-investment)"
                  fillOpacity={1}
                  fill="url(#investment)"
                />
                <Area
                  type="monotone"
                  dataKey="returns"
                  stroke="var(--color-returns)"
                  fillOpacity={1}
                  fill="url(#returns)"
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="var(--color-projected)"
                  fillOpacity={1}
                  fill="url(#projected)"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};