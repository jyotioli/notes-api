# Notes REST API

A Node.js/Express REST API for managing notes, deployed live on AWS EC2 with MongoDB Atlas, Docker, and production-grade process management. Built end-to-end — from local development to a monitored, secured cloud deployment.

**Live API:** http://107.23.175.233:3000/notes
**Frontend:** http://oli-notes-frontend-2026.s3-website-us-east-1.amazonaws.com

---

## What This Project Demonstrates

This isn't just a CRUD API — it's a real, deployed system with monitoring, secrets management, and documented incident response:

- ✅ REST API with full CRUD (GET, POST, PUT, DELETE)
- ✅ Deployed on AWS EC2, containerized with Docker
- ✅ MongoDB Atlas for persistent storage (Mongoose ODM)
- ✅ PM2 for zero-downtime production process management
- ✅ AWS Secrets Manager for secure credential handling
- ✅ IAM least-privilege access controls
- ✅ CloudWatch monitoring with CPU utilization alerts
- ✅ Elastic IP for a stable, permanent endpoint
- ✅ CORS configured for frontend integration
- ✅ **[Incident Runbook](./Incident_Runbook_Notes_API.md)** — real debugging documentation from production issues

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Deployment | AWS EC2 |
| Containerization | Docker |
| Process Management | PM2 |
| Secrets | AWS Secrets Manager |
| Monitoring | AWS CloudWatch |
| Networking | AWS Elastic IP, Security Groups, CORS |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notes` | Fetch all notes |
| POST | `/notes` | Create a new note |
| PUT | `/notes/:id` | Update an existing note |
| DELETE | `/notes/:id` | Delete a note |
| GET | `/health` | Health check — returns API status and timestamp |

---

## Architecture

```
Client (React frontend)
      |
      | HTTPS / CORS
      v
AWS EC2 (Elastic IP — stable endpoint)
      |
      | Docker container
      v
Node.js / Express API
      |
      | Mongoose
      v
MongoDB Atlas (cloud database)
```

Credentials are never hardcoded — the API reads its database connection string from environment variables, managed via AWS Secrets Manager in production.

---

## Running Locally

```bash
git clone https://github.com/jyotioli/notes-api.git
cd notes-api
npm install
```

Create a `.env` file in the project root (this file is git-ignored and must never be committed):

```
PORT=3000
MONGO_URI
```

```bash
node server.js
```

API will be available at `http://localhost:3000/notes`.

---

## Deployment Notes

Deployed on AWS EC2 using Docker, with PM2 managing the Node process for automatic recovery. The instance uses an Elastic IP so the endpoint never changes across restarts. CloudWatch tracks CPU utilization with alerting configured for abnormal load.

For a detailed look at real production issues encountered and resolved during this deployment — including networking, port configuration, and IP-persistence problems — see the **[Incident Runbook](./Incident_Runbook_Notes_API.md)**.

---

## Security

- All secrets are managed via environment variables and AWS Secrets Manager — never committed to source control
- IAM users follow least-privilege access principles
- `.gitignore` excludes `.env`, `node_modules`, and all credential files

---

## Author

**Jyoti Oli** — BSc (Hons) Electronics, Delhi University
[LinkedIn](https://www.linkedin.com/in/jyoti-oli) · [GitHub](https://github.com/jyotioli)
