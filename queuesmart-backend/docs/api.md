# Endpoints

### Auth

POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me
POST   /auth/change-password

### Profile

GET    /profile/me
PATCH  /profile/me

### Smart feature

GET    /smart/recommend
GET    /smart/recommend?serviceId=:serviceId
GET    /smart/recommend?serviceId=:serviceId&queueId=:queueId
GET    /smart/capacity-alerts

### Services

GET    /services
POST   /services
PATCH  /services/:serviceId
POST   /services/:serviceId/lanes
POST   /services/:serviceId/retire

### Queue (user)

POST   /queues/:serviceId/join
DELETE /queues/:serviceId/leave
GET    /queues/me/active
GET    /queues/:serviceId/status
GET    /queues/:serviceId/entries/me
GET    /queues/:serviceId/estimate

### Queue (admin)

GET    /admin/queues
GET    /admin/queues/:queueId
PATCH  /admin/queues/:queueId/status
POST   /admin/queues/:queueId/serve-next
POST   /admin/queues/:queueId/complete-current
DELETE /admin/queues/:queueId/entries/:entryId
PATCH  /admin/queues/:queueId/entries/:entryId/move

### Notifications

GET    /notifications
GET    /notifications/summary
PATCH  /notifications/:notificationId/read
PATCH  /notifications/read-all
DELETE /notifications
DELETE /notifications/:notificationId

### History / reporting

GET    /history/me
GET    /history/me/summary
GET    /admin/history
GET    /admin/stats

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

### Profile

/profile/me, /auth/change-password

### Notifications tab

/notifications

### Admin dashboard

/admin/stats

### Service Management

/services CRUD + lanes + retire (archive)

### Queue Management

/admin/queues by queueId (lanes), serve-next, move/remove

### Admin Report

/admin/stats

# Build Priority List

**this is just my opinion, we can discuss and change this later if needed**

1. Auth (register, login, me)
2. Services (GET, POST, PATCH)
3. Queue user flow (join, leave, me/active)
4. Queue admin flow (GET, serve-next)
5. Notifications (summary, list)
6. History + admin stats

