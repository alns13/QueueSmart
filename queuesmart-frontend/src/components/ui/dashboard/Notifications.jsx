import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/notifications").then((data) => setNotifications(data.notifications)).catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {error && <p role="alert">{error}</p>}
      {notifications.map((item) => <div className="rounded-lg border bg-card p-4 text-sm" key={item.id}>{item.message}</div>)}
      {!error && !notifications.length && <p>No notifications yet.</p>}
    </div>
  );
}
