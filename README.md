# ECE1779 Project Proposal
- I-Hsuan Ho 1012638022
- Cheng-Kai Weng 1005061246
- Kuan-Yu Chang 1007359760
- Chia-Chun Wu 1012134101
  
## Deployment and Stack


## Motivation

Losing personal belongings on large university campuses such as the University of Toronto (UofT) is a common and disruptive problem. Items are frequently misplaced in lecture halls, libraries, and shared study spaces. Current recovery methods are fragmented: individuals rely on physical lost-and-found offices or informal social media posts, both of which lack centralized visibility, structured reporting, and real-time communication.

Existing technological solutions also have limitations. Apple’s Find My network and AirTag devices are effective within the Apple ecosystem but require dedicated hardware and primarily support pre-tagged items. Android’s tracking tools similarly focus on registered electronic devices rather than arbitrary belongings such as wallets or bags. Social media platforms provide accessibility but lack geospatial visualization, workflow structure, and persistent state management.

To address this gap, we propose a lost-and-found web application tailored specifically to the UofT campus. Target users include students, staff, and basic administrators who can moderate spam and abuse. Restricting the scope to a defined university community reduces spam and abuse risks, enables clearer moderation mechanisms, and keeps the system manageable within the project timeline. The proposed cloud-native solution will allow users to report lost items, visualize them on a map, upload possible sightings, and communicate within a structured environment.


## Objective and Key Features
### Objectives
- Provide an end to end workflow from reporting to contact to resolution
- Ensure the application is stateful with durable data that survives container restart and redeploy
- Deploy to DigitalOcean and demonstrate containerization, persistence, orchestration, and monitoring
- Build a simple but complete frontend that makes the demo clear and shows user flow end to end
- Implement at least two advanced features with clear demonstration value

### Core Features

#### Case reporting and management
- Create a case with item name, category, description, lost time, building, room, and optional images
- Case status lifecycle with Open, In Contact, Resolved, Closed
- Owners can edit and close their own cases

#### Search and browsing
- Search by building, date range, category, and keyword
- Sort by most recent updates and support pagination

#### Comments and contact
- Comment threads under each case for leads and questions
- Platform based contact workflow using contact requests or message threads to avoid public personal contact details

#### Map view
- Display active cases as map pins based on building location
- Filters by building and category
- Clicking a pin opens the case detail view
- Map data uses OpenStreetMap tiles and a simple web map library such as Leaflet

#### Frontend user flow
- A homepage that lists recent cases and supports basic filters
- A case detail page that shows case information, images, status, and comments
- A map page that shows active cases as pins and links to case detail views
- A create case page for logged in users
- Real time updates shown in the case detail page when new comments or status changes occur

#### Admin moderation
- Remove spam comments
- Handle reports
- Ban abusive users in a basic first version

### Advanced Features
We will implement at least two, and aim for three.

- Real time updates using WebSockets for new comments and status changes
- Security enhancements including authentication, authorization, HTTPS, and secrets management
- Backup and recovery using scheduled database dumps to object storage and a documented restore process

## Core Technical Requirements Mapping

### Containerization and Local Development
- Docker images for the backend service, the frontend service, and the database
- Docker Compose for local multi container development

### State Management and Persistent Storage
- PostgreSQL stores users, cases, comments, and lead reports
- PostgreSQL data directory is stored on DigitalOcean Volumes so data persists across restarts
- Case images are stored in DigitalOcean Spaces, and the database stores only image URLs

### Deployment Provider
- DigitalOcean as the only cloud deployment environment

### Orchestration Approach
We will use Docker Swarm mode on DigitalOcean Droplets to satisfy the orchestration requirement and to demonstrate replication, service discovery, and rolling updates.

- Create a small Swarm cluster on DigitalOcean Droplets
- Run the backend service with multiple replicas to demonstrate replication and load balancing
- Run the frontend service with multiple replicas so user traffic can be served reliably
- Run PostgreSQL as a single replica pinned to the node with the attached volume
- Use a reverse proxy for HTTPS and routing so the frontend and backend are reachable through stable public endpoints

### Monitoring and Observability
- Use DigitalOcean monitoring dashboards and logs
- Track CPU, memory, disk usage, and container restarts
- Configure alerts for resource pressure such as low disk space on the volume
- Provide a health check endpoint for demo reliability

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
