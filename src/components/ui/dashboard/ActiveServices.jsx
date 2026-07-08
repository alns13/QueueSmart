import { ClockIcon } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "../badge";

const services = [
  { id: 1, name: "Admissions", wait: "15 min", slots: "2 counters", status: "Open" },
  { id: 2, name: "Document Verification", wait: "8 min", slots: "1 counter", status: "Open" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
  { id: 3, name: "Payment Support", wait: "20 min", slots: "1 counter", status: "Busy" },
];

export function ActiveServices() {
  return (
    <Card size="lg" className="h-full">
      <CardHeader>
        <CardTitle>Active Services Available</CardTitle>
        <CardDescription>Wed, Jul 08 2026</CardDescription>
      </CardHeader>
      <CardContent className="max-h-195 space-y-3 overflow-y-auto pr-1">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-md border border-border p-3 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{service.name}</p>
              <Badge variant={service.status === "Open" ? "secondary" : "outline"}>
                {service.status}
              </Badge>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ClockIcon size={14} />
                {service.wait}
              </span>
              <span>{service.slots}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}