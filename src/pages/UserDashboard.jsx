import React from "react";
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
} from "@/components/ui/sidebar"
import { HouseIcon, ListIcon, ClockIcon, ChartLineIcon } from "@phosphor-icons/react"

import { QueueStatusCard } from "@/components/ui/dashboard/QueueStatusCard";

const navItems = [
  { title: "Home", icon: HouseIcon },
  { title: "Join Queue", icon: ListIcon },
  { title: "View Status", icon: ChartLineIcon },
  { title: "History", icon: ClockIcon },
]

export default function UserDashboard() {
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
                          <SidebarMenuButton tooltip={item.title}>
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
                <section className="grid min-h-[600px] grid-cols-2 grid-rows-2 gap-4">
                  <QueueStatusCard />
                </section>
              </div>
            </SidebarInset>
          </SidebarProvider>
    )
}


