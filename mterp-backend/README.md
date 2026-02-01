# MTERP Backend API

Node.js + Express + MongoDB backend for MTERP Construction ERP.

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
# Copy example env and edit as needed
cp .env.example .env
```

3. Start MongoDB (if local):

```bash
mongod
```

4. Seed database (optional):

```bash
npm run seed
```

5. Run server:

```bash
# Development
npm run dev

# Production
npm start
```

## Test Accounts

After seeding, use these credentials:

| Role        | Username   | Password    |
| ----------- | ---------- | ----------- |
| Owner       | owner      | password123 |
| Director    | director   | password123 |
| Supervisor  | supervisor | password123 |
| Asset Admin | admin      | password123 |
| Worker      | worker     | password123 |

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/verify` - Verify OTP
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Projects

- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project
- `POST /api/projects` - Create project (Owner/Director)
- `PUT /api/projects/:id` - Update project
- `PUT /api/projects/:id/progress` - Update progress
- `POST /api/projects/:id/daily-report` - Add daily report
- `DELETE /api/projects/:id` - Delete project (Owner)

### Material Requests

- `GET /api/requests` - List requests
- `POST /api/requests` - Create request
- `PUT /api/requests/:id` - Approve/reject
- `DELETE /api/requests/:id` - Delete request

### Tools

- `GET /api/tools/dashboard` - Dashboard with stats
- `GET /api/tools` - List tools
- `POST /api/tools` - Create tool
- `PUT /api/tools/:id` - Update tool
- `PUT /api/tools/:id/assign` - Assign tool
- `DELETE /api/tools/:id` - Delete tool

### Attendance

- `GET /api/attendance` - List attendance
- `GET /api/attendance/today` - Today's status
- `POST /api/attendance` - Check in
- `PUT /api/attendance/checkout` - Check out

### Kasbon

- `GET /api/kasbon` - List kasbon
- `POST /api/kasbon` - Create request
- `PUT /api/kasbon/:id` - Approve/reject
- `DELETE /api/kasbon/:id` - Delete

## Environment Variables

| Variable    | Description               | Default                         |
| ----------- | ------------------------- | ------------------------------- |
| PORT        | Server port               | 3001                            |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/mterp |
| JWT_SECRET  | JWT signing secret        | -                               |
| EMAIL_HOST  | SMTP host                 | smtp.gmail.com                  |
| EMAIL_PORT  | SMTP port                 | 587                             |
| EMAIL_USER  | SMTP username             | -                               |
| EMAIL_PASS  | SMTP password             | -                               |
