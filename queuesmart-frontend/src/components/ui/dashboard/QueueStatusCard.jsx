import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "../badge"

  const position = 15
  const totalAhead = 14
  const totalQueueSize = 20
  const avgTimePerPerson = 2
  const progress = Math.round(((totalQueueSize - position) / totalQueueSize) * 100)
  const estimatedWaitTime = totalAhead * avgTimePerPerson

  export function QueueStatusCard() {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            Your Queue Status &emsp;
            <Badge variant="default">Waiting</Badge>
          </CardTitle>
          <CardDescription className="bold">Admissions Office</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Your Position</p>
            <p className="text-2xl font-bold">{position}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Estimated wait time</p>
            <p className="text-lg font-semibold">{estimatedWaitTime} minutes</p>
          </div>
    <Progress value={progress} className="[&_[data-slot=progress-track]]:h-4" />
  </CardContent>
      </Card>
    )
  }