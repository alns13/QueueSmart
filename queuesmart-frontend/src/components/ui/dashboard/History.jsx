import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "../badge";

const historyItems = [
  {
    id: 1,
    service: "Admissions Office",
    date: "July 8, 2026",
    waitTime: "28 min",
    outcome: "Served",
    notes: "Completed visit for enrollment questions.",
  },
  {
    id: 2,
    service: "Financial Aid",
    date: "July 5, 2026",
    waitTime: "18 min",
    outcome: "Left Queue",
    notes: "User left the queue before being served.",
  },
  {
    id: 3,
    service: "Academic Advising",
    date: "July 1, 2026",
    waitTime: "35 min",
    outcome: "Served",
    notes: "Completed advising appointment for course planning.",
  },
];

export function History() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Queue History</CardTitle>
          <CardDescription>
            View previous queues you joined, including service names, wait times, and outcomes.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Total Visits</CardTitle>
              <CardDescription>Queues joined</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{historyItems.length}</p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Successfully served</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">2</p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Left Queue</CardTitle>
              <CardDescription>Exited before service</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">1</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Queues</CardTitle>
          <CardDescription>
            A list of services you previously joined through QueueSmart.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {historyItems.map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.service}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>

                <Badge variant="default">{item.outcome}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="font-medium text-muted-foreground">Estimated Wait</p>
                  <p>{item.waitTime}</p>
                </div>

                <div>
                  <p className="font-medium text-muted-foreground">Notes</p>
                  <p>{item.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}