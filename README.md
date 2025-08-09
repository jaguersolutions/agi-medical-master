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
│   ├── Module.js        # Schema for equipment types (e.g., ECG)
│   ├── Subscription.js  # Schema for organization subscriptions
│   └── Equipment.js     # for physical equipment instances
├── app.js               # Main application file (Express server setup)
├── package.json         # Project dependencies and scripts
└── README.md            # This file
```

## Schema Overview

-   **Organization**: Represents a single entity like a hospital or clinic. It contains basic information and holds references to its `Users` and its `Subscription`.
-   **User**: Represents an individual user who can log in to the system. Each user belongs to one `Organization`.
-   **Module**: Defines a type of medical equipment that can be subscribed to, such as 'Patient Monitor', 'Fetal Monitor', or 'ECG'.
-   **Subscription**: A crucial link between an `Organization` and the `Modules` it has access to. It specifies the quantity of each module type the organization has subscribed to.
-   **Equipment**: Represents a single, physical piece of medical hardware. Each piece of equipment has a unique `licenseKey`, is associated with an `Organization`, and corresponds to a specific `Module` type. Its `status` ('online' or 'offline') is tracked here.

## Changelog

### v1.0.0 (Initial Setup) - YYYY-MM-DD

-   Initialized project with Express and Mongoose.
-   Created initial data schemas for Organization, User, Module, Subscription, and Equipment.
-   Set up basic Express server in `app.js`.
-   Added a placeholder function for executing Python scripts.
-   Created this `README.md` file.
