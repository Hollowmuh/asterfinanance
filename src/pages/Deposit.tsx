import { useState } from "react";
import { DepositForm } from "@/components/shared/DepositForm";
import { useLocation } from "react-router-dom";

export default function Deposit() {
  const [daiBalance, setDaiBalance] = useState<string>("0");
  const location = useLocation();
  const userType = location.pathname.includes('/partner') ? 'partner' : 'user';

  const handleDeposit = async (amount: string) => {
    // Add contract interaction here
    await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
    // Update balance after successful deposit
    setDaiBalance((prev) => (Number(prev) + Number(amount)).toString());
  };

  return (
    <div className="container max-w-2xl animate-fade-in">
      <DepositForm 
        userType={userType}
        onDeposit={handleDeposit}
        balance={daiBalance}
      />
    </div>
  );
}
