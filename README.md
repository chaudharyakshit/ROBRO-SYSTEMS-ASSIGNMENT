# Robro Systems — User Management & Image Capture Application

A secure, role-based User Management System (UMS) with integrated webcam image capturing and authenticated file streaming. Engineered with a Node.js/Express REST API and an Angular 17 frontend, this application enforces strict security controls including NoSQL injection defense, XSS protection, cryptographic filename generation, and ownership-validated asset delivery.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 17 (Standalone Components, TypeScript, SCSS) |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose ODM |
| **Authentication** | JWT (8h expiration) + Bcrypt (12 rounds) |
| **Security** | Helmet, CORS, Rate Limiting, express-mongo-sanitize, xss-clean |
| **File Upload** | Multer (with crypto-random filenames, 5MB max limit) |

---

## Prerequisites

Ensure the following runtimes are installed on your host system:
* **Node.js** v18.0.0+
* **MongoDB** v6.0.0+ (running locally or a remote MongoDB Atlas connection string)
* **Angular CLI** v17.0.0+
* **npm** v9.0.0+

---

## Getting Started

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` configuration file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/robro-ums
   JWT_SECRET=your_super_secret_key_here
   ```
4. Seed the database with the default system Administrator account:
   ```bash
   node seed.js
   ```
5. Spin up the backend API dev server:
   ```bash
   npm run dev
   ```
   *The server will start listening at [http://localhost:5000](http://localhost:5000).*

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot up the Angular application server:
   ```bash
   ng serve
   ```
   *Open your browser and navigate to [http://localhost:4200](http://localhost:4200).*

---

## Default Login Credentials

Use the seeded credentials to log in as the default Administrator:

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@robro.com | Admin@123 |

---

## API Endpoints

All endpoints (excluding login) require authorization via a `Bearer <JWT_TOKEN>` header.

### 🔑 Authentication Routes (`/api/auth`)
* `POST /api/auth/login` | **Public** | Validates credentials and returns an 8-hour JWT token.

### 👥 User Directory Routes (`/api/users`) — *Admin Only*
* `GET /api/users` | **Admin Only** | Returns users with support for pagination, search querying, and role filters.
* `POST /api/users` | **Admin Only** | Registers a new user. Enforces email uniqueness, role enum restrictions, and password validations.
* `PATCH /api/users/:id/role` | **Admin Only** | Alters a user's role (Worker or Supervisor only). Prevents self-demotions.
* `DELETE /api/users/:id` | **Admin Only** | Deletes a user account. Prevents self-deletion.

### 🖼️ Image Capture Routes (`/api/images`)
* `POST /api/images/upload` | **Authenticated** | Uploads webcam captures. Validates sizes (<=5MB) and types (`jpeg`, `jpg`, `png`).
* `GET /api/images` | **Authenticated** | Returns a paginated image grid list. Admins see all user captures; Workers and Supervisors only see their own.
* `GET /api/images/file/:filename` | **Authenticated & Owner/Admin** | Verifies ownership or Admin role and streams the secure static binary via `res.sendFile()`.
* `DELETE /api/images/:id` | **Authenticated & Owner/Admin** | Permanently deletes image metadata from the database and unlinks the corresponding file from disk.

---

## Security Architecture

1. **Private Image Streaming**: Absolute prevention of direct asset harvesting. The `uploads` directory is completely private and is never served as a public static directory. Files can only be retrieved by authenticated and authorized owners.
2. **JWT Ownership Validation**: Every requests to fetch or view a file runs verification checks. It decodes the JWT and queries MongoDB to confirm the logged-in user owns the record or holds the `Admin` role before releasing the byte stream.
3. **Cryptographic Random Filenames**: Multer disk-storage generates random filenames using `crypto.randomBytes(16)` hex strings. This prevents enumeration attacks and directory guessing.
4. **NoSQL Injection & XSS Defenses**: All client inputs pass through `express-mongo-sanitize` (to strip query selectors starting with `$`) and `xss-clean` (to strip malicious HTML scripts/tags).
5. **Rate Limiting**: Defends endpoints against brute-force login sweeps (limits authentication requests to 15 per 10 minutes) and blocks general API abuse (limits overall routes to 200 calls per 15 minutes).

---

## Technical Decisions

* **JWT vs Sessions**: Adopted stateless token authorization. Since credentials, role scopes, and name states are encapsulated inside the encrypted JWT, the backend is highly scalable, and the frontend can boot seamlessly by reading claims directly without querying user endpoints on page load.
* **MongoDB (Mongoose) vs SQL**: Chose MongoDB for flexible, schema-less handling of user documents and rich image metadata fields.
* **Multer Crypto Naming**: Used hex strings from `crypto.randomBytes` to prevent collisions and ensure name values cannot be inferred by third parties.
* **Angular Blob Object URLs**: Standard HTML `<img>` elements make native browser GET requests that bypass Angular interceptors (meaning `Authorization` headers are omitted). To solve this, the application programmatically downloads target image bytes using `HttpClient`, converts them to local binary objects, and binds them to templates using `URL.createObjectURL(blob)`.
* **Standalone Architecture**: Used Angular Standalone component routing to reduce module overhead and improve initial load speeds.

---

## Challenges & Solutions

* **Camera Device Permissions**: Browsers enforce strict permission scopes for webcam feeds. Handled this by wrapping `getUserMedia` inside validation catching checks that display immediate prompts to the user if access is rejected or missing.
* **Secure Image Loading in Templates**: Standard HTML image rendering tags lack support for authorization headers. Solved by introducing an asynchronous stream retriever that retrieves secure files as blobs, generates object URLs, binds them locally, and revokes references upon component destruction to prevent browser memory leaks.
* **Granular Role Isolation**: Admin accounts must inspect all images, whereas standard users must only observe self-uploaded captures. Solved by writing query logic on the backend that dynamically injects filters on query execution, separating scopes securely at the data layer.

---

## Folder Structure

```text
robro-assignment/
├── backend/
│   ├── middleware/
│   │   ├── auth.middleware.js         # JWT Token Verification
│   │   └── role.middleware.js         # Role Enforcer
│   ├── models/
│   │   ├── User.js                    # User Schema & Bcrypt Pre-save
│   │   └── Image.js                   # Image Schema & Virtuals Configuration
│   ├── routes/
│   │   ├── auth.routes.js             # User Auth Controller & Rules
│   │   ├── image.routes.js            # Secure Upload & Private Streaming
│   │   └── user.routes.js             # User CRUD Router
│   ├── uploads/                       # Private Files Storage (Non-static)
│   ├── .env                           # Environment Variables (Ignored in VCS)
│   ├── package.json                   # Backend Dependencies
│   ├── seed.js                        # Admin Seeder
│   └── server.js                      # Main App Server
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── core/
    │   │   │   ├── guards/
    │   │   │   │   ├── auth.guard.ts  # Token Validity Guard
    │   │   │   │   └── role.guard.ts  # Route Role Enforcer
    │   │   │   ├── interceptors/
    │   │   │   │   └── jwt.interceptor.ts # Token Injector & HTTP 401 Handler
    │   │   │   └── services/
    │   │   │       ├── auth.service.ts # Session Controller
    │   │   │       ├── image.service.ts # Secure Upload Operations
    │   │   │       └── user.service.ts # Admin Dashboard Operations
    │   │   ├── pages/
    │   │   │   ├── admin-dashboard/   # Admin Control Center
    │   │   │   ├── camera/            # Webcam Feed & Gallery Portal
    │   │   │   └── login/             # Login Page
    │   │   ├── app.config.ts          # Angular Config (Providers & Interceptors)
    │   │   ├── app.routes.ts          # Angular Navigation Routes
    │   │   └── app.component.ts       # Layout Shell
    │   ├── environments/
    │   │   └── environment.ts         # Environment API Settings
    │   ├── index.html                 # App Entry Point & Custom Favicon
    │   └── styles.scss                # Global Styling Sheets
    ├── package.json                   # Frontend Dependencies
    └── angular.json                   # Angular Build Configurations
```
