# Find It

## Video Demo
Link: 

## Team Information
| Team member | Student number | Email |
|-------------|----------------|-------|
| I-Hsuan Ho | 1012638022 | easy.ho@mail.utoronto.ca |
| Cheng-Kai Weng | 1005061246 | kelvin.weng@mail.utoronto.ca |
| Kuan-Yu Chang | 1007359760 | grouper.chang@gmail.com |
| Chia-Chun Wu | 1012134101 | chiachun910711@gmail.com |

---
## Motivation
Losing personal belongings on large university campuses such as the University of Toronto (UofT) is a common and disruptive problem. Items are frequently misplaced in lecture halls, libraries, and shared study spaces. Current recovery methods are fragmented: individuals rely on physical lost-and-found offices or informal social media posts, both of which lack centralized visibility, structured reporting, and real-time communication.

Existing technological solutions also have limitations. Apple’s Find My network and AirTag devices are effective within the Apple ecosystem but require dedicated hardware and primarily support pre-tagged items. Android’s tracking tools similarly focus on registered electronic devices rather than arbitrary belongings such as wallets or bags. Social media platforms provide accessibility but lack geospatial visualization, workflow structure, and persistent state management.

To address this gap, we propose a lost-and-found web application tailored specifically to the UofT campus. Target users include students, staff, and basic administrators who can moderate spam and abuse. Restricting the scope to a defined university community reduces spam and abuse risks, enables clearer moderation mechanisms, and keeps the system manageable within the project timeline. The proposed cloud-native solution will enable users to report lost items, visualize them on a map, upload potential sightings, and communicate in a structured environment in real-time.

## Objectives
Our primary objective was to design and deploy a stateful, scalable, and resilient lost-and-found platform in a production-like cloud environment. The final system combines a React frontend, a Node.js and Express backend, PostgreSQL for persistence, Redis-backed real-time messaging support, and DigitalOcean Spaces for image storage.

The infrastructure objective was equally important. We wanted the application to be fully containerized, reproducible in local development with Docker Compose, and deployable to DigitalOcean Kubernetes with rolling updates and automated delivery through GitHub Actions. This required us to address service discovery, ingress routing, health checks, persistent volumes, secrets management, and deployment automation rather than treating the project as only an application-layer exercise.


## Technical Stack
| Layer | Technology |
| --- | --- |
| Frontend Framework | React + Vite |
| UI Styling | Tailwind CSS |
| Backend Runtime | Node.js |
| Backend Framework | Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Real-Time Messaging | WebSocket + Redis |
| File Storage | DigitalOcean Spaces |
| Local Development | Docker Compose |
| Production Orchestration | DigitalOcean Kubernetes (DOKS) |
| Traffic Routing | NGINX Ingress Controller |
| CI/CD | GitHub Actions + Docker Hub |

Our system was implemented as a **full-stack containerized web application** with a separately deployed frontend and backend, supported by stateful infrastructure services for persistence and real-time messaging.

1. System Framework and Programming Model

   1. React + Vite:

      We adopted a React frontend built with Vite to keep the user interface fast, modular, and easy to iterate on. This approach works well for a highly interactive application where users browse map-based reports, upload data, and interact with real-time messaging flows.

      - **Fast development workflow:** Vite provides a lightweight development server and efficient frontend build pipeline.
      - **Component-driven UI:** React lets us organize the interface into reusable components for reports, chat, navigation, and forms.
      - **Clear deployment separation:** Keeping the frontend separate from the backend fits naturally with the Kubernetes deployment model, where each part of the system can scale and roll out independently.

   2. Node.js + Express + TypeScript:

      The backend is implemented with TypeScript on top of Node.js using Express. This combination gave us a familiar web API model while keeping runtime behavior straightforward for Docker and Kubernetes deployment.

      - **Node.js runtime:** Handles the execution of the backend server in both development and production containers.
      - **Express framework:** Provides the REST API structure, middleware flow, file upload handling, and route organization.
      - **TypeScript reliability:** Improves maintainability by surfacing type errors early, especially across authentication, reports, sightings, and messaging logic.

      This backend structure also supports WebSocket integration and Prisma-based database access without requiring a separate application platform.

2. Frontend and User Interface

   The frontend was designed to support a map-first lost-and-found workflow rather than a static form-based dashboard. Users need to browse reports visually, create posts with contextual details, and move through the app smoothly on both desktop and laptop-sized displays.

   1. React:

      React serves as the core UI library and enables a declarative, state-driven interface. It is used to manage report creation flows, authentication state, report browsing, and live chat interactions in a structured way.

   2. Tailwind CSS:

      Tailwind CSS made it easier to build the interface quickly while still maintaining control over layout, spacing, typography, and component states. This was useful because the project evolved frequently, and utility-based styling reduced the cost of iteration.

   3. Map Interface:

      The frontend includes map functionality for both browsing and reporting. This is central to the product idea because location is one of the most important dimensions of a lost-and-found workflow on a large campus.

   4. Production Frontend Container:

      In production, the frontend is built into a Docker image and served through an Nginx-based static container. In the Kubernetes deployment, this frontend container is exposed behind ingress rather than being copied directly onto a VM filesystem.

3. Data Management and Storage

   1. PostgreSQL:

      PostgreSQL is the primary relational database for the system. It stores core application state such as users, lost reports, sightings, and messages. We selected a relational model because these entities have meaningful relationships and require consistent state over time.

   2. Prisma:

      Prisma is used as the ORM and schema management layer. It simplifies schema definition, migration tracking, and type-safe database access from the backend service. This reduces boilerplate and helps keep the backend logic aligned with the underlying data model.

   3. Redis:

      Redis is used to support WebSocket pub/sub behavior across multiple backend replicas. Without a shared messaging layer, each backend pod would behave independently, making real-time communication inconsistent when traffic is distributed across replicas.

   4. DigitalOcean Spaces:

      User-uploaded images are stored through DigitalOcean Spaces instead of storing large assets directly in the application container. This keeps file handling more scalable and separates durable media storage from stateless service containers.

4. Orchestration and Infrastructure

   1. Docker Compose:

      Local development uses Docker Compose to run PostgreSQL, Redis, and the backend in a reproducible way. This gives the team a shared development baseline and reduces setup drift across machines.

   2. Kubernetes on DigitalOcean:

      Production deployment runs on DigitalOcean Kubernetes. Frontend, backend, PostgreSQL, and Redis each run as separate Kubernetes workloads, which makes the deployed system closer to a real cloud-native environment than a single-server setup.

   3. NGINX Ingress Controller:

      External traffic is routed through Kubernetes ingress. This routing layer sends `/` to the frontend service and forwards `/api`, `/ws`, and `/uploads` to the backend service, replacing the older VM-based reverse proxy model.

   4. Persistent Storage:

      PostgreSQL persistence is backed by a Kubernetes PersistentVolumeClaim using DigitalOcean block storage. This is important because the project is stateful and must preserve database contents across restarts and redeployments.

5. CI/CD and Delivery Pipeline

   1. GitHub Actions:

      The project uses GitHub Actions for automated build and deployment workflows. Separate workflows handle frontend and backend image delivery.

   2. Docker Hub:

      Built images are pushed to Docker Hub with both `latest` and commit-specific SHA tags. This makes each deployment traceable to a Git revision.

   3. Kubernetes Rollout Automation:

      After images are pushed, the workflows authenticate to DigitalOcean, apply the Kubernetes manifests, update deployment images, and wait for rollout success. This provides a repeatable deployment path instead of manual image replacement.

Overall, this stack was selected to balance **development efficiency, operational clarity, cloud-native realism, and maintainability**. React and Tailwind made it practical to build the user-facing product, Node.js and Express supported a flexible backend, PostgreSQL and Prisma handled structured state, Redis enabled real-time synchronization across replicas, and Kubernetes plus GitHub Actions turned the project into a complete deployment-oriented system.


## Features
FindIt provides an end-to-end workflow for **reporting, browsing, and resolving lost-item cases** in a campus setting. The platform is designed not only to collect reports, but also to support ongoing communication and structured status tracking after a report is created.

1. Frontend and User Interaction Layer

   The frontend serves as the main interaction hub where users create reports, browse the campus map, inspect details, and communicate with other users.

   - **Map-Based Report Discovery:**

     FindIt allows users to create lost-item reports tied to physical locations. The frontend uses map components to let users browse reports visually and associate submissions with a specific place on campus. This makes browsing more intuitive than a plain text list and aligns with the real campus use case.

   - **Structured Report Creation:**

     The report creation flow captures item details, location, and images in a consistent format. This improves data quality and makes reports easier for other users to interpret.

   - **User-Centered Navigation:**

     The interface is organized around common user actions such as posting a report, reviewing active reports, checking personal report status, and responding to a case through chat.

2. Backend Logic and Execution Layer

   The backend coordinates authentication-aware requests, persistence, image handling, and real-time messaging.

   - **REST API Layer:**

     The backend exposes routes for application logic such as reports, sightings, health checks, uploads, and messaging-related operations.

   - **WebSocket Messaging - Real-Time Communication:**

     The backend exposes a WebSocket endpoint at /ws, allowing users to communicate about a report in near real time. Redis support is used so that multiple backend replicas can share messaging events rather than behaving like isolated servers..

   - **Health and Rollout Support:**

     The `/api/health` endpoint is used both for operational checks and Kubernetes readiness/liveness probes, making it part of the actual deployment reliability model rather than just a development convenience.

3. Data Storage and Cloud Infrastructure

   This layer ensures that the system remains stateful, resilient, and production-like.

   - **Persistent Relational State:**

     PostgreSQL serves as the source of truth for users, reports, sightings, and chat-related data. This state is preserved across restarts using persistent volume support in Kubernetes.

   - **Cloud-Based Image Storage:**

     The system supports image uploads for reports and sightings. Image uploads are designed to work with DigitalOcean Spaces so that uploaded content is stored outside the application container lifecycle, while the backend can also fall back to local /uploads storage when object storage is not configured.

   - **Containerized Deployment Model:**

     The frontend, backend, PostgreSQL, and Redis are all containerized, which makes the system easier to build, ship, and redeploy in a consistent way.

4. Deployment and DevOps Features

   The project also includes features at the infrastructure and deployment level, not just the application level.

   - **Kubernetes Ingress Routing:**

     Requests are split cleanly between frontend and backend through ingress path routing.

   - **Rolling Updates:**

     Replicated frontend and backend deployments allow the system to update more safely than a single-container replacement approach.

   - **Automated CI/CD:**

     GitHub Actions builds and publishes container images, reapplies manifests, and updates deployments automatically when changes are pushed to the active deployment branch.
    
    On pushes to the active Kubernetes branch, GitHub Actions builds versioned Docker images, pushes them to Docker Hub, updates Kubernetes deployments to the new image tag, and verifies rollout status. This gives the project a repeatable CI/CD path rather than a manual redeploy process.

Overall, the user accesses the FindIt application through a public ingress endpoint. Requests for `/` are routed to the frontend service, while `/api`, `/ws`, and `/uploads` are routed to the backend service. The backend communicates internally with PostgreSQL and Redis using Kubernetes service discovery. Configuration that is safe to expose structurally is stored in ConfigMaps, while sensitive runtime values such as database passwords and JWT secrets are injected through Kubernetes Secrets.

This architecture reflects a clean separation of concerns. The frontend container is responsible only for serving the built SPA assets. Application logic, authentication, uploads, and WebSocket handling live in the backend service. Stateful infrastructure components are isolated behind their own services so that they can be deployed, restarted, and diagnosed independently from the application layer.

FindIt provides an end-to-end workflow for **reporting, browsing, and resolving lost-item cases** in a campus setting. The platform is designed not only to collect reports, but also to support ongoing communication and structured status tracking after a report is created.

## User Guide

The application is organized around three main user workflows: **report lost items**, **report sightings**, and **send messages in real time**.

1. Account Registration and Login

   When the application is opened, the user first sees the welcome page. New users can create an account by entering a username, email, and password. Existing users can log in using their email and password. Authentication is required for features like reporting a lost item, viewing personal reports, and accessing messages.

   An unauthenticated user can still visit the home page at `/home`, but browsing is limited to viewing the map.

<table align="center">
  <tr>
    <td valign="top" width="48%">
      <img src="images/welcome.png?raw=true" alt="Training metrics" width="100%" />
      <br /><br />
    </td>
</table>

 2. Reporting a Lost Item

   Users can create a new report by clicking the `Report Lost Item` button in the navigation bar or the `+` button on the map to open the report window. By providing useful information such as the item name, description, lost date and time, and search location, either by typing an address or clicking directly on the map, the user can submit the report by clicking `Submit report`.

   Users can also upload images optionally. The application accepts `.png`, `.webp`, `.jpg`, and `.jpeg` files. Newly created reports are broadcast in real time so all users can see them on the home page.

<table align="center">
  <tr>
    <td valign="top" width="48%">
      <img src="images/lost_report.png?raw=true" alt="Training metrics" width="100%" />
      <br /><br />
    </td>
</table>

 3. Browsing Reports

   Users can browse active reports on the interactive map and through the report interface. This helps campus users identify nearby or relevant cases without scanning through unstructured messages.

_[Image for the home page]_

 4. Real-Time Messaging

   When a user finds a relevant report, they can use the built-in messaging flow to communicate with the original poster. This reduces the need for external communication channels and keeps discussion attached to the report context.

_[Image of two users' chat window]_

 5. Managing Report Status

   Users can view and manage their reports, including updating the status when an item has been recovered. This keeps the map and listings more accurate over time and prevents stale reports from remaining active indefinitely.

   There are three statuses: `Lost`, `Possibly found`, and `Found`. Only the report owner can mark a report as `Found`, and only the owner can delete the report.


## Development Guide
## CI/CD Workflow

The project uses two GitHub Actions workflows under .github/workflows:

- backend-image.yml
- frontend-image.yml

When code is pushed to the `main` branch, the workflows:

1. Check out the repository.
2. Build backend or frontend Docker images.
3. Push those images to Docker Hub.
4. Install and authenticate `doctl`.
5. Fetch the kubeconfig for the DigitalOcean Kubernetes cluster.
6. Apply the relevant Kubernetes manifests.
7. Update deployments to the new image tagged with the commit SHA.
8. Wait for rollout success and report cluster status.

This gives the team a reproducible build-and-deploy path for both the frontend and the backend.

---

## Kubernetes Deployment Guide

1. Cluster Components
    
    The production Kubernetes deployment includes:
    
    - Frontend deployment and service
    - Backend deployment and service
    - PostgreSQL deployment and service
    - Redis deployment and service
    - NGINX Ingress routing
    - ConfigMap and Secret-based runtime configuration
2. Manifest Layout
    
    The main Kubernetes manifests live under deploy/k8s:
    
    - namespace.yaml
    - backend-config.yaml
    - backend.yaml
    - frontend.yaml
    - postgres.yaml
    - redis.yaml
    - ingress.yaml
3. Step-by-Step Deployment Process
    
    ### **Step 1: Apply the Namespace**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```
### **Step 2: Configure Secrets**

You must create your secrets **before** deploying the database or backend. Use the template provided in the next section.

```bash
# Apply your populated secret.yaml
kubectl apply -f k8s/secret.yaml
```

### **Step 3: Deploy the Data Layer**

Deploy the stateful components first to ensure the backend can connect upon startup.

```bash
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
```

*Note: Ensure your PersistentVolumeClaims (PVCs) are bound successfully using `kubectl get pvc -n findit`.*

### **Step 4: Deploy Application Services**

Apply the configuration and then the application logic.

```bash
kubectl apply -f k8s/backend-config.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

### **Step 5: Configure Routing (Ingress)**

Apply the Ingress rules to expose the application to the internet.

```bash
kubectl apply -f k8s/ingress.yaml
```

4. Secret Management Template  
    
    We use the `stringData` field in our `secret.yaml`. This allows you to input plain-text values, which Kubernetes will automatically encode into Base64 upon application.
    
    ### **`secret.yaml` Template**
    
    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: findit-secrets
      namespace: findit
    type: Opaque
    stringData:
      # Database Credentials
      POSTGRES_PASSWORD: ""
      DATABASE_URL: ""
    
      # Authentication
      JWT_SECRET: ""
      JWT_EXPIRES_IN: ""
    
      # Network Configuration
      CORS_ORIGIN: ""
      BASE_URL: ""
      REDIS_URL: ""
    
      # DigitalOcean Spaces (Object Storage)
      DO_SPACES_ENDPOINT: ""
      DO_SPACES_BUCKET: ""
      DO_SPACES_KEY: ""
      DO_SPACES_SECRET: ""
      DO_SPACES_REGION: ""
      DO_SPACES_CDN_ENDPOINT: ""
    ```
    

### Live Deployment

The current live URL is:

- `http://174.138.114.144/`

Routing is handled through Kubernetes ingress:

- `/` -> frontend service
- `/api` -> backend service
- `/ws` -> backend WebSocket endpoint
- `/uploads` -> backend uploads/static content

## AI Assistance & Verification
AI tools were used as engineering support during development, especially for infrastructure exploration, deployment debugging, and YAML iteration. 

1. Contributions:
    
    AI assisted in crafting complex Kubernetes Ingress YAML configurations and troubleshooting Prisma P1000 connection errors during the rolling update phase. In practice, this was most helpful when diagnosing Kubernetes rollout failures, ingress routing mistakes, and environment configuration issues between local Docker Compose and production Kubernetes.
    
2. Representative Mistake: 
    
    A representative example of an incorrect AI suggestion was using `127.0.0.1` for service-to-service communication in the Kubernetes version of the system. That approach is incorrect because containers in different pods do not share localhost. We corrected this by routing services through Kubernetes DNS and ingress instead.
    
3.  Verification: 
    
    All AI-generated configurations were verified via kubectl logs, kubectl describe, and manual load testing to ensure production stability, such as `kubectl get pods`, `kubectl describe`, `kubectl logs`, GitHub Actions run logs, and direct browser testing of the live application.

## Individual Contribution
| Team member | Contributions |
|-------------|---------------|
| I-Hsuan Ho | |
| Cheng-Kai Weng | |
| Kuan-Yu Chang | |
| Chia-Chun Wu | |


## Lessons Learned and Conclusion

#### 1. The Reality of Cloud-Native Orchestration

This project reinforced that building a cloud-native application is about much more than just containerizing code. The most significant challenges emerged at the **boundaries between services**: managing persistent data via **PVCs**, securing environment variables with **Secrets**, and fine-tuning **Ingress routing**. We discovered that even a minor manifest error—such as an incorrect ingress path priority—can "shadow" an entire API, highlighting the immediate production impact of infrastructure-as-code.

#### 2. Tooling: Docker Swarm vs. Kubernetes

Throughout the ECE1779 curriculum, we explored various orchestration tools, including **Docker Swarm**. While Swarm provided a user-friendly introduction to container management and is excellent for rapid prototyping, we chose to deploy the final version of **FindIt** using **Kubernetes (DOKS)**.

- **Industrial Standards:** Kubernetes proved to be more "industrial-like," offering robust features for self-healing, rolling updates, and complex state management that are essential for production environments.
- **Predictability:** Once the Kubernetes manifests and CI/CD workflows were aligned, the deployment process became substantially more predictable and easier to reason about than ad-hoc server updates.

#### 3. Conclusion

To conclude, **FindIt** demonstrates how a well-orchestrated, cloud-native approach can transform a simple campus problem into a robust, stateful service. It serves as a practical application of modern infrastructure practices, proving that while the learning curve for tools like Kubernetes is steep, the scalability and reliability they provide are unmatched.
