## **Problem Statement**

Many organizations (student service centers, clinics, advising offices, help desks) struggle with long queues and poor visibility into wait times. Users often do not know how long they will wait, and staff have limited tools to manage demand efficiently.

Your team will design **QueueSmart**, a web or mobile application that helps:

### Users

- Join a queue or book an appointment
    
- View their position and estimated wait time
    
- Receive notifications when their turn is approaching
    

### Administrators

- Create and manage services
    
- Monitor queues and priorities
    
- Improve overall service efficiency
    

---

## **Application Requirements**

Your QueueSmart application must include the following components:

### **1. Login and Registration**

- Allow users and administrators to register
    
- Basic authentication using username/email and password
    
- Email verification (design only)
    

### **2. User Roles**

- **User:** Join queues, view status, receive notifications
    
- **Administrator:** Create services, manage queues, view usage data
    

### **3. Service Management (Admin)**

Administrators can create services and define:

- Service name and description
    
- Expected service duration
    
- Priority level (low / medium / high)
    

### **4. Queue Management**

- Users can join or leave a queue
    
- Users can view:
    
    - Current position in the queue
        
    - Estimated wait time
        
- Queue ordering is based on arrival time and priority
    

### **5. Notifications**

- Notify users when:
    
    - They are close to being served
        
    - Queue status changes
        
- Notifications may be email or in-app (design choice)
    

### **6. History**

- Track user queue participation history
    
- Administrators can view basic usage statistics
    

> **Note:** Teams may choose to design either a **web application or a mobile application** using any tools or technologies they prefer.

---

## **Questions to Answer**

---

### **1. Initial Thoughts (2 points)**

Discuss your initial thoughts on designing QueueSmart:

- Who are the main users of the system?
    The main users will be any service providing organizations that require placing clients in a queue. Within the organization, there are two types of main users: Administrators and Users. 
    
- How will users and administrators interact with the application?
	Administrators have permission to create, manage, and view the status of the entire queue. Users have permission to book appointments, view their position in the queue, see an estimated wait time, and will recieve notifications when they are next to be processed. 

- What are the most important features?
	Some important features include the actual queueing logic itself, account creation and management, the notification system, user history, user roles, admin roles, and admin servicing management.  
    
- What challenges do you anticipate (e.g., long queues, notifications, inaccurate wait times)?
	A challenge that I'm anticipating is creating user and admin roles priveleges. From a security standpoint, users should obviously not be able to execute any actions exclusive to admins. Another challenge that we expect to face could be dynamically changing user priorities in an active queue, and figuring out how those priority changes would affect the rest of the queue. 

---

### **2. Development Methodology (2 points)**

Discuss the development methodology your team plans to use:

- Which methodology will you follow (e.g., Agile, Scrum, Waterfall)?
    
- Why is this methodology appropriate for this project?
    
- How will this approach help your team work across multiple assignments?
    

---

### **3. High-Level Design / Architecture (6 points)**

Provide a **high-level architecture** of your proposed solution.

Your response must include:

- An architecture diagram
    
- A brief explanation of how the major components interact
    

---

### **Architecture Diagram Requirement**

You must include **at least one architecture diagram** in your submission.

#### **Required Diagram (All Teams)**

You **must** include a **System Context Diagram** that shows:

- The main users of the system (User and Administrator)
    
- The QueueSmart system as a single unit
    
- Any external systems your design depends on (e.g., Email or SMS service)
    

The purpose of this diagram is to clearly define:

- What is inside the system
    
- What is outside the system
    
- How users and external systems interact with QueueSmart
    

> This diagram should be **high-level and simple**.  
> Do **not** include implementation details such as frameworks, programming languages, or APIs.

---

#### **Optional Diagram (Encouraged, Not Required)**

You **may** also include a **Container Diagram** that shows the major internal parts of the system, such as:

- Front-end (Web or Mobile)
    
- Back-end / API
    
- Database
    
- Notification component
    

> If included, keep the container diagram simple.  
> Do not model microservices or low-level components at this stage.

---

### **Diagram Expectations**

- One clear diagram is sufficient to receive full credit
    
- Diagrams must be readable and clearly labeled
    
- The goal is **clarity**, not complexity
    
- There is no single “correct” architecture
    

Avoid:

- Framework-specific diagrams (e.g., React, Spring)
    
- Overly detailed technical diagrams
    
- Copying diagrams from online sources
    

> **If you are unsure which diagram to draw, create a System Context Diagram.  
> This alone is enough to meet the requirements.**

---

## **Team Contribution Requirement (IMPORTANT)**

You must clearly document each team member’s contribution.

> **TAs will verify contributions using GitHub history.**  
> Team members who do not show meaningful contributions will receive a **ZERO**.

| Group Member Name     | What is your contribution? | Discussion Notes |
| --------------------- | -------------------------- | ---------------- |
| 1  Alan Su            |                            |                  |
| 2  Alexander Bustillo |                            |                  |
| 3  SenLiang Deng      |                            |                  |
| 4                     |                            |                  |


