export const services = [
  {
    id: "advising",
    name: "Academic Advising",
    description: "Course planning, registration, and degree audit support.",
    duration: 10,
    priority: "High",
    status: "Open",
    queueLength: 8
  },
  {
    id: "financial-aid",
    name: "Financial Aid",
    description: "FAFSA, scholarships, payment questions, and account holds.",
    duration: 15,
    priority: "Medium",
    status: "Open",
    queueLength: 5
  },
  {
    id: "it-help",
    name: "IT Help Desk",
    description: "Login problems, devices, software access, and classroom tech.",
    duration: 7,
    priority: "Low",
    status: "Closed",
    queueLength: 2
  }
];

export const queueUsers = [
  { id: 1, name: "Maya Chen", status: "Almost ready" },
  { id: 2, name: "Jordan Ellis", status: "Waiting" },
  { id: 3, name: "You", status: "Waiting" },
  { id: 4, name: "Nora Patel", status: "Waiting" }
];

export const historyItems = [
  { id: 1, date: "2026-06-25", service: "IT Help Desk", outcome: "Served" },
  { id: 2, date: "2026-06-18", service: "Academic Advising", outcome: "Served" },
  { id: 3, date: "2026-06-03", service: "Financial Aid", outcome: "Left queue" }
];

export const notifications = [
  "You are currently 3rd in line for Academic Advising.",
  "Financial Aid queue is open and accepting visitors.",
  "Your estimated wait time changed to 20 minutes."
];
