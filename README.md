# Robro Systems — User Management & Image Capture Platform

A full-stack web app built with Angular 17 and Node.js. The idea is simple — admins manage users and roles, while workers/supervisors can capture photos from their webcam and upload them. Admins can see everyone's photos, workers can only see their own.

---

## Tech Stack

- **Frontend:** Angular 17 (standalone components), TypeScript, Angular Material, SCSS
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (cloud) + Mongoose
- **Auth:** JWT tokens + bcrypt password hashing
- **File Upload:** Multer with randomised filenames

---

## Running Locally

You'll need Node.js 18+ installed. That's pretty much it.

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=pick_any_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Then run the seeder once to create the default admin account:

```bash
node seed.js
```

Start the server:

```bash
npm run dev
```

Backend runs on `http://localhost:5001`

---

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200` in your browser.

---

## Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@robro.com | Admin@123 |

Admin can create Supervisor and Worker accounts from the dashboard.

---

## What each role can do

- **Admin** — sees all users, can create/delete accounts, change roles, and views every uploaded photo from all users
- **Supervisor** — logs in, can use the camera, sees only their own photos
- **Worker** — same as Supervisor, camera access + own gallery only

---

## API Endpoints

### Auth
- `POST /api/auth/login`

### Users (Admin only)
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id/role`
- `DELETE /api/users/:id`

### Images
- `POST /api/images/upload`
- `GET /api/images`
- `GET /api/images/file/:filename` — authenticated file streaming, no direct access
- `DELETE /api/images/:id`

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/read-all`

---

## Project Structure

```
robro-assignment/
├── backend/
│   ├── middleware/        # JWT auth, role checking, error handling
│   ├── models/            # User, Image, Notification
│   ├── routes/            # one file per feature
│   ├── uploads/           # stored images (not publicly served)
│   ├── seed.js            # creates default admin
│   └── server.js
│
└── frontend/
    └── src/
        ├── app/
        │   ├── core/      # guards, interceptors, services, models
        │   └── pages/     # login, admin-dashboard, camera, settings, worker-dashboard
        ├── environments/
        └── styles.scss
```

---

## Challenges I ran into

**1. Images couldn't use a regular `<img>` tag**

The first thing I tried was just pointing an `<img src="/api/images/file/filename.jpg">` and attaching the JWT somehow. That doesn't work — browsers send image requests directly without any custom headers, so the auth middleware would reject them. The fix was to fetch the image using `HttpClient` (which goes through the Angular interceptor and gets the JWT header attached), get the response as a `Blob`, convert it to an object URL with `URL.createObjectURL()`, and bind that to the `src` instead. A bit annoying but it works properly.

**2. Webcam permissions vary by browser**

`getUserMedia()` behaves differently on different browsers and throws different errors depending on whether the user denied access, the device doesn't exist, or the browser blocked it for non-HTTPS. Had to wrap it in proper try/catch and show helpful messages in each case rather than just showing a broken black box.

**3. Role-based gallery filtering**

Didn't want to do the filtering on the frontend because that's easy to bypass — anyone could just modify the response in devtools. So the filtering happens on the backend: if the logged-in user is an Admin, the query returns all images; otherwise it adds a `userId` filter. Frontend just renders whatever it gets back.

**4. Keeping uploaded files private**

The `uploads/` folder is never exposed as a static directory. Every file request goes through an Express route that checks the JWT, then checks if the requesting user owns that image (or is Admin), and only then streams the file using `res.sendFile()`. Direct URL access returns 404.

---

## Why these decisions

- **JWT over sessions** — easier to scale, frontend can read the token claims directly without an extra API call on load
- **MongoDB** — flexible schema made sense for image metadata which can have optional fields
- **Multer with crypto filenames** — `crypto.randomBytes(16).toString('hex')` means filenames are unguessable, no enumeration attacks possible
- **Angular standalone components** — less boilerplate than NgModules, cleaner routing
