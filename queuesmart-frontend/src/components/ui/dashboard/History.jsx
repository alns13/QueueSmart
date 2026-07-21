import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../badge";

export function History() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, served: 0, left: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/history/me"), apiRequest("/history/me/summary")])
      .then(([historyData, summaryData]) => { setItems(historyData.history); setSummary(summaryData); })
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader><CardTitle>Queue History</CardTitle><CardDescription>Your previous QueueSmart visits.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card size="sm"><CardHeader><CardTitle>Total Visits</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{summary.total}</p></CardContent></Card>
          <Card size="sm"><CardHeader><CardTitle>Completed</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{summary.served}</p></CardContent></Card>
          <Card size="sm"><CardHeader><CardTitle>Left Queue</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{summary.left}</p></CardContent></Card>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Past Queues</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {error && <p role="alert">{error}</p>}
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4"><div><p className="font-semibold">{item.serviceName}</p><p className="text-sm text-muted-foreground">{new Date(item.joinedAt).toLocaleString()}</p></div><Badge variant="default">{item.outcome}</Badge></div>
            </div>
          ))}
          {!error && !items.length && <p>No queue history yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
