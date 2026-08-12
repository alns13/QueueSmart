import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../badge";

export function JoinQueue() {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [queueInfo, setQueueInfo] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/services"), apiRequest("/queues/me/active")])
      .then(([serviceData, activeData]) => {
        setServices(serviceData.services);
        setActiveEntry(activeData.entry);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  const selectedService = services.find((service) => service.id === Number(selectedServiceId));

  async function selectService(id) {
    setSelectedServiceId(id);
    setMessage("");
    setRecommendation(null);
    if (!id) {
      setQueueInfo(null);
      return;
    }
    try {
      const [status, rec] = await Promise.all([
        apiRequest(`/queues/${id}/status`),
        apiRequest(`/smart/recommend?serviceId=${id}`),
      ]);
      setQueueInfo(status);
      setRecommendation(rec);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function joinQueue(serviceId = selectedService?.id) {
    if (!serviceId) return setMessage("Please select a service before joining a queue.");
    try {
      const data = await apiRequest(`/queues/${serviceId}/join`, { method: "POST", body: "{}" });
      setActiveEntry(data.entry);
      setMessage(`You joined the ${data.entry.serviceName} queue.`);
      setRecommendation(null);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function leaveQueue() {
    try {
      await apiRequest(`/queues/${activeEntry.serviceId}/leave`, { method: "DELETE" });
      setActiveEntry(null);
      setMessage("You have left the queue.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function switchToRecommended() {
    if (!recommendation?.recommended) return;
    await selectService(String(recommendation.recommended.serviceId));
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Join Queue</CardTitle>
          <CardDescription>Select a service to view wait information and join the queue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {message && <div className="rounded-lg border p-4 text-sm font-medium" aria-live="polite">{message}</div>}
          <select value={selectedServiceId} onChange={(event) => selectService(event.target.value)} className="w-full rounded-lg border bg-background p-3 text-sm">
            <option value="">Choose a service...</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.serviceName}</option>)}
          </select>
          {selectedService && queueInfo && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>{selectedService.serviceName} &emsp;<Badge variant="default">{queueInfo.status === "open" ? "Available" : "Closed"}</Badge></CardTitle>
                <CardDescription>{selectedService.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Estimated Wait</p><p className="text-2xl font-bold">{queueInfo.estimatedWaitTime} min</p></div>
                <div><p className="text-sm text-muted-foreground">Current Queue Length</p><p className="text-2xl font-bold">{queueInfo.queueLength} people</p></div>
              </CardContent>
            </Card>
          )}
          {recommendation?.recommended && !activeEntry && (
            <Card size="sm" className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Smarter option available</CardTitle>
                <CardDescription>{recommendation.message}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <div className="text-sm">
                  <span className="font-semibold">{recommendation.recommended.serviceName}</span>
                  {" · "}
                  {recommendation.recommended.estimatedWaitTime} min
                  {" · "}
                  {recommendation.recommended.queueLength} waiting
                  {recommendation.savingsMinutes > 0 && (
                    <span className="text-muted-foreground"> (save ~{recommendation.savingsMinutes} min)</span>
                  )}
                </div>
                <button type="button" onClick={switchToRecommended}>
                  Switch to shorter queue
                </button>
                <button type="button" onClick={() => joinQueue(recommendation.recommended.serviceId)}>
                  Join shorter queue
                </button>
              </CardContent>
            </Card>
          )}
          {recommendation && !recommendation.recommended && recommendation.message && selectedServiceId && !activeEntry && (
            <p className="text-sm text-muted-foreground" aria-live="polite">{recommendation.message}</p>
          )}
          {!activeEntry && <button type="button" onClick={() => joinQueue()}>Join Queue</button>}
          {activeEntry && <button type="button" onClick={leaveQueue}>Leave Queue</button>}
        </CardContent>
      </Card>
      {activeEntry && (
        <Card>
          <CardHeader><CardTitle>Current Queue &emsp;<Badge variant="default">{activeEntry.status}</Badge></CardTitle><CardDescription>{activeEntry.serviceName}</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">Your Position</p><p className="text-3xl font-bold">{activeEntry.position}</p></div>
            <div><p className="text-sm text-muted-foreground">Estimated Wait</p><p className="text-3xl font-bold">{activeEntry.estimatedWaitTime} min</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
