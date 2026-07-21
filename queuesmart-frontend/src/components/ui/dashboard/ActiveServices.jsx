import { useEffect, useState } from "react";
import { ClockIcon } from "@phosphor-icons/react";
import { apiRequest } from "@/api/client.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../badge";

export function ActiveServices() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    apiRequest("/services").then(async ({ services: items }) => {
      const statuses = await Promise.all(items.map((service) => apiRequest(`/queues/${service.id}/status`)));
      setServices(items.map((service, index) => ({ ...service, ...statuses[index] })));
    }).catch(() => {});
  }, []);

  return (
    <Card size="lg" className="h-full">
      <CardHeader><CardTitle>Active Services Available</CardTitle><CardDescription>Live queue information</CardDescription></CardHeader>
      <CardContent className="max-h-195 space-y-3 overflow-y-auto pr-1">
        {services.map((service) => <div key={service.id} className="rounded-md border p-3"><div className="flex justify-between"><p className="text-sm font-semibold">{service.serviceName}</p><Badge variant="secondary">Open</Badge></div><div className="mt-2 flex justify-between text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><ClockIcon size={14} />{service.estimatedWaitTime} min</span><span>{service.queueLength} waiting</span></div></div>)}
      </CardContent>
    </Card>
  );
}
