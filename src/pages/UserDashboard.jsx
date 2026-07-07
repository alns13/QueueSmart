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
import { HouseIcon, ListIcon, ClockIcon, ChartLineIcon } from "@phosphor-icons/react";

import { QueueStatusCard } from "@/components/ui/dashboard/QueueStatusCard";
import { DetailedQueueStatus } from "@/components/ui/dashboard/DetailedQueueStatus";
import { JoinQueue } from "@/components/ui/dashboard/JoinQueue";

const navItems = [
  { title: "Home", icon: HouseIcon },
  { title: "Join Queue", icon: ListIcon },
  { title: "View Status", icon: ChartLineIcon },
  { title: "History", icon: ClockIcon },
];

export default function UserDashboard() {
  const [activePage, setActivePage] = useState("Home");

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
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => setActivePage(item.title)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <section className="min-h-[600px]">
            {activePage === "Join Queue" ? (
              <JoinQueue />
            ) : activePage === "View Status" ? (
              <DetailedQueueStatus />
            ) : (
              <QueueStatusCard />
            )}
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}