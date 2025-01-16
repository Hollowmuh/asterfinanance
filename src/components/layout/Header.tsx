import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="border-b p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Welcome to AsterFinance</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button onClick={connectWallet} variant="outline">
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
}