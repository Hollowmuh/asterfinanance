import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { toast } = useToast();

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "Metamask not found",
          description: "Please install Metamask to use this application",
          variant: "destructive",
        });
        return;
      }
      
      await window.ethereum.request({ method: "eth_requestAccounts" });
      toast({
        title: "Connected",
        description: "Wallet connected successfully",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Welcome to AsterFinance</h2>
        <Button onClick={connectWallet} variant="outline">
          Connect Wallet
        </Button>
      </div>
    </header>
  );
}