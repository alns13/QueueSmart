import { useEffect, useState } from "react";
import { BellIcon } from "@phosphor-icons/react";
import { apiRequest } from "@/api/client.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../badge";

export function NotificationSummary() {
  const [summary, setSummary] = useState({ notifications: [], unreadCount: 0 });

  useEffect(() => {
    apiRequest("/notifications/summary").then(setSummary).catch(() => {});
  }, []);

  return (
    <Card size="lg" className="h-full">
      <CardHeader><CardTitle className="flex items-center gap-2"><BellIcon size={18} />Notifications<Badge variant="secondary">{summary.unreadCount} unread</Badge></CardTitle><CardDescription>Recent queue alerts</CardDescription></CardHeader>
      <CardContent className="max-h-195 space-y-3 overflow-y-auto px-4 pr-1">
        {summary.notifications.map((item) => <div key={item.id} className="rounded-md border p-3"><p className="text-sm font-semibold">{item.type === "status" ? "Status change" : "Queue update"}</p><p className="text-sm text-muted-foreground">{item.message}</p></div>)}
        {!summary.notifications.length && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
      </CardContent>
    </Card>
  );
}
