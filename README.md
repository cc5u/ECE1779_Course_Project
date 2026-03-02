# ECE1779 Project Proposal
- I Hsuan Ho 1012638022
- Cheng Kai Weng 1005061246
- Kuan Yu Chang 1007359760
- Chia Chun Wu 1012134101
  
## Deployment and Stack


## Motivation
Lost item reporting on campus is currently fragmented across group chats, informal posts, and physical offices. This creates three recurring problems.

- Information is not centralized, so a finder cannot quickly match an item to the right owner case
- Updates are not timely, so leads get buried and follow up is difficult
- Privacy risk increases when users post phone numbers or personal contact details publicly

We will build a campus focused platform that centralizes lost item cases, supports structured search by time and location, and enables safe contact through the platform. Target users include students, staff, visitors, and basic administrators who can moderate spam and abuse.


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

## AI Assistance Disclosure
