import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface DepositFormProps {
  userType: 'user' | 'partner';
  onDeposit: (amount: string) => Promise<void>;
  balance: string;
}

export function DepositForm({ userType, onDeposit, balance }: DepositFormProps) {
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [matchPreview, setMatchPreview] = useState<string>("0");
  const { toast } = useToast();

  const calculateMatchPreview = (amount: string) => {
    if (!amount || isNaN(Number(amount))) return "0";
    return userType === 'user' ? (Number(amount) * 0.1).toString() : "0";
  };

  const handleAmountChange = (value: string) => {
    setDepositAmount(value);
    setMatchPreview(calculateMatchPreview(value));
  };

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      await onDeposit(depositAmount);
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
    <Card>
      <CardHeader>
        <CardTitle>Make a Deposit</CardTitle>
        <CardDescription>
          {userType === 'user' 
            ? "Deposit DAI to your savings account and receive matching funds from our partners."
            : "Deposit DAI to your partner account to provide matching funds for users."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">Your DAI Balance</span>
          <span className="text-lg font-semibold">{balance} DAI</span>
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

        {userType === 'user' && (
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
        )}

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
                {userType === 'user' 
                  ? `You are about to deposit ${depositAmount} DAI. This will be matched with ${matchPreview} DAI from our partners.`
                  : `You are about to deposit ${depositAmount} DAI to your partner account.`}
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
  );
}