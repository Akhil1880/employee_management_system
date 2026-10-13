# Employee Management Backend

Spring Boot REST API and H2 persistence module for the India-localized Employee
Management System. The frontend is maintained separately in
[`employee_management_frontend`](https://github.com/Akhil1880/employee_management_frontend).

## Requirements

- Java 25
- Maven 3.9+

## Run locally

From this directory:

```powershell
mvn spring-boot:run
```

The API starts at `http://localhost:8080`. On first launch it seeds sample
Indian employee records when the database is empty. H2 stores data in
`data/employees.mv.db`.

The frontend development server proxies its `/api` requests to this backend
by default. To run the frontend against another backend URL, set `BACKEND_URL`
when starting Vite.

## API

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/employees` | List all employees |
| `GET` | `/api/employees/{id}` | Get an employee |
| `POST` | `/api/employees` | Create an employee |
| `PUT` | `/api/employees/{id}` | Update an employee |
| `DELETE` | `/api/employees/{id}` | Delete an employee |

Employee JSON includes `name`, `email`, `role`, `department`, `status`,
`salary` (INR), and `joinDate` (`YYYY-MM-DD`). Status must be `Active`,
`On Leave`, or `Inactive`; email addresses must be unique.

## Test

```powershell
mvn test
```

Tests use an in-memory H2 database and do not modify the local development
database.
