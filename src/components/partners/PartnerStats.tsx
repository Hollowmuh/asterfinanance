import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export const PartnerStats = ({ darkMode }: { darkMode: boolean }) => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[
        {
          color: 'indigo',
          title: 'Total Committed',
          icon: '$',
          value: '$20,000',
          stat: '+25%',
          description: 'vs last month'
        },
        {
          color: 'emerald',
          title: 'Total Returns',
          icon: '%',
          value: '$2,000',
          stat: '10% APY',
          description: 'current yield'
        },
        {
          color: 'amber',
          title: 'Active Borrowers',
          icon: '👥',
          value: '45',
          stat: '92%',
          description: 'repayment rate'
        }
      ].map((stat, index) => (
        <Card key={index} className={`shadow-sm hover:shadow-md transition-all ${
          darkMode 
            ? `bg-slate-800/50 border border-slate-700 hover:border-${stat.color}-400/30`
            : `bg-gradient-to-br from-${stat.color}-50/50 to-white border border-${stat.color}-100`
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className={`text-sm font-medium ${
              darkMode ? `text-${stat.color}-400` : `text-${stat.color}-600`
            }`}>
              {stat.title}
            </CardTitle>
            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
              darkMode ? `bg-${stat.color}-900/30` : `bg-${stat.color}-100`
            }`}>
              <span className={`${darkMode ? `text-${stat.color}-400` : `text-${stat.color}-600`}`}>
                {stat.icon}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {stat.value}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-sm font-medium ${
                darkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {stat.stat}
              </span>
              <span className={`text-xs ${
                darkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                {stat.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};