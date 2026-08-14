import { useEffect, useState } from "react";
import { TrashIcon, XIcon } from "@phosphor-icons/react";
import { apiRequest } from "@/api/client.js";
import { Button } from "@/components/ui/button";

const deleteIconClassName =
  "shrink-0 text-muted-foreground transition-all hover:bg-transparent hover:text-red-500 hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]";

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/notifications")
      .then((data) => setNotifications(data.notifications))
      .catch((requestError) => setError(requestError.message));
  }, []);

  async function deleteNotification(notificationId) {
    try {
      await apiRequest(`/notifications/${notificationId}`, { method: "DELETE" });
      setNotifications((current) => current.filter((item) => item.id !== notificationId));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function clearNotifications() {
    try {
      await apiRequest("/notifications", { method: "DELETE" });
      setNotifications([]);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 text-center">
      <div className="relative flex items-center justify-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear all notifications"
          className={`absolute right-0 ${deleteIconClassName}`}
          disabled={!notifications.length}
          onClick={clearNotifications}
        >
          <TrashIcon />
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      {notifications.map((item) => (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4 text-sm" key={item.id}>
          <p className="min-w-0 flex-1 text-center">{item.message}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Delete notification"
            className={deleteIconClassName}
            onClick={() => deleteNotification(item.id)}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      {!error && !notifications.length && <p>No notifications yet.</p>}
    </div>
  );
}
