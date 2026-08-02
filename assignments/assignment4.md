Assignment 4: Data Design & Database Implementation (A4)
QueueSmart – Smart Queue Management Application
Description

In this assignment, your team will design and implement the database layer for the QueueSmart application and connect it to your backend from Assignment 3.

The focus of this assignment is:

    Data modeling

    Database implementation

    Data persistence and retrieval

    Integration with backend APIs

Problem Statement

Same as Assignment 1 (QueueSmart).
Scope of This Assignment

    Implement a real database

    Connect backend APIs to the database

    Persist and retrieve application data

    Update backend logic as needed

You may use any database type, either Relational (RDBMS) or NoSQL.
Database Requirements

Your database must support the core functionality of QueueSmart.
Required Tables / Collections
1. UserCredentials

Stores authentication-related information.

    User ID

    Email (username)

    Encrypted password

    Role (User / Administrator)

    Passwords must be encrypted. Plain-text passwords are not allowed.

2. UserProfile

Stores user-related details.

    Full name

    Email (foreign key or reference)

    Optional contact information

    Preferences (if applicable)

3. Service

Stores services offered by the organization.

    Service ID

    Service name

    Description

    Expected duration

    Priority level

4. Queue

Represents an active queue for a service.

    Queue ID

    Service ID

    Status (open / closed)

    Created date

5. QueueEntry

Tracks users waiting in a queue.

    Queue ID

    User ID

    Position

    Join time

    Status (waiting / served / canceled)

6. Notification / History

Tracks system activity.

    User ID

    Message

    Timestamp

    Status (sent / viewed)

    Note:
    If you choose NoSQL, equivalent collections or embedded documents are acceptable.
    If you choose RDBMS, appropriate relationships and keys are required.

Important Deliverables
1. Validations

Ensure validations are enforced at the backend/database level:

    Required fields

    Field length limits

    Correct data types

    Unique constraints (e.g., email)

2. Data Persistence

    Backend APIs must store data in the database

    Front-end forms must submit data to the backend

    Data must be persisted and retrievable across requests

3. Data Retrieval and Display

    Data retrieved from the database must be displayed in the UI

    Examples:

        Current queue status

        User queue history

        Available services

4. Unit Tests

    Any new backend code added for database integration must be tested

    Update existing tests as needed

    Maintain code coverage ≥ 70–80%
