# DBUU ERP backend deployment

## Requirements

- Node.js 20.19 or later
- MongoDB Atlas or a reachable MongoDB deployment
- A persistent disk for `backend/public/uploads` when profile images are used

## Configure

Create a private `.env` file for local development and configure secrets through the hosting provider in production. Never upload or share `.env`.

Required settings:

- `NODE_ENV=production`
- `PORT` (provided by most hosting platforms)
- `MONGO_URI` (use a TLS-enabled URI such as MongoDB Atlas `mongodb+srv://`, a restricted database user, and allow only the backend host in the network access list)
- `JWT_SECRET` (generate a unique random secret of at least 32 characters)
- `JWT_EXPIRES_IN` (for example, `7d`)
- `CLIENT_URL` (the exact HTTPS frontend origin; comma-separate additional origins)
- `ALLOW_TEACHER_SIGNUP=false`
- `UPLOAD_DIR` (optional path to the uploads volume; defaults to `backend/public/uploads`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` (only needed when running the admin seed command)

Set `TRUST_PROXY` to the number of trusted proxy hops only when the deployment platform requires it. Confirm this value with the platform before enabling it.

## Install, test, and start

From this directory:

```sh
npm ci
npm test
npm start
```

Run `npm run seed` once after configuring the required server settings and admin credentials. Use a unique admin email and password of at least 16 characters. Store seed values as secrets. The seed command creates or updates the configured admin account.

Student records must be created and maintained by an authenticated administrator. Student profile endpoints are read-only; only the admin student-management API can update student details or photos. Student registration requires both father and mother names; their contact details are optional.

Use `/health/live` for process liveness and `/health/ready` for readiness checks. Readiness returns HTTP 503 until MongoDB is connected.

## Academic records

Instructors can create, update, list, and delete their assignments and marks through the authenticated instructor API. Attendance is recorded per course, date, and lecture period; resubmitting the same lecture updates its records. Students can view their course assignments, marks, and attendance from their authenticated portal.

The student attendance page shows both the recorded attendance ratio and a separate score that starts at 0%, adds 0.2 percentage points for each present lecture, subtracts 0.2 points for each absent lecture, and is capped between 0% and 100%. A late lecture counts toward the recorded attendance ratio but does not change this separate score.

## Frontend

Deploy the backend service from the `backend` directory with `npm ci` and `npm start`. Deploy the frontend from the `frontend` directory with `npm ci` and `npm run build`, then publish `frontend/dist`. Set `VITE_API_URL` to the public HTTPS backend origin before building when frontend and API have different origins; the production build rejects localhost or non-HTTPS API URLs. Configure the frontend host to send SPA routes back to `index.html`. When serving both on one origin, configure a reverse proxy for `/api`, `/uploads`, and `/health` to the backend.

## Operational requirements

- Uploaded profile images are stored on local disk. Set `UPLOAD_DIR` to a mounted persistent-volume path and share that storage across restarts and instances, or configure an external object-storage service before deploying to an ephemeral or multi-instance host.
- Profile image uploads can be up to 10 MB and support common formats such as JPEG, PNG, GIF, WebP, AVIF, BMP, and TIFF. The backend detects image content rather than trusting the browser-provided MIME type or filename extension, then assigns the detected extension. Unsupported content and files with spoofed image extensions are rejected.
- Restrict MongoDB network access and use TLS for all public traffic.
- Configure automated database backups, monitoring, and a platform restart policy.
- The current student/instructor login uses university ID plus date of birth as requested. DOB is personal data and a weak credential; limit access to these values, enforce HTTPS, and consider replacing this login scheme before exposing the portal publicly.
- In-memory rate limiting is per process. Use a shared rate-limit store before running multiple backend instances.
