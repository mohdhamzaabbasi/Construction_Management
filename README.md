# Construction Project Expense & Profit Manager

A full-stack construction site finance app for recording site-wise material purchases, labour attendance, labour payments, client payments, other expenses, suppliers, projects, register book entries, reports, and profit/loss analytics.

## Stack

- Frontend: React, Vite, JavaScript, CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- ODM: Mongoose
- Auth: JWT and bcrypt
- API: REST APIs
- Package manager: npm

## Setup

1. Install MongoDB locally and make sure it is running.
2. Copy the root environment example:

```bash
copy .env.example .env
```

3. Install dependencies from the project root:

```bash
npm install
```

4. Seed the database:

```bash
npm run seed
```

For an existing database created before the material master was added, run the non-destructive migration once:

```bash
npm run migrate:materials
npm run migrate:soft-delete
npm run migrate:snapshots
```

5. Start the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:4000/api`

## Seed Login

- username: `admin`
- password: `admin123`

## Environment Variables

The API and Vite frontend both read the root `.env` file:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/civil_management
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
VITE_API_URL=/api
API_PROXY_TARGET=http://127.0.0.1:4000
```

## Main Features

- Register, login, JWT protected routes, logout
- Four-section home: Sites, Labour, Material, and Material Vendors
- Site workspace with dashboard, attendance, labour payments, material purchases, and site register
- Material master with editable default rates and preferred vendors
- Labour, material, and vendor transaction histories
- Dashboard cards with Indian Rupee formatting
- Project, client, supplier, material, labourer, payment, expense, and register management
- Labour attendance separate from labour payment dues
- Bulk labour attendance and bulk labour payment workflow
- Automatic transaction register entries for all financial events
- Project analytics with cost, pending, received, profit/loss, charts, top materials, suppliers, and register
- Completed project report export
- CSV/PDF export and print-friendly tables
- Responsive desktop sidebar and compact mobile navigation
