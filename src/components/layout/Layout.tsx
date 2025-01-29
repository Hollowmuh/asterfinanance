import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { UserSidebar } from "@/components/users/userSidebar";
import { PartnerSidebar } from "@/components/partners/partnerSidebar";
import { Header } from "./Header";
import { useTheme } from "next-themes";

interface LayoutProps {
  userType: "user" | "partner";
}

export function Layout({ userType }: LayoutProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <div
          className={`min-h-screen flex w-full overflow-x-hidden ${isDarkMode
              ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
              : "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50"
            }`}
        >
          {/* Sidebar */}
          {userType === "user" ? <UserSidebar /> : <PartnerSidebar />}

          {/* Main Content */}
          <div className="flex-1 flex flex-col max-w-full overflow-hidden w-full">
            {/* Header */}
            <Header
              className={`border-b ${isDarkMode ? "border-white/10" : "border-gray-200"
                }`}
            />

            {/* Content */}
            <main
              className={`flex-1 p-6 w-full mx-auto ${isDarkMode ? "text-slate-300" : "text-gray-900"
                }`}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}