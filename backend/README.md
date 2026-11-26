# Smart Leave & Employee Management System — Spring Boot Backend

RESTful backend service built with **Java 21**, **Spring Boot 3**, **Spring MVC**, **Spring Data JPA / Hibernate**, **Spring Security (JWT)**, **Maven**, and **MySQL 8**.

## Prerequisites

- **Java JDK 21**
- **Apache Maven 3.9+**
- **MySQL 8.0+** running locally or remotely

## 1. Create the MySQL Database

Connect to MySQL and create the database:

```sql
CREATE DATABASE smart_leave_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tables are automatically managed via JPA (`spring.jpa.hibernate.ddl-auto=update`), and an explicit reference DDL script is also provided in `src/main/resources/schema.sql`. On first startup, `DataInitializer` seeds default departments and leave policies (with **no hardcoded passwords**).

## 2. Configure Environment Variables

Copy `.env.example` or export the environment variables in your shell/IDE before starting Spring Boot:

```bash
export DB_URL="jdbc:mysql://localhost:3306/smart_leave_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export DB_USERNAME="root"
export DB_PASSWORD="your_mysql_password"

# Generate a secure Base64-encoded 256-bit (32-byte) secret:
# openssl rand -base64 32
export JWT_SECRET="replace_with_base64_encoded_32_byte_secret"
export JWT_EXPIRATION_MS="86400000"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
```

## 3. Run the Spring Boot Application

From the `/backend` folder:

```bash
mvn clean spring-boot:run
```

The API server starts on `http://localhost:8080`.

## 4. Connect the React Frontend

In the root React project, create `.env.local` (or `.env`):

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8080/api
```

Restart `npm run dev` on port `3000`. When connecting to a fresh database with no administrator account yet, the login page will automatically prompt you to create your first Admin account via `POST /api/auth/bootstrap-admin`.

## 5. REST API Overview

| Domain | Endpoints |
| :--- | :--- |
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/bootstrap-status`, `POST /api/auth/bootstrap-admin` |
| **Employees** | `GET/POST /api/employees`, `GET/PUT/DELETE /api/employees/{id}`, `GET /api/employees/{id}/leave-balance` |
| **Departments** | `GET/POST /api/departments`, `PUT/DELETE /api/departments/{id}` |
| **Leaves** | `POST /api/leaves`, `GET /api/leaves`, `GET /api/leaves/my`, `GET /api/leaves/{id}`, `PUT /api/leaves/{id}/approve`, `PUT /api/leaves/{id}/reject`, `GET /api/leaves/balance/my` |
| **Policies** | `GET/POST /api/leave-policies`, `PUT/DELETE /api/leave-policies/{id}` |
| **Dashboard** | `GET /api/dashboard/admin`, `GET /api/dashboard/manager`, `GET /api/dashboard/employee` |
| **Notifications** | `GET /api/notifications`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all` |
