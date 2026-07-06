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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { HouseIcon, ListIcon, ClockIcon, ChartLineIcon } from "@phosphor-icons/react"

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
              <div className="p-6">
                <h1>User Dashboard</h1>
              </div>
            </SidebarInset>
          </SidebarProvider>
    )
}


