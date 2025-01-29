import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";

export function Header() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

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

  const goToHomePage = () => {
    navigate("/");
  };

  return (
    <header className="border-b p-4 dark:border-white/10">
      <div className="flex justify-between items-center">
        {/* Clickable "AsterFinance" text */}
        <h2
          className="text-lg font-semibold cursor-pointer hover:text-primary dark:text-slate-300 dark:hover:text-primary"
          onClick={goToHomePage}
        >
          AsterFinance
        </h2>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full dark:text-slate-300 dark:hover:bg-white/10"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button
            onClick={connectWallet}
            variant="outline"
            className="dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
}