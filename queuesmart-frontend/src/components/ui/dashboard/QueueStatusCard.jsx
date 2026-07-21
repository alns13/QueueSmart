import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "../badge";

export function QueueStatusCard() {
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    apiRequest("/queues/me/active").then((data) => setEntry(data.entry)).catch(() => {});
  }, []);

  if (!entry) return <Card><CardHeader><CardTitle>Your Queue Status</CardTitle><CardDescription>You are not currently in a queue.</CardDescription></CardHeader></Card>;
  const progress = entry.totalQueueSize ? Math.round(((entry.totalQueueSize - entry.position + 1) / entry.totalQueueSize) * 100) : 0;
  return (
    <Card className="w-full">
      <CardHeader><CardTitle>Your Queue Status &emsp;<Badge variant="default">{entry.status}</Badge></CardTitle><CardDescription>{entry.serviceName}</CardDescription></CardHeader>
      <CardContent className="space-y-4"><div><p className="text-sm text-muted-foreground">Your Position</p><p className="text-2xl font-bold">{entry.position}</p></div><div><p className="text-sm text-muted-foreground">Estimated wait time</p><p className="text-lg font-semibold">{entry.estimatedWaitTime} minutes</p></div><Progress value={progress} /></CardContent>
    </Card>
  );
}
