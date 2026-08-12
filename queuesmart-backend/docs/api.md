# Endpoints

### Auth

POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

### Profile

GET    /profile/me
PATCH  /profile/me

### Smart feature

GET    /smart/recommend
GET    /smart/recommend?serviceId=:serviceId

### Services

GET    /services
GET    /services/:serviceId
POST   /services
PATCH  /services/:serviceId
DELETE /services/:serviceId
PATCH  /services/:serviceId/status

### Queue (user)

POST   /queues/:serviceId/join
DELETE /queues/:serviceId/leave
GET    /queues/me/active
GET    /queues/:serviceId/status
GET    /queues/:serviceId/entries/me
GET    /queues/:serviceId/estimate          

### Queue (admin)

GET    /admin/queues
GET    /admin/queues/:serviceId
POST   /admin/queues/:serviceId/serve-next
DELETE /admin/queues/:serviceId/entries/:entryId
PATCH  /admin/queues/:serviceId/entries/:entryId/move

### Notifications

GET    /notifications
GET    /notifications/summary
PATCH  /notifications/:notificationId/read
PATCH  /notifications/read-all

### History / reporting

GET    /history/me
GET    /history/me/summary
GET    /admin/queues/reports/summary
GET    /admin/queues/reports/customers?page=:page
GET    /admin/queues/reports/customers/:userId/history
GET    /admin/queues/reports/services
GET    /admin/queues/reports/queue-usage
GET    /admin/queues/reports/queue-usage.csv

The queue usage CSV is generated on demand, requires an administrator JWT, and
downloads all current per-service queue usage statistics.

# Mapping



### Login / Register

/auth/login, /auth/register

### User dashboard overview

/queues/me/active, /notifications/summary, /services

### Join Queue

/services, /queues/:id/status, /queues/:id/join, /queues/:id/leave

### View Status

/queues/me/active

### History

/history/me, /history/me/summary

### Notifications tab

/notifications

### Admin dashboard

/admin/stats

### Service Management

/services CRUD + /services/:id/status

### Queue Management

/admin/queues/:id, serve-next, move/remove

### Admin Report

/admin/queues/reports/summary, /admin/queues/reports/customers,
/admin/queues/reports/services, /admin/queues/reports/queue-usage,
/admin/queues/reports/queue-usage.csv

# Build Priority List

**this is just my opinion, we can discuss and change this later if needed**

1. Auth (register, login, me)
2. Services (GET, POST, PATCH)
3. Queue user flow (join, leave, me/active)
4. Queue admin flow (GET, serve-next)
5. Notifications (summary, list)
6. History + admin stats

