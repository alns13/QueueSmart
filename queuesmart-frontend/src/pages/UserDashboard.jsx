import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  HouseIcon,
  ListIcon,
  ClockIcon,
  ChartLineIcon,
  BellIcon,
  SignOutIcon,
} from "@phosphor-icons/react";

import { logout } from "@/api/auth.js";
import { QueueStatusCard } from "@/components/ui/dashboard/QueueStatusCard";
import { NotificationSummary } from "@/components/ui/dashboard/NotificationSummary";
import { ActiveServices } from "@/components/ui/dashboard/ActiveServices";
import { Notifications } from "@/components/ui/dashboard/Notifications";
import { DetailedQueueStatus } from "@/components/ui/dashboard/DetailedQueueStatus";
import { JoinQueue } from "@/components/ui/dashboard/JoinQueue";
import { History } from "@/components/ui/dashboard/History";

const navItems = [
  { title: "Home", icon: HouseIcon },
  { title: "Notifications", icon: BellIcon },
  { title: "Join Queue", icon: ListIcon },
  { title: "View Status", icon: ChartLineIcon },
  { title: "History", icon: ClockIcon },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("Home");
  const [notifications, setNotifications] = useState([
    "Queue update: Admissions Office wait time is currently 28 minutes.",
    "Status change: You are waiting in the Admissions Office queue.",
  ]);

  function addNotification(message) {
    setNotifications((current) => [message, ...current]);
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <h2 className="text-lg font-bold">QueueSmart</h2>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isSelected = activePage === item.title;

                  return (
                    <SidebarMenuItem className="flex py-0.5" key={item.title}>
                      <SidebarMenuButton
                        className="flex items-center py-6"
                        tooltip={item.title}
                        isActive={isSelected}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setActivePage(item.title)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="flex items-center py-6"
                tooltip="Logout"
                variant="outline"
                onClick={handleLogout}
              >
                <SignOutIcon />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <section className="min-h-[600px]">
            {activePage === "Home" ? (
              <section className="grid min-h-[650px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 xl:grid-rows-[auto_1fr]">
                <div className="md:col-span-2 xl:col-span-12">
                  <QueueStatusCard />
                </div>

                <div className="md:col-span-1 xl:col-span-7">
                  <NotificationSummary />
                </div>

                <div className="md:col-span-1 xl:col-span-5">
                  <ActiveServices />
                </div> 
              </section> 
            ) : activePage === "Join Queue" ? (
              <JoinQueue onNotify={addNotification} />
            ) : activePage === "View Status" ? (
              <DetailedQueueStatus onNotify={addNotification} />
            ) : activePage === "History" ? ( 
              <History /> 
            ) : activePage === "Notifications" ? (
              <Notifications notifications={notifications} /> 
            ) :  
              <QueueStatusCard />
          }
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
