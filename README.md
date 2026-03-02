# ECE1779 Project Proposal
- I-Hsuan Ho 1012638022
- Cheng-Kai Weng 1005061246
- Kuan-Yu Chang 1007359760
- Chia-Chun Wu 1012134101

---
## Motivation

Losing personal belongings on large university campuses such as the University of Toronto (UofT) is a common and disruptive problem. Items are frequently misplaced in lecture halls, libraries, and shared study spaces. Current recovery methods are fragmented: individuals rely on physical lost-and-found offices or informal social media posts, both of which lack centralized visibility, structured reporting, and real-time communication.

Existing technological solutions also have limitations. Apple’s Find My network and AirTag devices are effective within the Apple ecosystem but require dedicated hardware and primarily support pre-tagged items. Android’s tracking tools similarly focus on registered electronic devices rather than arbitrary belongings such as wallets or bags. Social media platforms provide accessibility but lack geospatial visualization, workflow structure, and persistent state management.

To address this gap, we propose a lost-and-found web application tailored specifically to the UofT campus. Target users include students, staff, and basic administrators who can moderate spam and abuse. Restricting the scope to a defined university community reduces spam and abuse risks, enables clearer moderation mechanisms, and keeps the system manageable within the project timeline. The proposed cloud-native solution will allow users to report lost items, visualize them on a map, upload possible sightings, and communicate within a structured environment.

---
## Objective and Key Features

### Objective

The objective of this project is to design, implement, and deploy a stateful cloud-native lost-and-found web application for the University of Toronto campus using Docker and Docker Swarm. The system will support geospatial reporting, persistent data storage, real-time communication, and automated service deployment while demonstrating container orchestration, scalability, and monitoring in a production-like cloud environment.

The application will be deployed on **DigitalOcean** using a virtual machine configured as a Docker Swarm cluster.


### Core Technical Components

#### 1. Containerization and Local Development

All services will be containerized using **Docker**.

Local development will use **Docker Compose** to run:

- Backend API service
- PostgreSQL database
- Background cleanup service

#### 2. Orchestration: Docker Swarm

Production deployment will use **Docker Swarm** for orchestration.

Swarm will be used to:

- Deploy services using `docker stack deploy`
- Run the backend API with **multiple replicas**
- Provide built-in load balancing via the routing mesh
- Automatically restart failed containers
- Manage internal service networking

#### 3. Database Schema and Persistent Storage

The system uses **PostgreSQL** as the relational database.

Core tables include:

- `users` (authentication and roles)
- `lost_reports` (item details, geolocation, status)
- `sightings` (possible found submissions)
- `messages` (chat history per report)

Persistent storage will be implemented using **Docker volumes** attached to the PostgreSQL service to ensure:

- Data durability across container restarts
- Data persistence across service updates or redeployments

#### 4. Deployment Provider

The application will be deployed on a **DigitalOcean Droplet** configured as a Docker Swarm manager node.

Deployment components include:

- Swarm services (API, database, cleanup worker)
- Reverse proxy (Nginx)

#### 5. Monitoring and Observability

Monitoring will be implemented using:

- DigitalOcean system metrics (CPU, memory, disk usage)
- Docker service logs (`docker service logs`)
- Health check endpoints in the backend API

Alerts will be configured for resource thresholds where possible.

### Planned Advanced Features

#### Advanced Feature 1: Real-Time Communication

The system will implement **WebSocket-based real-time messaging** for:

- Chat between the item owner and the finder
- Live report status updates

#### Advanced Feature 2: CI/CD Pipeline

A **GitHub Actions** pipeline will automate:

- Docker image build
- Image push to container registry
- Redeployment to the Swarm cluster

---

## Tentative Plan
Phase 1 Proposal and local foundation
From now to March 1 2026, we will finalize the scope and data model, set up Docker Compose with frontend backend and PostgreSQL, and implement the minimal end to end flow including creating a case and listing cases.

Phase 2 Feature build for presentation
From March 2 2026 to March 15 2026, we will implement authentication and authorization, comments, and basic search and filtering. We will connect the frontend pages to the backend endpoints and ensure the core workflow is stable.

Phase 3 Demo ready system with Swarm and monitoring
From March 16 2026 to March 24 2026, we will deploy to DigitalOcean using Docker Swarm mode, configure replication for frontend and backend, attach DigitalOcean Volumes for PostgreSQL persistence, and set up DigitalOcean monitoring dashboards and alerts. We will also complete the map view and real time updates using WebSockets so the demo can show live updates.

Phase 4 Final deliverable hardening
From March 25 2026 to April 4 2026, we will improve error handling and testing, finalize backup and recovery, polish documentation, and record the video demo. We will also ensure the repository is reproducible and the final report is complete.

## Initial Independent Reasoning (Before Using AI)
Our team wanted to build a university campus focused lost and found platform with a clear and testable user flow. The initial concept was simple: a user can create a lost item case with structured fields such as date, building, and room, and other users can respond on the same case when they have leads or found the item. We chose DigitalOcean for deployment, Docker and Docker Compose for local development, PostgreSQL for persistence, DigitalOcean Volumes for durable database storage, and DigitalOcean Spaces for image uploads with the database storing image links. For orchestration, we decided to use Docker Swarm mode so we can demonstrate replication and load balancing for the frontend and backend while keeping the system understandable. Before using any AI tools, we expected the hardest parts would be reliable persistence under orchestration, stable HTTPS routing for both services, and secure real time updates so only authorized users can perform sensitive actions. Our early plan was to build a minimal end to end workflow locally first, then add authentication and comments, then implement real time updates and the map view, and finally deploy on DigitalOcean with monitoring and alerts. 
## AI Assistance Disclosure
AI tools were used only for writing support for this proposal. The project idea, scope, feature list, and architecture decisions were created by the team without AI. AI was used to improve clarity, organization, and wording, and to help us ensure the proposal explicitly covers all required items such as Docker Compose, PostgreSQL persistence, DigitalOcean Volumes, Docker Swarm orchestration, and monitoring. 
After receiving AI suggestions, we reviewed each change and kept only content that matched our intended scope and timeline. We also checked that every technical statement remained accurate and feasible. One example is that AI suggested making the mapping between course requirements and our planned features more explicit. We adopted that structure, but the actual decisions, including choosing Docker Swarm and building a frontend for a clear demo flow, were made by the team. 
