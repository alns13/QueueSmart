import React, { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "../badge";

const services = [
  {
    id: 1,
    name: "Admissions Office",
    description: "Get help with applications, transcripts, and enrollment questions.",
    estimatedWait: 28,
    queueLength: 15,
  },
  {
    id: 2,
    name: "Financial Aid",
    description: "Ask questions about FAFSA, scholarships, tuition, and payments.",
    estimatedWait: 18,
    queueLength: 9,
  },
  {
    id: 3,
    name: "Academic Advising",
    description: "Meet with an advisor about classes, degree plans, and registration.",
    estimatedWait: 35,
    queueLength: 21,
  },
];

export function JoinQueue() {
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [joinedService, setJoinedService] = useState(null);
  const [message, setMessage] = useState("");

  const selectedService = services.find(
    (service) => service.id === Number(selectedServiceId)
  );

  function handleJoinQueue() {
    if (!selectedService) {
      setMessage("Please select a service before joining a queue.");
      return;
    }

    setJoinedService(selectedService);
    setMessage(`You joined the ${selectedService.name} queue.`);
  }

  function handleLeaveQueue() {
    setJoinedService(null);
    setSelectedServiceId("");
    setMessage("You have left the queue.");
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Join Queue</CardTitle>
          <CardDescription>
            Select a service to view wait information and join the queue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {message && (
            <div className="rounded-lg border p-4 text-sm font-medium">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Select Service
            </label>

            <select
              value={selectedServiceId}
              onChange={(event) => {
                setSelectedServiceId(event.target.value);
                setMessage("");
              }}
              className="w-full rounded-lg border bg-background p-3 text-sm"
            >
              <option value="">Choose a service...</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>
                  {selectedService.name} &emsp;
                  <Badge variant="default">Available</Badge>
                </CardTitle>
                <CardDescription>{selectedService.description}</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Estimated Wait
                  </p>
                  <p className="text-2xl font-bold">
                    {selectedService.estimatedWait} min
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Queue Length
                  </p>
                  <p className="text-2xl font-bold">
                    {selectedService.queueLength} people
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={handleJoinQueue}>
              Join Queue
            </button>

            {joinedService && (
              <button type="button" onClick={handleLeaveQueue}>
                Leave Queue
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {joinedService && (
        <Card>
          <CardHeader>
            <CardTitle>
              Current Queue &emsp;
              <Badge variant="default">Joined</Badge>
            </CardTitle>
            <CardDescription>
              You are currently waiting for {joinedService.name}.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Your Position
              </p>
              <p className="text-3xl font-bold">
                {joinedService.queueLength + 1}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Estimated Wait
              </p>
              <p className="text-3xl font-bold">
                {joinedService.estimatedWait} min
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}