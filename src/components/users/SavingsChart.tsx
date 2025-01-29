import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from "recharts";

// Mock data
const data = [
  { month: "Jan", deposits: 100, threshold: 150, goal: 200, streak: true },
  { month: "Feb", deposits: 150, threshold: 150, goal: 200, streak: true },
  { month: "Mar", deposits: 200, threshold: 150, goal: 200, streak: true },
  { month: "Apr", deposits: 0, threshold: 150, goal: 200, streak: false },
  { month: "May", deposits: 175, threshold: 150, goal: 200, streak: true },
  { month: "Jun", deposits: 225, threshold: 150, goal: 200, streak: true },
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">
          Deposits: <span className="text-primary">{payload[0].value} DAI</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Threshold: <span className="text-red-500">150 DAI</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Goal: <span className="text-green-500">200 DAI</span>
        </p>
      </div>
    );
  }
  return null;
};

export function SavingsChart() {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 border-2 border-gray-300 rounded-lg"> {/* Match width with top cards */}
      <h2 className="text-xl font-semibold mb-4">Savings Progress</h2>
      <div className="w-full h-[400px]"> {/* Increased height for better proportions */}
        <AreaChart
          width={1100} // Increased width to match top cards
          height={400} // Increased height for better proportions
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" /> {/* Grid lines */}
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} /> {/* Custom tooltip */}
          <ReferenceLine
            y={150}
            stroke="#E11D48" // Red for threshold
            strokeDasharray="3 3"
            label={{ value: "Required Threshold", position: "right" }}
          />
          <ReferenceLine
            y={200}
            stroke="#22C55E" // Green for goal
            strokeDasharray="3 3"
            label={{ value: "Savings Goal", position: "right" }}
          />
          <Area
            type="monotone"
            dataKey="deposits"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            name="Monthly Deposits"
          />
          <Legend /> {/* Add legend */}
        </AreaChart>
      </div>

      {/* Streak and Goal Details */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Current Streak:</span>
          <span className="text-sm font-semibold">2 months</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Best Streak:</span>
          <span className="text-sm font-semibold">3 months</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Distance to Goal:</span>
          <span className="text-sm font-semibold">25 DAI</span>
        </div>
      </div>
    </div>
  );
}