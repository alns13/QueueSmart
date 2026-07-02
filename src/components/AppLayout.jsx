import React from "react";
import { Bell, ClipboardList, History, LayoutDashboard, LogOut, Settings, UsersRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const userLinks = [
  { to: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/user/join-queue", label: "Join Queue", icon: ClipboardList },
  { to: "/user/queue-status", label: "Queue Status", icon: UsersRound },
  { to: "/user/history", label: "History", icon: History },
  { to: "/notifications", label: "Notifications", icon: Bell }
];

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/services", label: "Services", icon: Settings },
  { to: "/admin/queues", label: "Queues", icon: UsersRound },
  { to: "/notifications", label: "Notifications", icon: Bell }
];

export default function AppLayout({ role }) {
  const navigate = useNavigate();
  const links = role === "admin" ? adminLinks : userLinks;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">QueueSmart</div>
        <nav className="nav-list">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <strong>{role === "admin" ? "Administrator" : "User"} Workspace</strong>
            <p>Initial platform pages with mock front-end data.</p>
          </div>
          <div className="toolbar">
            <button className="icon-action" onClick={() => navigate("/login")} aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <section className="page-wrap">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
