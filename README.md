# AGI AI-MEDICAL API

This repository contains the backend API for the AGI AI-MEDICAL ecosystem. It is a Node.js application using the Express framework and MongoDB with Mongoose for data modeling.

The API is responsible for:
- Managing organizations (hospitals, clinics) and their users.
- Handling module subscriptions.
- Enrolling and tracking the status of physical medical equipment.
- Receiving, storing, and providing access to medical data from the equipment.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer)
- [MongoDB](https://www.mongodb.com/try/download/community)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd agi-medical-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following:
    ```
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/agi_medical
    ```

4.  **Start the server:**
    ```bash
    npm start
    ```
    The API server should now be running on `http://localhost:3000`.

## Project Structure

```
.
├── models/
│   ├── Organization.js  # Schema for hospitals/clinics
│   ├── User.js          # Schema for users
│   ├── Role.js          # Schema for user roles and permissions
│   ├── Module.js        # Schema for equipment types (e.g., ECG)
│   ├── Subscription.js  # Schema for organization subscriptions
│   └── Equipment.js     # Schema for physical equipment instances
├── scripts/
│   ├── seedRoles.js     # Script to populate the database with initial roles
│   └── ensureIndexes.js # Script to create necessary database indexes
├── app.js               # Main application file (Express server setup)
├── package.json         # Project dependencies and scripts
└── README.md            # This file
```

## Database Management

### Seeding
To get started, you need to seed the database with the necessary user roles. This only needs to be done once per environment.

```bash
npm run seed:roles
```
This command will populate the `roles` collection with a default set of roles and permissions.

### Indexing for Performance
As the database grows, query performance becomes critical. We use MongoDB indexes to ensure that queries can be executed quickly without scanning the entire collection. A script has been created to ensure all necessary indexes are present. This script is idempotent, meaning it can be run safely at any time.

Run the indexing script using the following command:
```bash
npm run db:index
```
This is especially important to run after a fresh database setup or before deploying a new version of the application.

## API Documentation

### Authentication Flow

1.  **Register a new user:** Send a `POST` request to `/api/auth/register` to create a new user.
2.  **Login:** Send a `POST` request to `/api/auth/login` with user credentials. The API will return a JSON Web Token (JWT).
3.  **Send Authenticated Requests:** For all protected routes, include the JWT in the request header as follows:
    ```
    x-auth-token: <your_jwt_here>
    ```

### API Endpoints

#### Authentication (`/api/auth`)

-   **`POST /register`**
    -   **Description:** Registers a new user.
    -   **Access:** Public
    -   **Body:** `{ "name": "John Doe", "email": "john@example.com", "password": "password123", "organizationId": "507f1f77bcf86cd799439011" }`
    -   **Returns:** `{ "token": "..." }`

-   **`POST /login`**
    -   **Description:** Authenticates a user and returns a JWT.
    -   **Access:** Public
    -   **Body:** `{ "email": "john@example.com", "password": "password123" }`
    -   **Returns:** `{ "token": "..." }`

#### Equipment (`/api/equipment`)

-   **`POST /`**
    -   **Description:** Enrolls a new piece of equipment.
    -   **Access:** Private (Requires 'enroll_equipment' permission)
    -   **Headers:** `x-auth-token`
    -   **Body:** `{ "licenseKey": "UNIQUE-LICENSE-KEY", "moduleType": "507f191e810c19729de860ea" }`
    -   **Returns:** The new equipment object.

-   **`GET /`**
    -   **Description:** Gets all equipment for the user's organization.
    -   **Access:** Private
    -   **Headers:** `x-auth-token`
    -   **Returns:** An array of equipment objects.

-   **`PATCH /status/:id`**
    -   **Description:** Updates the status of a specific piece of equipment.
    -   **Access:** Private (Requires 'manage_equipment_status' permission)
    -   **Headers:** `x-auth-token`
    -   **Body:** `{ "status": "online" }`
    -   **Returns:** The updated equipment object.

#### Webhooks (`/api/webhooks`)

-   **`POST /events`**
    -   **Description:** Handles incoming events from external systems.
    -   **Access:** Private (Requires API Key)
    -   **Headers:** `x-api-key`
    -   **Body:** `{ "event": "equipment_offline", "licenseKey": "UNIQUE-LICENSE-KEY" }`
    -   **Returns:** A success or acknowledgement message.

## Changelog

### v2.0.0 (Core API and Authentication) - YYYY-MM-DD

-   Added user authentication with `bcrypt` password hashing and JSON Web Tokens (JWT).
-   Implemented core API routes for `auth` and `equipment`.
-   Added a webhook route to handle real-time events.
-   Created authentication middleware to protect routes.
-   Updated `app.js` to connect to the database and serve the new routes.

### v1.2.0 (Database Performance Indexing) - YYYY-MM-DD

-   Added `scripts/ensureIndexes.js` to create necessary MongoDB indexes for performance at scale.
-   Added `db:index` script to `package.json`.
-   Updated `README.md` with documentation for the new indexing script.

### v1.1.0 (Role-Based Access Control) - YYYY-MM-DD

-   Added a new `Role` schema to manage user permissions.
-   Updated the `User` schema to reference the `Role` schema.
-   Created a seeding script (`scripts/seedRoles.js`) to populate the database with default roles.
-   Updated `package.json` with a `seed:roles` command.

### v1.0.0 (Initial Setup) - YYYY-MM-DD

-   Initialized project with Express and Mongoose.
-   Created initial data schemas for Organization, User, Module, Subscription, and Equipment.
-   Set up basic Express server in `app.js`.
-   Added a placeholder function for executing Python scripts.
-   Created this `README.md` file.
