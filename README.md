Agriculture Management System – Backend

About the Project

The Agriculture Management System is a backend application developed to manage agricultural activities and farm operations.

It provides REST APIs for managing users and other farm-related modules.

Technologies Used

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JavaScript
- JWT Authentication
- bcrypt
- CORS
- Helmet

Key Features

- User Registration and Login
- Admin Authentication and Authorization
- Pending User Registration
- Admin User Approval System
- User Management (Create, Read, Update, Delete)
- Role-Based Access Control
- Password Hashing
- RESTful API Development
- PostgreSQL Database Integration

User Approval System

- New users can register through the registration API.
- Newly registered users are assigned an inactive status.
- Admin can view pending users.
- Admin can approve registered users.
- Approved users can log in to the system.

Project Structure

backend/
├── config/
├── controllers/
├── middleware/
├── models/
├── public/
├── routes/
├── utils/
├── app.js
├── package.json
├── package-lock.json
└── .env.example

Installation and Setup

1. Clone the Repository

git clone YOUR_REPOSITORY_URL

2. Open the Project

cd backend

3. Install Dependencies

npm install

4. Configure Environment Variables

Create a ".env" file using ".env.example" as a guide.

Add your own database credentials and JWT secret. Never upload your ".env" file to GitHub.

5. Run the Server

Use the start command configured in "package.json".

The default backend port is 5000 unless changed in the environment configuration.

API Base URL

http://localhost:5000/api

Main User API Routes

Method| Endpoint| Description
POST| /users/register| Register a new user
POST| /users/login| User login
POST| /users/create| Admin creates a user
GET| /users| Get users
GET| /users/:id| Get user by ID
PUT| /users/:id| Update user
DELETE| /users/:id| Delete user
POST| /users/logout| User logout

Admin-protected routes require valid authentication and authorization.

Developer

Agriculture Management System – Backend Development Project.

License

This project is developed for educational and development purposes.
