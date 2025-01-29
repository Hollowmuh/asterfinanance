import { useTheme } from "next-themes";
import { Home, Briefcase, Settings, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/partner/dashboard" },
  { title: "Investments", icon: Briefcase, path: "/partner/investments" },
  { title: "Users", icon: Users, path: "/partner/user-list" },
  { title: "Settings", icon: Settings, path: "/partner/settings" },
];

export function PartnerSidebar() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  return (
    <Sidebar
      className={`border-r ${
        isDarkMode ? "bg-slate-900/80 border-white/10" : "bg-white border-gray-200"
      }`}
    >
      <SidebarContent>
        <div className="p-4">
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            AsterFinance
          </h1>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel
            className={`text-xs font-medium ${
              isDarkMode ? "text-slate-400" : "text-gray-500"
            }`}
          >
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    className={`w-full transition-colors ${
                      isDarkMode
                        ? "text-slate-300 hover:bg-white/10 focus:bg-white/10"
                        : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}