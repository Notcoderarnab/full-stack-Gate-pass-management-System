# GatePass - Visitor Management System

GatePass is a full-stack visitor management and gate pass application. Visitors can request a pass, hosts/admins can approve or reject visits, approved visitors receive a QR pass, and guards can verify QR codes at the gate using the browser camera.

## Features

- Role-based access for Guest, Host, Guard, and Admin users
- Visitor pass request workflow
- Host and admin approval dashboards
- Time-limited QR pass generation
- Camera-based QR verification in the guard verify section
- Manual QR token or verify URL fallback
- Entry scan logging and QR reuse prevention
- JWT authentication with refresh tokens
- Email notifications for approved or rejected passes
- Daily cron job to expire old QR passes

## Tech Stack

Frontend:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios
- lucide-react
- jsQR for browser QR decoding

Backend:
- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- bcryptjs
- qrcode
- Nodemailer
- node-cron
- Zod

## Project Structure

```text
.
+-- backend/
|   +-- src/
|   |   +-- controllers/
|   |   +-- db/
|   |   +-- middlewares/
|   |   +-- models/
|   |   +-- routes/
|   |   +-- services/
|   |   +-- utils/
|   |   +-- index.ts
|   +-- package.json
|   +-- tsconfig.json
+-- src/
|   +-- Auth/
|   +-- components/
|   +-- context/
|   +-- layouts/
|   +-- pages/
|   +-- services/
|   +-- App.tsx
|   +-- main.tsx
+-- package.json
+-- README.md
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- Email account or app password for sending pass emails

## Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/gatepass
JWT_SECRET=replace_with_a_strong_access_secret
JWT_REFRESH_SECRET=replace_with_a_strong_refresh_secret
FRONTEND_URL=http://localhost:5173

EMAIL_USER=your_email@example.com
EMAIL_APP_PASSWORD=your_email_app_password

ADMIN_SEED_NAME=Admin
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=admin123
```

Optional:

```env
NODE_ENV=development
DNS_SERVERS=8.8.8.8,1.1.1.1
```

Create a `.env` file in the project root only if your backend URL is different from the default:

```env
VITE_API_URL=http://localhost:5000/api
```

## Installation

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

## Running Locally

Start the backend API:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
npm run dev
```

Open the frontend:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:5000/api/health
```

## Build

Build the frontend:

```bash
npm run build
```

Build the backend:

```bash
cd backend
npm run build
```

Run the compiled backend:

```bash
cd backend
npm start
```

## Main Routes

Frontend:
- `/` - Home page
- `/signin` - Sign in
- `/signup` - Visitor registration
- `/visitor-dashboard` - Guest dashboard
- `/host-dashboard` - Host dashboard
- `/admin` - Admin dashboard
- `/verify` - Guard QR verification

Backend API:
- `/api/auth` - Authentication
- `/api/visits` - Visitor pass requests
- `/api/host` - Host dashboard and approvals
- `/api/admin` - Admin dashboard and approvals
- `/api/guard` - QR scan verification
- `/api/health` - API health check

## QR Verification Flow

1. A guest submits a visit request.
2. A host or admin approves the request.
3. The backend generates a unique QR token and QR image.
4. The visitor shows the QR pass at the gate.
5. The guard opens `/verify`, starts the camera, and captures the QR code.
6. The frontend sends the captured token to `/api/guard/scan`.
7. The backend checks token validity, expiry, and reuse status.

Camera scanning uses `jsQR`, so it does not depend on the browser's native `BarcodeDetector` API. Camera access still requires browser permission and must be used on `localhost`, `127.0.0.1`, or an HTTPS deployment.

## Default Role Redirects

After login, users are redirected by role:

- Admin -> `/admin`
- Guard -> `/verify`
- Host -> `/host-dashboard`
- Guest -> `/visitor-dashboard`

## Notes

- The backend seeds an admin user when `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD` are set.
- QR images are stored as base64 strings and the backend JSON limit is configured for larger QR payloads.
- Approved QR passes are automatically marked expired by a daily cron job after their expiry time.

## License

This project is for academic and training use. Update this section if you plan to publish it under a specific open-source license.
