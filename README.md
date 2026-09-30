# 🛠️ DevOps Practice Folder: devops1

> **DevOps Practice Environment**: This project is a dedicated **DevOps practice folder** designed for hands-on experimentation with Docker containerization, multi-service orchestration using Docker Compose, CI/CD pipeline automation, environment configuration, and microservices architecture.

---

## 🎯 Purpose & Practice Objectives

This workspace simulates a modern production-like decoupled web application, serving as a sandbox for mastering essential DevOps workflows:

- **Docker Containerization**:
  - Writing clean, lightweight Dockerfiles with multi-stage builds ([frontend/Dockerfile](file:///home/macjosh/project/CI-CD/devops1/frontend/Dockerfile)).
  - Production static asset serving and reverse proxying with Nginx ([frontend/nginx.conf](file:///home/macjosh/project/CI-CD/devops1/frontend/nginx.conf)).
  - Node.js backend containerization with security best practices ([backend/Dockerfile](file:///home/macjosh/project/CI-CD/devops1/backend/Dockerfile)).
- **Container Orchestration (Docker Compose)**:
  - Multi-container coordination across custom bridge networks ([docker-compose.yml](file:///home/macjosh/project/CI-CD/devops1/docker-compose.yml)).
  - Service healthchecks (`mongosh --eval "db.adminCommand('ping')"`).
  - Explicit container startup ordering with `condition: service_healthy`.
  - Persistent volume management for databases (`mongodb_data`).
- **CI/CD Readiness**:
  - Automated linting, testing, and building of decoupled client and server apps.
  - Building and publishing multi-arch Docker container images.
  - Automated deployment and integration testing in CI/CD runners (e.g., GitHub Actions, GitLab CI, Jenkins).
- **Observability & Debugging**:
  - Centralized log streaming (`docker compose logs -f`).
  - Container health checks and resource monitoring.

---

## 🏗️ Architecture Overview

The system consists of decoupled services running on an isolated bridge network (`app-network`):

```text
                        +---------------------------+
                        |       Web Browser         |
                        +-------------+-------------+
                                      |
                     Port 5173        |        Port 8081
                         +------------+------------+
                         |                         |
                         v                         v
               +-------------------+     +-------------------+
               |  frontend (Nginx) |     |   mongo-express   |
               |  React Single     |     |   Admin Dashboard |
               |  Page Application |     +---------+---------+
               +---------+---------+               |
                         |                         |
               REST API  | (Port 5000)             |
                         v                         |
               +-------------------+               |
               |  backend (NodeJS) |               |
               |  Express REST API |               |
               +---------+---------+               |
                         |                         |
                         +------------+------------+
                                      |
                                      v
                         +-------------------------+
                         |    mongodb (Mongo 7)    |
                         |    Persistent Volume    |
                         +-------------------------+
```

| Service | Technology | Port (Host:Container) | Description |
|---|---|---|---|
| **frontend** | React 18, Vite, Nginx (Alpine) | `5173:80` | Client UI for managing tasks (CRUD) |
| **backend** | Node.js 20, Express, Mongoose | `5000:5000` | REST API handling business logic and DB communication |
| **mongodb** | MongoDB 7.0 Community | `27017:27017` | NoSQL persistent document store |
| **mongo-express** | Mongo Express (Node.js) | `8081:8081` | Web-based database management interface |

---

## 📁 Directory Structure

```text
devops1/
├── docker-compose.yml       # Orchestrates MongoDB, Backend, Frontend, and Admin UI
├── README.md                # DevOps documentation & practice guide
├── backend/                 # Node.js + Express REST API
│   ├── src/
│   │   ├── config/db.js     # MongoDB Mongoose connection handler
│   │   ├── controllers/     # CRUD controller actions
│   │   ├── models/Todo.js   # Mongoose schema and model
│   │   └── routes/          # Express API route declarations
│   ├── .env                 # Backend runtime environment configuration
│   ├── .env.example         # Environment template for deployments
│   ├── Dockerfile           # Backend Docker container definition
│   ├── package.json         # Dependencies & scripts
│   └── server.js            # Express application entrypoint
└── frontend/                # React (Vite) Single Page Application
    ├── src/
    │   ├── components/      # UI components (TodoForm, TodoList, etc.)
    │   ├── services/api.js  # API client connecting to backend
    │   ├── App.jsx          # Root component
    │   ├── App.css          # Styling
    │   └── main.jsx         # DOM mounting entrypoint
    ├── .env                 # Frontend environment configuration
    ├── .env.example         # Environment template
    ├── Dockerfile           # Multi-stage build (Node build -> Nginx alpine)
    ├── nginx.conf           # Production Nginx reverse proxy configuration
    ├── index.html           # HTML template
    ├── package.json         # Frontend dependencies & build scripts
    └── vite.config.js       # Vite bundler configuration
```

---

## 🚀 Running the Project

### Option 1: Full-Stack Docker Compose (Recommended for DevOps practice)

Spin up all containers (MongoDB, Mongo Express, Backend, Frontend) with a single command:

```bash
# From the devops1 root directory
docker compose up --build -d
```

#### Accessing Services:
- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Mongo Express UI**: [http://localhost:8081](http://localhost:8081)
- **MongoDB Direct**: `localhost:27017`

#### Container Management Commands:
```bash
# View live logs of all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Check container health and status
docker compose ps

# Stop and remove containers and network
docker compose down

# Stop and remove containers, networks, and persistent data volumes
docker compose down -v
```

---

### Option 2: Hybrid Local Development (Docker DB + Local Services)

Ideal for application development and rapid debugging:

#### 1. Start MongoDB & Mongo Express:
```bash
docker compose up -d mongodb mongo-express
```

#### 2. Start Backend:
```bash
cd backend
npm install
npm run dev      # Runs with nodemon on port 5000
```

#### 3. Start Frontend:
```bash
cd frontend
npm install
npm run dev      # Runs Vite dev server on port 5173
```

---

## 📡 API Reference

All backend routes are prefixed with `/api`.

| Method | Endpoint | Description | Sample Request Payload |
|---|---|---|---|
| `GET` | `/api/health` | Service health status | None |
| `GET` | `/api/todos` | List all todos (supports `?completed=true/false&search=...&priority=...`) | None |
| `GET` | `/api/todos/:id` | Get single todo by ID | None |
| `POST` | `/api/todos` | Create a new todo | `{"title": "DevOps Task", "description": "Configure CI pipeline", "priority": "high"}` |
| `PUT` | `/api/todos/:id` | Update todo | `{"completed": true}` |
| `DELETE` | `/api/todos/:id` | Delete todo | None |

### Quick cURL Tests:

```bash
# Check health
curl -X GET http://localhost:5000/api/health

# Create a task
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "DevOps Practice Task", "description": "Test containerized CRUD API", "priority": "high"}'

# Fetch all tasks
curl -X GET http://localhost:5000/api/todos
```

---

## 🧪 DevOps Practice Exercises & Challenges

Use this folder to practice and implement:

1. **CI/CD Pipeline (GitHub Actions / GitLab CI)**:
   - Set up automated testing and linting triggers on pull requests.
   - Build Docker images and push them to Docker Hub or GitHub Container Registry (GHCR).
   - Cache npm dependencies and Docker build layers for faster builds.
2. **Docker Optimization**:
   - Analyze image sizes using `docker images`.
   - Experiment with distroless or minimal base images.
   - Run containers as non-root users for enhanced security.
3. **Infrastructure as Code & Kubernetes**:
   - Translate [docker-compose.yml](file:///home/macjosh/project/CI-CD/devops1/docker-compose.yml) into Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets, PVCs).
   - Create Helm charts to parameterize deployments across development, staging, and production.
4. **Monitoring & Logging**:
   - Integrate Prometheus metrics export and Grafana dashboards.
   - Ship container logs to an ELK / EFK / Loki stack.
