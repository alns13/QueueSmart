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

## Implemented Smart Feature: Same-Service Lane Recommendations

QueueSmart’s smart feature keeps customers on the **correct service** while helping staff add capacity when waits get long.

### How it works

Each **service** (for example Technical Support) can have up to **three lanes** (windows). Customers pick a service; new joins go to the **shortest open lane**. The smart UI only recommends switching to another **lane of that same service**, never to an unrelated desk like General Inquiry.

Admins set a per-service **lane wait threshold** (minutes) when creating or editing a service. When the last person’s wait on the shortest open lane reaches that threshold, admins get a **capacity notification** and a dashboard card to open or reopen another lane.

Wait estimate:

```
estimatedWaitTime = active people in that lane × service expected duration
lastPersonWait = waiting people in that lane × service expected duration
```

### User experience

- Join Queue lists services (not individual lanes)
- Optional “Faster Lane Available” when a sibling lane is meaningfully shorter
- Status shows service name and lane number

### Admin experience

- Service create/edit: **Open extra lane when wait reaches (minutes)**
- Service cards: Open Extra Lane / Close Lanes
- Queue Management: one tab per lane (`Technical Support · Lane 1`)
- Dashboard: capacity suggestion cards with one-click open/reopen

### API

| Method | Path                              | Auth     | Description                            |
| ------ | --------------------------------- | -------- | -------------------------------------- |
| `GET`  | `/smart/recommend?serviceId={id}` | User JWT | Same-service lane recommendation       |
| `GET`  | `/smart/capacity-alerts`          | Admin    | Services that need another lane        |
| `POST` | `/services/:id/lanes`             | Admin    | Open a new lane or reopen a closed one |

Example response when a better lane exists:

```json
{
  "selected": {
    "serviceId": 3,
    "serviceName": "Technical Support",
    "queueId": 3,
    "laneNumber": 1,
    "estimatedWaitTime": 70,
    "queueLength": 7,
    "status": "open"
  },
  "recommended": {
    "serviceId": 3,
    "serviceName": "Technical Support",
    "queueId": 8,
    "laneNumber": 2,
    "estimatedWaitTime": 10,
    "queueLength": 1,
    "status": "open"
  },
  "savingsMinutes": 60,
  "message": "Technical Support Lane 2 has a shorter wait (10 min vs 70 min). You could save about 60 minutes."
}
```
