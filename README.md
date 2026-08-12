# QueueSmart

COSC 4353 Class Project

---

## Quickstart Guide

QueueSmart is a local web app: React frontend + Express/Prisma backend with SQLite. You need **Node.js** installed. Use two terminals from the repo root.

**1. Backend** (`http://localhost:8000`)

```bash
cd queuesmart-backend
cp .env.example .env
```

Edit `.env` and replace the placeholder values:

- `JWT_SECRET` — any private string, at least 32 characters
- `ADMIN_EMAIL` — a valid email (this is the seeded administrator login)
- `ADMIN_PASSWORD` — at least 12 characters

Then:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

**2. Frontend** (`http://localhost:5173`)

```bash
cd queuesmart-frontend
npm install
npm run dev
```

Open **http://localhost:5173** in a browser. Register a new user for the student dashboard, or log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env` for the administrator dashboard.

---

## Implemented Smart Feature: Alternative Service Recommendation

QueueSmart includes a **smart alternative-service recommendation** that helps users avoid long waits by comparing live queue load across open services.

### What it does

When a user selects a service on the **Join Queue** page, the backend evaluates every **open** service queue using the same wait-time rule used elsewhere in the app:

```
estimatedWaitTime = number of active people in queue × service expected duration
```

It then compares that estimate to other open queues. If another service has a meaningfully shorter wait (by at least 1 minute), the UI surfaces a recommendation with the alternative name, wait time, queue length, and approximate time saved.

Users can:

- **Switch to shorter queue** (updates the service selection and refreshes wait info)
- **Join shorter queue** (joins the recommended service immediately)

If the selected service already has the shortest wait, the user sees a short confirmation instead of an alternative.

### API


| Method | Path                              | Auth     | Description                                       |
| ------ | --------------------------------- | -------- | ------------------------------------------------- |
| `GET`  | `/smart/recommend?serviceId={id}` | User JWT | Recommendation for a specific service selection   |
| `GET`  | `/smart/recommend`                | User JWT | Overall shortest open queue (no selected service) |


Example response when a better option exists:

```json
{
  "selected": {
    "serviceId": 2,
    "serviceName": "Financial Aid",
    "estimatedWaitTime": 30,
    "queueLength": 2,
    "status": "open"
  },
  "recommended": {
    "serviceId": 1,
    "serviceName": "Admissions",
    "estimatedWaitTime": 10,
    "queueLength": 1,
    "status": "open"
  },
  "savingsMinutes": 20,
  "message": "Admissions has a shorter wait (10 min vs 30 min). You could save about 20 minutes."
}
```

