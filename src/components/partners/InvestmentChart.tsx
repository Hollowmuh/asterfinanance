import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend, ResponsiveContainer } from "recharts";

const investorMockData = [
  { quarter: "Q1", invested: 25000, target: 30000 },
  { quarter: "Q2", invested: 42000, target: 30000 },
  { quarter: "Q3", invested: 38000, target: 30000 },
  { quarter: "Q4", invested: 51000, target: 30000 },
];

const CustomInvestorTooltip = ({ active, payload, label, darkMode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-4 border rounded-lg shadow-lg backdrop-blur-sm ${
        darkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{label}</h3>
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              Invested:{" "}
              <span className={`font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                ${payload[0].value.toLocaleString()}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              Target:{" "}
              <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                ${payload[1].value.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const InvestmentChart = ({ darkMode }: { darkMode: boolean }) => {
  return (
    <Card className={`w-full max-w-7xl mx-auto p-6 shadow-xl transition-colors ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
        : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
    }`}>
      <CardHeader>
        <CardTitle className={`text-2xl font-bold border-b pb-4 ${
          darkMode 
            ? 'text-white border-slate-700' 
            : 'text-gray-800 border-gray-200'
        }`}>
          Portfolio Performance
          <span className={`block text-sm font-normal mt-1 ${
            darkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>
            Quarterly Investment Tracking
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-6">
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={investorMockData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={darkMode ? 0.4 : 0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke={darkMode ? '#334155' : '#e5e7eb'} 
              />
              
              <XAxis 
                dataKey="quarter" 
                tick={{ fill: darkMode ? '#94a3b8' : '#6b7280' }}
                axisLine={{ stroke: darkMode ? '#475569' : '#d1d5db' }}
              />
              
              <YAxis 
                tickFormatter={(value) => `$${value / 1000}k`}
                tick={{ fill: darkMode ? '#94a3b8' : '#6b7280' }}
                axisLine={{ stroke: darkMode ? '#475569' : '#d1d5db' }}
              />
              
              <ReferenceLine 
                y={30000} 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: "Annual Target",
                  position: "right",
                  fill: darkMode ? '#10b981' : '#059669',
                  fontSize: 12,
                  fontWeight: 500
                }}
              />
              
              <Tooltip content={<CustomInvestorTooltip darkMode={darkMode} />} />
              
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#investedGradient)"
                name="Capital Invested"
              />
              
              <Area
                type="monotone"
                dataKey="target"
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                fillOpacity={0}
                name="Investment Target"
              />
              
              <Legend 
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => (
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {value}
                  </span>
                )}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {[
            {
              bg: 'indigo',
              title: 'Total Invested',
              icon: '→',
              value: '$156k',
              stat: '+24% vs target'
            },
            {
              bg: 'emerald',
              title: 'ROI (Annual)',
              icon: '%',
              value: '14.2%',
              stat: '+3.8% YoY'
            },
            {
              bg: 'amber',
              title: 'Active Students',
              icon: '👥',
              value: '248',
              stat: '+34 this quarter'
            }
          ].map((metric, index) => (
            <div key={index} className={`p-4 rounded-xl transition-colors ${
              darkMode 
                ? `bg-${metric.bg}-900/20 border border-${metric.bg}-800/50` 
                : `bg-${metric.bg}-50 border border-${metric.bg}-100`
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  darkMode ? `text-${metric.bg}-400` : `text-${metric.bg}-600`
                }`}>
                  {metric.title}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  darkMode ? `bg-${metric.bg}-900/30` : `bg-${metric.bg}-100`
                }`}>
                  <span className={`${darkMode ? `text-${metric.bg}-400` : `text-${metric.bg}-600`}`}>
                    {metric.icon}
                  </span>
                </div>
              </div>
              <h3 className={`text-2xl font-bold mt-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {metric.value}
              </h3>
              <span className={`text-sm font-medium ${
                darkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {metric.stat}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
