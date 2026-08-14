import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin_dashboard.css";
import { apiRequest } from "@/api/client.js";

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
  GearIcon,
  ChartBarIcon,
  SignOutIcon,
} from "@phosphor-icons/react";

import { logout } from "@/api/auth.js";
import AdminReport from "./Admin_Report.jsx";
import QueueManagement from "./Queue_Management.jsx";
import ServerManagement from "./Server_Management.jsx";

const navItems = [
  { title: "Dashboard", icon: HouseIcon },
  { title: "Queue Management", icon: ListIcon },
  { title: "Service Management", icon: GearIcon },
  { title: "Admin Report", icon: ChartBarIcon },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("Dashboard");

  const [summary, setSummary] = useState({
    currentQueue: 0,
    activeStaff: 0,
    completedToday: 0,
  });
  const [capacityAlerts, setCapacityAlerts] = useState([]);
  const [capacityNotice, setCapacityNotice] = useState("");
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      const [summaryData, capacityData] = await Promise.all([
        apiRequest("/admin/queues/reports/summary"),
        apiRequest("/smart/capacity-alerts"),
      ]);
      setSummary(summaryData);
      setCapacityAlerts(capacityData.alerts || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCapacityAction(alert) {
    setCapacityNotice("");
    setError("");
    try {
      if (alert.action === "reopen" && alert.reopenQueueId) {
        await apiRequest(`/admin/queues/${alert.reopenQueueId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "open" }),
        });
        setCapacityNotice(`${alert.serviceName} lane reopened.`);
      } else if (alert.action === "open") {
        const data = await apiRequest(`/services/${alert.serviceId}/lanes`, { method: "POST" });
        setCapacityNotice(
          data.reopened
            ? `${data.queue.serviceName} Lane ${data.queue.laneNumber} reopened.`
            : `${data.queue.serviceName} Lane ${data.queue.laneNumber} opened. Assign staff to serve that window.`
        );
      }
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <SidebarProvider className="admin-theme">
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
          {activePage === "Dashboard" && (
          <div>
              <div className="Welcome">
                  <h1 className="dashboard_header">Admin Dashboard</h1>
                  <p>Welcome back, administrator!</p>
                  {error && <p className="error_message">{error}</p>}
                  {capacityNotice && <p className="success_message" aria-live="polite">{capacityNotice}</p>}
              </div>
              {capacityAlerts.length > 0 && (
                <div className="servers_stats" style={{ marginBottom: "30px" }}>
                  {capacityAlerts.map((alert) => (
                    <div className="card" key={alert.serviceId}>
                      <div className="title">Capacity suggestion</div>
                      <p className="servers_describe">{alert.message}</p>
                      <div className="divider"></div>
                      {(alert.action === "open" || alert.action === "reopen") && (
                        <button className="servers_button_edit" onClick={() => handleCapacityAction(alert)}>
                          {alert.action === "reopen" ? "Reopen Lane" : "Open Extra Lane"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="stats">
                  <div className="card">
                      <div className="title">Current Queue</div>
                      <div className="number">{summary.currentQueue}</div>
                      <div className="remark">Customers currently waiting</div>
                  </div>
                  <div className="card">
                      <div className="title">Active Staff</div>
                      <div className="number">{summary.activeStaff}</div>
                      <div className="remark">Total number of active staff</div>
                  </div>
                  <div className="card">
                      <div className="title">Completed Today</div>
                      <div className="number">{summary.completedToday}</div>
                      <div className="remark">Number of customers served today</div>
                  </div>
                  
              </div>
          </div>
          )}

          {activePage === "Queue Management" && <QueueManagement />}
          {activePage === "Service Management" && <ServerManagement />}
          {activePage === "Admin Report" && <AdminReport />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}