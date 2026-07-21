import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";
import { Badge } from "../badge";

export function DetailedQueueStatus() {

const [queueData, setQueueData] = useState(null);
const [error, setError] = useState("");

useEffect(() => {
  apiRequest("/queues/me/active")
    .then((data) => data.entry ? setQueueData(data.entry) : setError("You are not currently in a queue."))
    .catch((requestError) => setError(requestError.message));
}, []);

  if (error) {
    return <p>{error}</p>;
  }

  if (!queueData) {
    return <p>Loading...</p>;
  }

  const {
    serviceName,
    position,
    peopleAhead,
    totalQueueSize,
    expectedDuration,
    estimatedWaitTime,
    status,
  } = queueData;

  const progress =
    totalQueueSize > 0
      ? Math.round(
          ((totalQueueSize - position) / totalQueueSize) * 100
        )
      : 0;


  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Queue Status &emsp;
            <Badge variant="default">{status}</Badge>
          </CardTitle>
          <CardDescription>
            Detailed information about your current place in line.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Service</p>
            <p className="text-xl font-semibold">{serviceName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Your Position</CardTitle>
                <CardDescription>Current place in queue</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{position}</p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>People Ahead</CardTitle>
                <CardDescription>Users waiting before you</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{peopleAhead}</p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Estimated Wait</CardTitle>
                <CardDescription>Based on average service time</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{estimatedWaitTime} min</p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Total Queue Size</CardTitle>
                <CardDescription>Total users in this queue</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalQueueSize}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Queue Progress
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                {progress}%
              </p>
            </div>
            <Progress
              value={progress}
              className="[&_[data-slot=progress-track]]:h-4"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Updates</CardTitle>
          <CardDescription>
            Recent updates about your queue status.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
            <div className="rounded-lg border p-4">
                <div className="mb-1 flex items-center gap-2">
                    <Badge variant="default">Joined</Badge>
                    <p className="text-sm font-medium">You joined the {serviceName} queue.</p>
                </div>
                <p className="text-sm text-muted-foreground">
                Your place in line has been reserved.
                </p>
                </div>

                <div className="rounded-lg border p-4">
                    <div className="mb-1 flex items-center gap-2">
                        <Badge variant="default">Waiting</Badge>
                        <p className="text-sm font-medium">
                        There are currently {peopleAhead} people ahead of you.
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                    Please stay nearby while you wait for your turn.
                    </p>
                </div>

                <div className="rounded-lg border p-4">
                <div className="mb-1 flex items-center gap-2">
                    <Badge variant="default">Estimate</Badge>
                    <p className="text-sm font-medium">
                    Your estimated wait time is {estimatedWaitTime} minutes.
                    </p>
                </div>
                <p className="text-sm text-muted-foreground">
                    This estimate is based on an average service time of {expectedDuration} minutes per person.
                </p>
                </div>

                <div className="rounded-lg border p-4">
                    <div className="mb-1 flex items-center gap-2">
                        <Badge variant="default">Notification</Badge>
                        <p className="text-sm font-medium">
                        You will be notified when you are almost ready.
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        QueueSmart will update your status as your turn gets closer.
                    </p>
                    </div>
                </CardContent>
                </Card>
                </div>
            );
            }
