Radency Event Management App (Stage 1 & 2)

This is a full-stack application for event management, developed as a selection task for the Radency internship. The project includes an Angular SPA for the frontend, an ASP.NET Core Web API for the backend, and is fully containerized using Docker Compose.

It features a complete event management lifecycle, including JWT authentication, event CRUD, a tagging system, and an AI assistant powered by Groq.

🛠️ Tech Stack

Frontend

Angular 17+ (using Standalone Components)

TypeScript

RxJS (with ViewModel pattern using async pipe)

Angular Material (for UI components)

angular-calendar & ngx-material-timepicker (for event scheduling)

SCSS (for styling)

Nginx (as a reverse proxy in Docker)

Backend

.NET 8

ASP.NET Core Web API

Clean Architecture (Core, Application, Infrastructure, Contracts, WebAPI)

Dapper (for high-performance data access)

PostgreSQL (as the database)

JWT (JSON Web Tokens) (for authentication)

FluentValidation (for server-side DTO validation)

Groq API (for the AI Assistant)

Swagger/OpenAPI (for API documentation)

DevOps

Docker & Docker Compose (for full stack containerization and orchestration)

🚀 Core Features

Stage 1: Core Functionality

Authentication: Full JWT auth flow (Register, Login, Logout).

Route Guards: Protected routes for authenticated users.

Event CRUD: Create, Read, Update, and Delete events (organizers only).

Event Participation: Users can Join and Leave public events.

State Sync: Centralized ParticipationService ensures join status is consistent across all components.

Calendar View: A "My Events" page (/my-events) showing a full calendar of the user's organized and joined events.

Error Handling: Custom middleware on the backend and interceptors on the frontend for standardized error messages.

Stage 2: Tags & AI

Tagging System:

Events can be created/edited with up to 5 tags (case-insensitive).

Tags are displayed as chips on event cards and detail pages.

Filtering: The main events list can be filtered by multiple tags simultaneously.

AI Assistant:

An AI chat interface on the "My Events" page.

Uses the Groq API (llama3-70b-8192) to answer natural language questions.

The backend builds a detailed context (user's events, public events, tags, participants) to provide accurate, data-aware answers.

⚙️ How to Run the Project

This project is fully containerized. You only need Docker Desktop installed and running.

1. Clone the Repository

git clone [https://github.com/Ivan19156/Application.git](https://github.com/Ivan19156/Application.git)
cd Application


2. Create the .env File

This project uses a .env file to manage secret keys for the database, JWT, and AI.

Find the env.example file in the root directory.

Create a copy of it and rename the copy to .env.

Open the new .env file and fill in your actual secret keys:

# .env file

# 1. PostgreSQL Password (can leave as is for Docker)
DB_PASSWORD=devpassword

# 2. JWT Secret (REPLACE with your own long, random, strong secret)
JWT_SECRET=YOUR_SUPER_STRONG_AND_VERY_LONG_SECRET_KEY_GOES_HERE

# 3. JWT Issuer/Audience (can leave as is)
JWT_ISSUER=RadencyEventApp
JWT_AUDIENCE=RadencyEventAppClient

# 4. Groq API Key (Get from [https://console.groq.com/keys](https://console.groq.com/keys))
GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE


3. Run with Docker Compose

From the root directory (where docker-compose.yml is), run:

docker-compose up --build


This command will:

Build the frontend and backend images.

Start the db, backend, and frontend containers.

The db container will auto-create the schema and seed data from db-init/init.sql.

The backend will wait for the db to be "healthy" before starting.

4. Access the Application

Frontend Application:
http://localhost:8080

Backend API (Swagger):
http://localhost:5101/swagger

Database (External Tool):

Host: localhost

Port: 5433

DB: radency_event_db

User: devuser

Password: (the one you set in your .env file)

Test Credentials

The database is seeded with two users:

Email: alice@example.com

Password: password123
(Organizer of 'Angular Conf' and '.NET Meetup')

Email: bob@example.com

Password: password456
(Organizer of 'Design Workshop' and 'Public AI Conference')
