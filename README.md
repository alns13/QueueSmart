# QueueSmart
COSC 4353 Class Project

## Assignment 3 Checklist:

1. Authentication Module

    User registration

    Login authentication

    Role handling (User vs Administrator)

    Basic input validation

2. Service Management Module

    Create, update, and list services

    Each service should include:

        Service name

        Description

        Expected duration

        Priority level

3. Queue Management Module

    Allow users to:

        Join a queue

        Leave a queue

    Allow administrators to:

        View current queue

        Serve next user

    Queue ordering should consider:

        Arrival order

        Priority (if applicable)

4. Wait-Time Estimation Logic

    Implement basic wait-time estimation

    Can be rule-based (e.g., position × expected duration)

    No advanced algorithms required

5. Notification Module

    Backend logic to trigger notifications when:

        User joins a queue

        User is close to being served

    Notifications may be logged or returned to the front end (no real email/SMS required)

6. History Module

    Track queue participation history for users

    History may be stored in memory or mocked
