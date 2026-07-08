import React, { useState } from "react";
import {
  Sidebar,
  SidebarContent,
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
import { HouseIcon, ListIcon, ClockIcon, ChartLineIcon, BellIcon } from "@phosphor-icons/react";

import { QueueStatusCard } from "@/components/ui/dashboard/QueueStatusCard";
import { DetailedQueueStatus } from "@/components/ui/dashboard/DetailedQueueStatus";
import { JoinQueue } from "@/components/ui/dashboard/JoinQueue";
import { History } from "@/components/ui/dashboard/History";
import { Notifications } from "@/components/ui/dashboard/Notifications";

const navItems = [
  { title: "Home", icon: HouseIcon },
  { title: "Notifications", icon: BellIcon },
  { title: "Join Queue", icon: ListIcon },
  { title: "View Status", icon: ChartLineIcon },
  { title: "History", icon: ClockIcon },
];

export default function UserDashboard() {
  const [activePage, setActivePage] = useState("Home");
  const [notifications, setNotifications] = useState([
    "Queue update: Admissions Office wait time is currently 28 minutes.",
    "Status change: You are waiting in the Admissions Office queue.",
  ]);

  function addNotification(message) {
    setNotifications((current) => [message, ...current]);
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
                    <SidebarMenuItem className= "flex py-0.5" key={item.title}>
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
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <section className="min-h-[600px]">
            {activePage === "Join Queue" ? (
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
