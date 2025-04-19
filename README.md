# Grouple Booking System

## Demo Video

[View Project Demo Video (Loom)](https://www.loom.com/share/c06c0416359849db9aa9d4c8b434205f?sid=ae6c4c19-0d09-4f01-a797-e38637bdcf13)

## Project Overview

This full-stack web application implements a complete booking management system using React.js (frontend), Node.js & Express.js (backend), and MySQL (database). The system includes real-time communication features, authentication, and is deployed to AWS cloud services.

## Completed Tasks

### Task 1: Frontend Implementation ✅

- React.js frontend with intuitive UI for the booking system
- User authentication (signup & login) with JWT
- Dashboard pages for managing bookings (CRUD operations)
- Pagination and sorting functionality
- Error handling and loading states
- State management using React Context API

### Task 2: RESTful API Backend ✅

- JWT authentication and authorization
- Input validation and error handling
- MySQL database integration using Sequelize ORM
- Pagination and sorting for efficient querying
- Caching of frequently accessed resources using Redis

### Task 3: Real-Time Communication ✅

- Implemented WebSocket connection using Socket.IO
- Bidirectional communication between clients and server
- Integration with existing RESTful API for real-time updates
- Real-time chat interface for communication

### Task 4: AWS Deployment ✅

- Frontend deployed to EC2: http://13.201.5.90:5173
- Backend API deployed to EC2: http://13.201.5.90:3000
- Database deployed on AWS RDS
- User profile image uploads stored in S3
- VPC between EC2 and RDS
- Configured autoscaling for EC2 instances

## Deployment Details

### API Documentation

- Swagger Documentation: http://13.201.5.90:3000/api-docs

- Postman Collection: [Grouple Booking System API.postman_collection.json](/Grouple%20Booking%20System%20API.postman_collection.json)
- Postman Environment: [Grouple Api Environment Variables.postman_environment.json](/Grouple%20Api%20Environment%20Variables.postman_environment.json)

### MySQL Database on AWS RDS

- Host: grouple-booking.c5ky0w4ogkab.ap-south-1.rds.amazonaws.com
- Port: 3306
- Connected successfully from EC2 via VPC

### S3 Bucket for Profile Image Uploads

- Name: grouple-user-uploads
- Bucket Policy: Public access blocked, signed URL access only

## Project Files

### Database

- MySQL Schema file: [mysql-schema.sql](/mysql-schema.sql)

## Running Locally

1. Clone the repository
2. Install dependencies:

```
pnpm install
```

3. Set up environment variables:

   - Copy `.env.example` to `.env` in the api directory
   - Configure database and AWS credentials

4. Start development servers:

```
npm run dev
```

This will concurrently start both the frontend and backend services.

## Project Structure

- `apps/api`: Backend Express.js application
- `apps/web`: Frontend React.js application
- `packages`: Shared configuration packages

## Security Note

- All AWS credentials are securely stored
- S3 bucket has proper access controls
- VPC isolates database from public access

## Test Credentials

### Normal User

- Email: normaluser@gmail.com
- Password: Test@user10

### Admin Users

- Email: admin@gmail.com
- Password: Test@admin10

- Email: admin2@gmail.com
- Password: Test@admin10
