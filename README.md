# Task Management System

A full-stack web application for task management with React frontend, Node.js/Express backend, JWT authentication, file uploads, and PostgreSQL database.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: CRUD operations for users with admin privileges
- **Task Management**: Complete CRUD operations for tasks
- **File Uploads**: Attach up to 3 PDF documents per task
- **Filtering & Sorting**: Filter tasks by status, priority, and due date
- **Real-time Updates**: WebSocket integration for live task updates
- **Responsive UI**: Built with React and TailwindCSS
- **Containerized**: Docker and Docker Compose setup

## Tech Stack

### Frontend
- React 18
- Redux Toolkit for state management
- React Router for navigation
- TailwindCSS for styling
- Axios for API calls
- Socket.io-client for real-time updates

### Backend
- Node.js with Express
- JWT for authentication
- Multer for file uploads
- Socket.io for real-time features
- Swagger for API documentation
- Jest for testing

### Database
- PostgreSQL with Sequelize ORM
- File metadata storage with local/cloud file storage

### DevOps
- Docker & Docker Compose
- Automated testing with Jest
- API documentation with Swagger

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (if running locally)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/1234-ad/task-management-system.git
cd task-management-system
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

### Local Development

1. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. Set up environment variables:
```bash
# Backend (.env)
cp backend/.env.example backend/.env
# Edit the .env file with your database credentials
```

3. Start PostgreSQL and run migrations:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

4. Start the development servers:
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm start
```

## API Documentation

The API documentation is available at `/api-docs` when the backend is running. Key endpoints include:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Tasks
- `GET /api/tasks` - List tasks with filtering/sorting
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/documents` - Upload documents
- `GET /api/tasks/:id/documents/:docId` - Download document

## Testing

Run the test suite:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Test coverage
npm run test:coverage
```

## Project Structure

```
task-management-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskmanagement
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
UPLOAD_PATH=./uploads
```

## Deployment

The application is containerized and can be deployed to any platform supporting Docker:

- **Heroku**: Use the included `heroku.yml`
- **AWS**: Deploy using ECS or Elastic Beanstalk
- **DigitalOcean**: Use App Platform or Droplets
- **Vercel**: Frontend deployment with serverless functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.