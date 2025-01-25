import { PartnerStats } from "@/components/partners/PartnerStats";
import { InvestmentChart } from "@/components/partners/InvestmentChart";
import { UserMatchList } from "@/components/partners/UserMatchList";

const PartnerDashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Partner Dashboard</h1>
      <PartnerStats />
      <InvestmentChart />
      <UserMatchList />
    </div>
  );
};

export default PartnerDashboard;