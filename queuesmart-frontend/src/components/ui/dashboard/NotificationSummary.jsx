import { BellIcon } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "../badge";

const notificationItems = [
  { id: 1, title: "Queue update", detail: "You moved up to position #15", time: "2m ago", priority: "high" },
  { id: 2, title: "Service alert", detail: "Admissions counter 2 is now open", time: "10m ago", priority: "normal" },
  { id: 3, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" },
  { id: 4, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" },
  { id: 5, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" },
  { id: 6, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" },
  { id: 7, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" },
  { id: 8, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" },
  { id: 9, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" },
  { id: 10, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" },
  { id: 11, title: "Reminder", detail: "Please keep your ID ready", time: "30m ago", priority: "normal" }
];

export function NotificationSummary() {
  const unreadCount = 2;

  return (
    <Card size="lg" className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellIcon size={18} />
          Notifications
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </CardTitle>
        <CardDescription>Recent queue alerts and reminders</CardDescription>
      </CardHeader>

      <CardContent className="max-h-195 space-y-3 overflow-y-auto pr-1 px-4">
        {notificationItems.map((item) => (
          <div
            key={item.id}
            className="rounded-md border border-border p-3 transition-colors hover:bg-muted/40"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{item.title}</p>
              <Badge variant={item.priority === "high" ? "default" : "outline"}>
                {item.priority === "high" ? "Important" : "Info"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{item.detail}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}