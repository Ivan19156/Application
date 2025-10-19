Radency Event Management App

This is a full-stack application for event management, developed as a selection task for an internship at Radency. The project includes an Angular SPA for the frontend and an ASP.NET Core Web API for the backend, fully containerized using Docker.

🚀 Core Features

Authentication: User registration and login using JWT.

Event Browsing: A public list of events with pagination and search functionality.

Event Details: Complete information about an event, including its list of participants.

Event Management: Users can create, edit, and delete their own events.

Participation: Users can join and leave events.

"My Events": A personalized calendar view showing events where the user is an organizer or a participant.

🛠️ Tech Stack

Frontend

Angular 17+ (Standalone Components)

TypeScript

RxJS for reactive programming

Angular Material for UI components

angular-calendar for the "My Events" page

SCSS for styling

Nginx (in Docker) for serving static files and as a reverse proxy

Backend

.NET 8

ASP.NET Core Web API

Clean Architecture (Core, Application, Infrastructure, WebAPI, Contracts)

Dapper for data access

PostgreSQL as the database

JWT for authentication

FluentValidation for DTO validation

Swagger for API documentation

DevOps

Docker & Docker Compose for containerizing and orchestrating the entire stack.

⚙️ How to Run the Project

You only need Docker Desktop installed to run this project.

1. Clone the Repository

git clone [https://github.com/Ivan19156/Application.git](https://github.com/Ivan19156/Application.git)
cd Application


2. Create the .env File

The project root contains an .env.example file, which serves as a template for your secret keys.

Copy .env.example and rename the copy to .env.

Open the new .env file and replace the placeholder for JWT_SECRET with your own strong, unique secret key (a long string of characters).

# Example .env file content
DB_PASSWORD=devpassword
JWT_SECRET=YOUR_SUPER_STRONG_AND_VERY_LONG_SECRET_KEY_GOES_HERE
JWT_ISSUER=RadencyEventApp
JWT_AUDIENCE=RadencyEventAppClient


3. Run with Docker Compose

Execute a single command from the project root directory:

docker-compose up --build


This command will automatically:

Build the Docker images for the frontend and backend.

Start containers for the database, backend, and frontend.

Create the database schema and seed it with test data (2 users, 3 events) on the first run.

4. Open the Application

After the build and startup process is complete:

Frontend Application will be available at: http://localhost:8080

Backend API (Swagger UI) will be available at: http://localhost:5101/swagger

Database (if you need to connect externally) is available on the host's port 5433.

🔑 Test Credentials

To log in, use one of the automatically seeded test users:

Email: alice@example.com

Password: password123

Email: bob@example.com

Password: password456

🏗️ Project Structure

The project is organized as a monorepo with two main folders: frontend and backend.

backend/: Contains the .NET Solution, structured according to Clean Architecture principles.

frontend/: Contains the Angular SPA application.

db-init/: Contains the init.sql script for creating the database schema.

docker-compose.yml: The main orchestration file for running the entire stack in Docker.
