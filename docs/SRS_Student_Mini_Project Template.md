# **SOFTWARE REQUIREMENTS SPECIFICATION (SRS)** 

_Student Mini Project_ 

|**Project Title**|Commercial Parking Operations System|
|---|---|
|**Document Version**|1.0 Draft|
|**Team Members**|Dawood Abdul Basith J – 24BCS054<br>Kaphin Raj Velu G K – 24BCS121<br>Priyadharshan R – 24BCS417|
|**Date of Release**|03/08/2026|
|**Team No**|18|



### **1. Introduction** 

#### **1.1 Purpose** 

The purpose of this Software Requirements Specification (SRS) is to define the functional and nonfunctional requirements of the **Commercial Parking Operations System (CPOS)** . This document serves as a reference for developers, testers, project evaluators, and future maintenance teams. The system aims to simplify commercial parking operations through online reservations, QR-based entry/exit, digital payments, and real-time parking management without using dedicated parking hardware. 

#### **1.2 Document Conventions** 

- **Functional requirements** are numbered sequentially (e.g., FR-1, FR-2). 

- Requirements use the phrase **"The system shall..."** . 

- Requirement priorities are classified as **High, Medium, and Low** . 

- Standard software engineering and UML terminology is used throughout the document. 

#### **1.3 Intended Audience and Reading Suggestions** 

|**Audience**|**Relevant Sections**|
|---|---|
|Project Manager|Introduction, Overall Description|
|Developers|System Features, Interfaces|
|Testers|Functional & Non-Functional Requirements|
|Database Designers|System Features, ER Diagram|
|Evaluators|Entire Document|



#### **1.4 Product Scope** 

The Commercial Parking Operations System is a web-based application that enables customers to reserve parking slots online, make payments, receive QR verification, and manage bookings. Parking operators can verify vehicle entry and exit, managers can monitor parking operations and revenue, and administrators can manage users, parking locations, and system settings. The system is completely software-based and **does not** depend on IoT sensors, RFID, or ANPR cameras. 

#### **1.5 References** 

- IEEE Software Requirements Specification (IEEE 830) 

- UML 2.x Standards 

- Software Engineering – Ian Sommerville 

- React.js Documentation 

- Node.js Documentation 

- Express.js Documentation 

- MySQL Documentation 

- JWT Authentication Documentation 

- API Documentation 

### **2. Overall Description** 

#### **2.1 Product Perspective** 

The **Commercial Parking Operations System (CPOS)** is a standalone, web-based parking management system designed for commercial parking facilities. It replaces traditional manual parking operations with a fully software-driven solution. The system manages parking reservations, slot allocation, QR verification, payments, and reports **without** relying on dedicated hardware such as IoT sensors, RFID, or ANPR cameras. 

#### **2.2 Product Functions** 

The system provides the following major functions: 

- User Registration and Login 

- Online Parking Slot Reservation 

- Slot Allocation 

- QR Code Generation 

- Vehicle Entry and Exit Management 

- Walk-in Parking Management 

- Real-Time Parking Slot Status 

- Virtual Queue Management 

- Dynamic Pricing 

- Monthly and Corporate Pass Management 

- Digital Wallet Management 

- Customer Feedback and Loyalty Management 

- Violation and Penalty Management 

- Online Payment and Invoice Generation 

- Reports and Analytics Dashboard 

- User and Role Management 

#### **2.3 User Classes and Characteristics** 

|**User**|**Description**|
|---|---|
|Customer|Books parking slots, makes payments, views booking history, downloads invoices,<br>and manages reservations.|
|Parking Operator|Verifies QR/OTP, manages vehicle entry/exit, updates parking slot status, and<br>assists customers.|
|Branch Manager|Manages parking layouts, pricing, reservations, operators, and monitors reports.|
|Super<br>Administrator|Manages users, branches, roles, permissions, system settings, and overall platform<br>administration.|



#### **2.4 Operating Environment** 

|**Component**|**Technology**|
|---|---|
|**Frontend**|HTML5, TailwindCSS, JavaScript, React.js|
|**Backend**|Node.js, Express.js|
|**Database**|RDBMS - MySQL|
|**Operating System**|Windows|
|**Browser**|Google Chrome, Microsoft Edge, Mozilla Firefox|
|**APIs**|REST API, GraphQL, Payment Gateway API, QR Code Library|
|**PDF Generation**|PDFKit (Node.js) or jsPDF|
|**Invoice Export**|PDFKit|
|**Report Export**|PDFKit|
|**PDF Viewer**|Browser Built-in PDF Viewer|



#### **2.5 Design and Implementation Constraints** 

- The system shall be completely software-based. 

- **No** IoT sensors, RFID, ANPR cameras, or automated barriers shall be used. 

- Internet connectivity is required. 

- Access shall be **role-based using secure** authentication. 

- The system shall support multiple parking branches. 

#### **2.6 Assumptions and Dependencies** 

   - Users have internet access. 

   - Payment gateway services are available. 

   - Browser camera permission is granted for QR scanning. 

   - Administrators configure parking layouts before reservations begin. 

   - Email services are available for notifications. 

**3. System Features (Specific Requirements)** 

#### **3.1 User Authentication Module** 

**Priority:** High 

#### **Description:** 

This module allows users to securely register, log in, and access the system according to their assigned roles. 

#### **Inputs:** 

- Name 

- Email 

- Mobile Number 

- Password 

- Confirm Password 

- User Role 

#### **Outputs:** 

- User Account 

- Login Confirmation 

- Dashboard Access 

#### **Functional Requirements** 

**FR-3.1.1:** The system shall allow users to register using a valid email address. 

**FR-3.1.2:** The system shall validate password strength before account creation. 

**FR-3.1.3:** The system shall authenticate users using email and password. 

**FR-3.1.4:** The system shall redirect users to their respective dashboards based on their roles. 

**FR-3.1.5:** The system shall allow users to reset forgotten passwords. 

#### **3.2 Parking Reservation Module** 

**Priority:** High 

#### **Description:** 

Customers can search available parking lots, select a parking slot, choose the reservation time, and confirm the booking. 

#### **Inputs:** 

- Parking Location 

- Date 

- Time 

- Vehicle Details 

#### **Outputs:** 

- Reservation Confirmation 

- Booking ID 

#### **Functional Requirements** 

**FR-3.2.1:** The system shall display available parking lots. 

**FR-3.2.2:** The system shall allow customers to reserve available parking slots. 

**FR-3.2.3:** The system shall prevent double booking of parking slots. 

**FR-3.2.4:** The system shall generate a unique booking reference. 

#### **3.3 QR Code & Entry Management** 

**Priority:** High 

#### **Description:** 

After successful booking, the system generates a **QR** code or OTP for parking entry. Parking operators verify the QR code or OTP during vehicle entry and exit. 

#### **Inputs:** 

- Booking ID 

- QR Code / OTP 

#### **Outputs:** 

- Entry Confirmation 

- Exit Confirmation 

#### **Functional Requirements** 

**FR-3.3.1:** The system shall generate a unique QR code or OTP after successful payment. 

**FR-3.3.2:** The system shall verify QR codes during vehicle entry. 

**FR-3.3.3:** The system shall update the parking slot status to **Occupied** after successful entry. 

**FR-3.3.4:** The system shall update the parking slot status to **Available** after vehicle exit. 

#### **3.4 Payment & Invoice Module** 

**Priority:** High 

#### **Description:** 

This module allows customers to pay parking fees securely and automatically generates invoices. 

#### **Inputs:** 

- Booking ID 

- Payment Method 

#### **Outputs:** 

- Payment Confirmation 

- Digital Invoice 

#### **Functional Requirements** 

**FR-3.4.1:** The system shall process online payments. 

**FR-3.4.2:** The system shall generate a digital invoice after successful payment. 

**FR-3.4.3:** The system shall maintain payment history. 

#### **3.5 Parking Management Module** 

**Priority:** High 

#### **Description:** 

Managers can create parking layouts, manage parking slots, monitor occupancy, and configure pricing. 

#### **Functional Requirements** 

**FR-3.5.1:** The system shall allow managers to add, edit, and remove parking slots. 

**FR-3.5.2:** The system shall display real-time parking occupancy. 

**FR-3.5.3:** The system shall allow managers to configure parking prices. 

**FR-3.5.4:** The system shall generate parking utilization reports. 

#### **3.6 Virtual Queue Management Module** 

**Priority:** High 

#### **Description:** 

This module manages a virtual waiting queue when all parking slots are occupied. Customers are notified automatically when a parking slot becomes available. 

#### **Inputs:** 

- Customer ID 

- Parking Lot 

- Queue Request 

#### **Outputs:** 

- Queue Position 

- Slot Availability Notification 

#### **Functional Requirements** 

**FR-3.6.1:** The system shall allow customers to join a virtual waiting queue. 

**FR-3.6.2:** The system shall notify customers when a parking slot becomes available. 

**FR-3.6.3:** The system shall automatically remove customers from the queue after successful booking or queue expiry. 

#### **3.7 Digital Wallet Management** 

**Priority:** Medium 

#### **Description:** 

This module enables operators to manage wallet parking digitally by recording vehicle information and handling retrieval requests. 

#### **Functional Requirements** 

**FR-3.7.1:** The system shall assign vehicles to available valet staff. 

**FR-3.7.2:** The system shall record key tag information. 

**FR-3.7.3:** The system shall allow customers to request vehicle retrieval. 

#### **3.8 Violation & Penalty Management** 

**Priority:** High 

#### **Description:** 

This module records parking violations and generates penalties for rule violations such as overstaying and unauthorized parking. 

#### **Functional Requirements** 

**FR-3.8.1:** The system shall record parking violations. 

**FR-3.8.2:** The system shall generate digital penalty invoices. 

**FR-3.8.3:** The system shall allow customers to submit penalty disputes. 

**3.9 Reports & Analytics Module** 

**Priority:** High 

**Description:** 

This module provides operational and financial reports to managers and administrators. 

#### **Functional Requirements** 

**FR-3.9.1:** The system shall generate occupancy reports. 

**FR-3.9.2:** The system shall generate revenue reports. 

**FR-3.9.3:** The system shall display dashboard analytics. 

**FR-3.9.4:** The system shall allow report export in PDF format. 

### **4. External Interface Requirements** 

#### **4.1 User Interfaces (UI)** 

The system provides a responsive and user-friendly web interface for different users. 

- **Customer Dashboard:** Registration, login, parking search, slot reservation, payment, booking history, and invoice download. 

- **Parking Operator Dashboard:** QR/OTP verification, vehicle entry/exit, slot status updates, and active parking sessions. 

- **Branch Manager Dashboard:** Parking layout management, pricing configuration, reservation monitoring, staff management, and reports. 

- **Super Admin Dashboard:** User management, role management, branch management, system settings, and audit logs. 

#### **4.2 Hardware Interfaces** 

The Smart Commercial Parking Operations System is a **software-only solution** and **does not** require dedicated parking hardware. 

The system may use: 

- Desktop/Laptop 

- Smartphone 

- Standard webcam or mobile camera for QR code scanning 

- Internet connection 

The following hardware is **not required** : 

- RFID Readers 

- IoT Sensors 

- ANPR Cameras 

- Automatic Barrier Gates 

#### **4.3 Software Interfaces** 

The system interacts with the following software components: 

|**Component**<br>MySQL|**Purpose**<br>Database Management|
|---|---|



|REST API, GraphQL|Communication between frontend and backend efficiently|
|---|---|
|QR Code Library|QR code generation and scanning|
|Payment Gateway|Online payment processing – Razor Pay|
|Email API|Notifications and delivery|
|JWT|User authentication and authorization|



#### **4.4 Communication Interfaces** 

The system uses the following communication protocols: 

- HTTPS for secure communication 

- REST APIs for client-server communication 

- JSON for data exchange 

- TLS for encrypted data transmission 

### **5. Non-Functional Requirements (NFRs)** 

#### **5.1 Performance Requirements** 

- The system shall load pages within **2 seconds** under normal conditions. 

- API response time shall be less than **500 milliseconds** . 

- The system shall support at least **500 concurrent users** . 

- QR verification shall complete within **2 seconds** .  Reports shall be generated within **5 seconds** . 

- **5.2 Reliability & Availability**  The system shall maintain **99% availability** .  Daily database backups shall be performed.  System failures **shall not result** in data loss.  Error messages shall be displayed for invalid operations.  Audit logs shall record **important system** activities. 

#### **5.3 Security Requirements** 

- Passwords shall be securely hashed using **bcrypt** . 

- All communication shall use **HTTPS/TLS encryption** .  JWT shall be used for user authentication.  Role-Based Access Control **(RBAC)** shall **restrict** unauthorized access.  The system shall validate all user inputs to **prevent** SQL Injection and **Cross-Site Scripting** (XSS). 

#### **5.4 Maintainability and Scalability** 

- The system shall follow a modular architecture. 

- Source code shall be well documented. 

- New parking branches can be added without affecting existing operations. 

- Additional features can be integrated with minimal code changes. 

- The system shall support future expansion to multiple locations. 

## **6. Appendix: UML Diagrams** 

Include visual UML models to support the functional requirements described above. Students should attach: 

- **Use Case Diagram (System boundary, actors, and use cases)** 



<!-- Start of picture text -->
## CPOS: Commercial Parking Operating System Workflow Diagram<br>‘Super Admin Branch Manager Parking Operator/ Attendant ‘Customer<br>[AdminSetup Workfiow | Management Workflow | Parking Operations Workflow | (a |<br>(seein) t<br>:<br>:<br>+ : 2, (Pre-Booking Workfiow)<br>< Update Slot State eet a<br>se<br>7 ~ x NO<br>Goaeaan) RES) :<br>item Tan Rind (Cheers) Geers Franca Wain), << cgps nO<br>a ‘ves<br>= Muli-Role Hierarchy<br>= Sontinge Peeaiiagr| |[__ _SaleEngeSye<br>Patines | Pag Ope ||| fexme)eare nf)<br><!-- End of picture text -->



<!-- Start of picture text -->
Customer Workflow Operator Workflow Manager Workflow Admin Workflow<br>Gast)Rageagh (town) eetesenatons Cton)<br>=. TateArrivalCs Monitor Live Gevreenat) | Configure(EiriMut-Tena<br>‘Spot Available?e NO. ‘Manage Parking Configure Global<br>‘YES ‘Join Virtual Queue | ‘Scan QR / Verify OTP Layout ‘System Settings<br>YES<br>Coa) <Reservation Valid?> , | = a | Genes<br>ee) (awatoonse)Validate&Asin St) (re(SEDEcupton Reports Reports Roestomssonseae<br>Make Payment ES Cae rgd ‘Manage Operator Handle Refund<br>peeksain)Cay (eae)Bi wey Accounts Requests: Generatets  Global<br>Pa<br>(este (Smin window) _) Request pdatez —— me<br>Yesin so ‘AvailableSlot State to)<br>Present QR Pass © © é<br><!-- End of picture text -->

**• Activity Diagram (Step-by-step workflow for primary use cases)** 

#### **• Sequence Diagram (Object interactions over time for key scenarios)** 



<!-- Start of picture text -->
COMMERCIAL PARKING OPERATING SYSTEM (CPOS) - UML SEQUENCE DIAGRAMS.<br>me i a 7 ba~~ — egle I ] fle fr ~~ i ae 4 a<br>ant r * a a<br>—— : 3 : 1 |<br><!-- End of picture text -->

- **Entity-Relationship (ER) Diagram (Core domain entities and relationships)** 



<!-- Start of picture text -->
ee =<br>eee ne == i == =| euccomm |<br>= 5 oo ras en = 5 Berea rand |<br>seente ec ‘PARKING_SESSION . ed © + mePoRT (cones)<br>Cree == ‘= |, == “ee net | |<br>=a SasyrSfs| |Ss. =o Ne<br>Bieri oh ameeel Bele bees Seige ia<br><!-- End of picture text -->

## **7. Glossary & Acronyms** 

Define all technical terms, acronyms, and domain-specific vocabulary used in this document. 

|**Acronym**|**Definition**|
|---|---|
|**SRS**|Software Requirements Specification|
|**UML**|Unified Modeling Language|
|**API**|Application Programming Interface|
|**QR Code**|Quick Response Code used for parking verification|
|**OTP**|One-Time Password used for user verification|
|**RBAC**|Role-Based Access Control|
|**JWT**|JSON Web Token used for authentication|
|**CRM**|Customer Relationship Management|
|**AI**|Artificial Intelligence|
|**BI**|Business Intelligence|
|**SCPOS**|Smart Commercial Parking Operations System|
|**REST API**|Representational State Transfer Application Programming Interface|
|**SaaS**|Software as a Service|
|**Dashboard**|Interface used to monitor and manage system activities|



