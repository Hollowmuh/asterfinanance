import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, DAI_ADDRESS, MINIMUM_DEPOSIT } from "@/lib/constants";

export default function Deposit() {
  const [daiBalance, setDaiBalance] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [matchPreview, setMatchPreview] = useState<string>("0");
  const { toast } = useToast();

  // Calculate matching preview (mock calculation - replace with actual contract call)
  const calculateMatchPreview = (amount: string) => {
    if (!amount || isNaN(Number(amount))) return "0";
    // Mock calculation: 10% match
    return (Number(amount) * 0.1).toString();
  };

  const handleAmountChange = (value: string) => {
    setDepositAmount(value);
    setMatchPreview(calculateMatchPreview(value));
  };

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      // Add contract interaction here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      toast({
        title: "Deposit successful!",
        description: `Successfully deposited ${depositAmount} DAI`,
      });
      setShowConfirmation(false);
      setDepositAmount("");
      setMatchPreview("0");
    } catch (error) {
      toast({
        title: "Deposit failed",
        description: "There was an error processing your deposit",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Make a Deposit</CardTitle>
          <CardDescription>
            Deposit DAI to your savings account and receive matching funds from our partners.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">Your DAI Balance</span>
            <span className="text-lg font-semibold">{daiBalance} DAI</span>
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Deposit Amount
            </label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                DAI
              </span>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Matching Preview</span>
              <span className="font-medium">{matchPreview} DAI</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total</span>
              <span className="font-medium">
                {(Number(depositAmount || 0) + Number(matchPreview)).toString()} DAI
              </span>
            </div>
          </div>

          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={!depositAmount || Number(depositAmount) <= 0}
              >
                Deposit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deposit</DialogTitle>
                <DialogDescription>
                  You are about to deposit {depositAmount} DAI. This will be matched with {matchPreview} DAI from our partners.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeposit}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Confirm Deposit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}